const crypto = require('crypto');
const EventEmitter = require('events');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Creates a lightweight RFC 6455 WebSocket server attached to an HTTP server.
 * Handles authenticated handshakes, room routing, heartbeat ping/pong,
 * and live messaging events for the NiceScout platform.
 */
class WebSocketService extends EventEmitter {
  constructor({ path = '/ws', heartbeatIntervalMs = 30000, store } = {}) {
    super();
    this.path = path;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.store = store;
    this.clients = new Map(); // socket -> clientData
    this.rooms = new Map(); // roomName -> Set of sockets
    this.stats = {
      totalConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
    };
    this.heartbeatTimer = null;
  }

  /**
   * Attaches the WebSocket upgrade handler to an existing Node.js HTTP server.
   */
  attach(server) {
    this.server = server;

    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (url.pathname !== this.path) {
        socket.destroy();
        return;
      }

      const key = req.headers['sec-websocket-key'];
      const version = req.headers['sec-websocket-version'];

      if (!key || version !== '13') {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const acceptKey = crypto
        .createHash('sha1')
        .update(key + WS_GUID)
        .digest('base64');

      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n',
      ];

      socket.write(responseHeaders.join('\r\n'));

      this._handleNewSocket(socket, req, url);
    });

    this._startHeartbeat();
  }

  _handleNewSocket(socket, req, url) {
    const clientId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const clientData = {
      id: clientId,
      socket,
      ip: req.socket.remoteAddress,
      user: null,
      authenticated: false,
      isAlive: true,
      rooms: new Set(),
      connectedAt: new Date().toISOString(),
    };

    this.clients.set(socket, clientData);
    this.stats.totalConnections += 1;

    // Check for token in query params
    const token = url.searchParams.get('token') || url.searchParams.get('userId');
    if (token) {
      this._authenticateClient(clientData, token);
    }

    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      buffer = this._processFrames(socket, clientData, buffer);
    });

    socket.on('close', () => {
      this._handleDisconnect(socket);
    });

    socket.on('error', (err) => {
      this.emit('client_error', { clientId: clientData.id, error: err.message });
      this._handleDisconnect(socket);
    });

    // Send connection established welcome event
    this.send(socket, {
      type: 'connection_established',
      clientId: clientData.id,
      serverTime: new Date().toISOString(),
      heartbeatInterval: this.heartbeatIntervalMs,
    });

    this.emit('connection', clientData);
  }

  _processFrames(socket, clientData, buffer) {
    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];

      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) === 0x80;
      let payloadLength = secondByte & 0x7f;

      let offset = 2;

      if (payloadLength === 126) {
        if (buffer.length < 4) return buffer;
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (buffer.length < 10) return buffer;
        const high = buffer.readUInt32BE(2);
        const low = buffer.readUInt32BE(6);
        payloadLength = high * 4294967296 + low;
        offset = 10;
      }

      let maskKey = null;
      if (masked) {
        if (buffer.length < offset + 4) return buffer;
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLength) {
        return buffer; // Wait for full frame payload
      }

      let payload = buffer.slice(offset, offset + payloadLength);
      if (masked && maskKey) {
        const unmasked = Buffer.alloc(payloadLength);
        for (let i = 0; i < payloadLength; i++) {
          unmasked[i] = payload[i] ^ maskKey[i % 4];
        }
        payload = unmasked;
      }

      buffer = buffer.slice(offset + payloadLength);

      // Handle standard opcodes
      if (opcode === 0x8) {
        // Close frame
        this._handleDisconnect(socket);
        try {
          socket.end();
        } catch (_) {}
        return buffer;
      } else if (opcode === 0x9) {
        // Ping frame
        this._sendRawFrame(socket, 0xa, payload); // Respond with Pong
      } else if (opcode === 0xa) {
        // Pong frame
        clientData.isAlive = true;
      } else if (opcode === 0x1) {
        // Text frame
        const messageText = payload.toString('utf8');
        this._handleClientMessage(clientData, messageText);
      }
    }

    return buffer;
  }

  _handleClientMessage(clientData, messageText) {
    this.stats.messagesReceived += 1;
    let message;
    try {
      message = JSON.parse(messageText);
    } catch (_) {
      this.send(clientData.socket, {
        type: 'error',
        message: 'Invalid JSON payload received',
      });
      return;
    }

    clientData.isAlive = true;
    const type = message.type;

    switch (type) {
      case 'ping':
        this.send(clientData.socket, {
          type: 'pong',
          timestamp: Date.now(),
        });
        break;

      case 'auth':
        this._authenticateClient(clientData, message.token || message.userId, message.user);
        break;

      case 'subscribe':
        if (message.room) {
          this.joinRoom(clientData.socket, message.room);
          this.send(clientData.socket, {
            type: 'subscribed',
            room: message.room,
          });
        }
        break;

      case 'unsubscribe':
        if (message.room) {
          this.leaveRoom(clientData.socket, message.room);
          this.send(clientData.socket, {
            type: 'unsubscribed',
            room: message.room,
          });
        }
        break;

      case 'chat_message':
        this._handleChatMessage(clientData, message);
        break;

      case 'typing':
        this._handleTyping(clientData, message);
        break;

      default:
        this.emit('message', { client: clientData, message });
        break;
    }
  }

  _authenticateClient(clientData, tokenOrId, optionalUser) {
    clientData.authenticated = true;
    clientData.userId = tokenOrId;
    clientData.user = optionalUser || {
      id: tokenOrId,
      name: `Player-${String(tokenOrId).slice(0, 4)}`,
    };

    // Auto-join personal player/scout room and global broadcast room
    this.joinRoom(clientData.socket, `user:${clientData.userId}`);
    this.joinRoom(clientData.socket, 'global');

    this.send(clientData.socket, {
      type: 'auth_success',
      userId: clientData.userId,
      user: clientData.user,
      rooms: Array.from(clientData.rooms),
      serverTime: new Date().toISOString(),
    });

    this.emit('authenticated', clientData);
  }

  _handleChatMessage(clientData, message) {
    const { conversationId, text, attachments = [], recipientId } = message;
    if (!conversationId || (!text && attachments.length === 0)) return;

    const chatPayload = {
      type: 'chat_message',
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      conversationId,
      senderId: clientData.userId || clientData.id,
      senderName: clientData.user ? clientData.user.name : 'Unknown User',
      text,
      attachments,
      timestamp: new Date().toISOString(),
      delivered: true,
    };

    // Broadcast to room
    this.broadcastToRoom(`chat:${conversationId}`, chatPayload);

    // If specific recipient room exists, notify them directly
    if (recipientId) {
      this.broadcastToRoom(`user:${recipientId}`, {
        type: 'notification',
        category: 'chat',
        title: `New message from ${chatPayload.senderName}`,
        preview: text || 'Sent an attachment',
        conversationId,
      });
    }

    this.emit('chat_message', chatPayload);
  }

  _handleTyping(clientData, message) {
    const { conversationId, isTyping } = message;
    if (!conversationId) return;

    this.broadcastToRoom(
      `chat:${conversationId}`,
      {
        type: 'typing',
        conversationId,
        userId: clientData.userId || clientData.id,
        userName: clientData.user ? clientData.user.name : 'User',
        isTyping: Boolean(isTyping),
      },
      clientData.socket
    );
  }

  joinRoom(socket, room) {
    const clientData = this.clients.get(socket);
    if (!clientData) return;

    clientData.rooms.add(room);

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(socket);
  }

  leaveRoom(socket, room) {
    const clientData = this.clients.get(socket);
    if (clientData) {
      clientData.rooms.delete(room);
    }

    if (this.rooms.has(room)) {
      const roomSet = this.rooms.get(room);
      roomSet.delete(socket);
      if (roomSet.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  broadcastToRoom(room, data, excludeSocket = null) {
    if (!this.rooms.has(room)) return;

    const sockets = this.rooms.get(room);
    for (const socket of sockets) {
      if (socket !== excludeSocket) {
        this.send(socket, data);
      }
    }
  }

  broadcast(data, excludeSocket = null) {
    for (const [socket] of this.clients) {
      if (socket !== excludeSocket) {
        this.send(socket, data);
      }
    }
  }

  sendToUser(userId, data) {
    this.broadcastToRoom(`user:${userId}`, data);
  }

  send(socket, data) {
    if (!socket || socket.destroyed || !socket.writable) return;
    const messageText = typeof data === 'string' ? data : JSON.stringify(data);
    const payloadBuffer = Buffer.from(messageText, 'utf8');

    this._sendRawFrame(socket, 0x1, payloadBuffer);
    this.stats.messagesSent += 1;
  }

  _sendRawFrame(socket, opcode, payload) {
    const payloadLength = payload.length;
    let header;

    if (payloadLength < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | (opcode & 0x0f); // FIN + opcode
      header[1] = payloadLength; // Unmasked from server
    } else if (payloadLength <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 126;
      header.writeUInt16BE(payloadLength, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(payloadLength, 6);
    }

    try {
      socket.write(Buffer.concat([header, payload]));
    } catch (_) {}
  }

  _startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      for (const [socket, clientData] of this.clients) {
        if (!clientData.isAlive) {
          this._handleDisconnect(socket);
          try {
            socket.destroy();
          } catch (_) {}
          continue;
        }

        clientData.isAlive = false;
        // Send ping frame (opcode 0x9)
        this._sendRawFrame(socket, 0x9, Buffer.from('ping'));
      }
    }, this.heartbeatIntervalMs);

    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  _handleDisconnect(socket) {
    const clientData = this.clients.get(socket);
    if (!clientData) return;

    for (const room of clientData.rooms) {
      this.leaveRoom(socket, room);
    }

    this.clients.delete(socket);
    this.emit('disconnect', clientData);
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      rooms: Array.from(this.rooms.keys()),
      totalConnections: this.stats.totalConnections,
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
    };
  }

  close() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    for (const [socket] of this.clients) {
      this._handleDisconnect(socket);
      try {
        socket.destroy();
      } catch (_) {}
    }
    this.clients.clear();
    this.rooms.clear();
  }
}

function createSocketService(options) {
  return new WebSocketService(options);
}

module.exports = {
  WebSocketService,
  createSocketService,
};
