const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { createSocketService } = require('../services/socketService');

function connectRawWebSocket(port, path = '/ws') {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      port,
      host: '127.0.0.1',
      path,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': key,
      },
    });

    req.on('upgrade', (res, socket) => {
      const client = new TestWebSocketClient(socket);
      resolve(client);
    });

    req.on('error', reject);
    req.end();
  });
}

class TestWebSocketClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.queue = [];
    this.waiters = [];

    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this._drainFrames();
    });
  }

  _drainFrames() {
    while (this.buffer.length >= 2) {
      const secondByte = this.buffer[1];
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < 4) return;
        payloadLength = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) return;
        const high = this.buffer.readUInt32BE(2);
        const low = this.buffer.readUInt32BE(6);
        payloadLength = high * 4294967296 + low;
        offset = 10;
      }

      if (this.buffer.length < offset + payloadLength) {
        return;
      }

      const payload = this.buffer.slice(offset, offset + payloadLength);
      this.buffer = this.buffer.slice(offset + payloadLength);

      try {
        const parsed = JSON.parse(payload.toString('utf8'));
        if (this.waiters.length > 0) {
          const resolve = this.waiters.shift();
          resolve(parsed);
        } else {
          this.queue.push(parsed);
        }
      } catch (_) {}
    }
  }

  nextMessage(timeoutMs = 3000) {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift());
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(resolve);
        if (idx !== -1) this.waiters.splice(idx, 1);
        reject(new Error(`Timed out waiting for WebSocket message after ${timeoutMs}ms`));
      }, timeoutMs);

      this.waiters.push((msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  send(data) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const payload = Buffer.from(text, 'utf8');
    const maskKey = crypto.randomBytes(4);
    const maskedPayload = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      maskedPayload[i] = payload[i] ^ maskKey[i % 4];
    }

    let header;
    if (payload.length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81;
      header[1] = 0x80 | payload.length;
    } else {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    }

    this.socket.write(Buffer.concat([header, maskKey, maskedPayload]));
  }

  close() {
    try {
      this.socket.destroy();
    } catch (_) {}
  }
}

test('socket service connects and completes auth handshake', { timeout: 5000 }, async () => {
  const store = { users: [] };
  const socketService = createSocketService({ store });
  const app = createApp({ store, socketService });
  const server = http.createServer(app);
  socketService.attach(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  let client;
  try {
    client = await connectRawWebSocket(port);

    const welcome = await client.nextMessage();
    assert.equal(welcome.type, 'connection_established');
    assert.ok(welcome.clientId);

    client.send({
      type: 'auth',
      userId: 'demo-player-42',
      user: { id: 'demo-player-42', name: 'Jordan Pace' },
    });

    const authRes = await client.nextMessage();
    assert.equal(authRes.type, 'auth_success');
    assert.equal(authRes.userId, 'demo-player-42');

    const stats = socketService.getStats();
    assert.equal(stats.connectedClients, 1);
    assert.ok(stats.rooms.includes('user:demo-player-42'));
  } finally {
    if (client) client.close();
    socketService.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('socket service handles room subscriptions and live chat message distribution', { timeout: 5000 }, async () => {
  const store = { users: [] };
  const socketService = createSocketService({ store });
  const app = createApp({ store, socketService });
  const server = http.createServer(app);
  socketService.attach(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  let sender;
  let receiver;
  try {
    sender = await connectRawWebSocket(port);
    receiver = await connectRawWebSocket(port);

    const senderWelcome = await sender.nextMessage();
    const receiverWelcome = await receiver.nextMessage();
    assert.equal(senderWelcome.type, 'connection_established');
    assert.equal(receiverWelcome.type, 'connection_established');

    // Receiver subscribes to chat room
    receiver.send({
      type: 'subscribe',
      room: 'chat:conversation-scout-1',
    });

    const subRes = await receiver.nextMessage();
    assert.equal(subRes.type, 'subscribed');
    assert.equal(subRes.room, 'chat:conversation-scout-1');

    // Sender emits chat message into that room
    sender.send({
      type: 'chat_message',
      conversationId: 'conversation-scout-1',
      text: 'Hello Scout, excited for the upcoming trial!',
    });

    const receivedChat = await receiver.nextMessage();
    assert.equal(receivedChat.type, 'chat_message');
    assert.equal(receivedChat.conversationId, 'conversation-scout-1');
    assert.equal(receivedChat.text, 'Hello Scout, excited for the upcoming trial!');
  } finally {
    if (sender) sender.close();
    if (receiver) receiver.close();
    socketService.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
