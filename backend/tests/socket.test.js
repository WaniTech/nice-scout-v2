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
      resolve(socket);
    });

    req.on('error', reject);
    req.end();
  });
}

function sendClientFrame(socket, messageText) {
  const payload = Buffer.from(messageText, 'utf8');
  const maskKey = crypto.randomBytes(4);
  const maskedPayload = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) {
    maskedPayload[i] = payload[i] ^ maskKey[i % 4];
  }

  let header;
  if (payload.length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
    header[1] = 0x80 | payload.length; // MASKED + length
  } else {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payload.length, 2);
  }

  socket.write(Buffer.concat([header, maskKey, maskedPayload]));
}

function parseServerFrame(buffer) {
  if (buffer.length < 2) return null;
  const payloadLength = buffer[1] & 0x7f;
  let offset = 2;
  if (payloadLength === 126) {
    offset = 4;
  }
  const payload = buffer.slice(offset, offset + payloadLength);
  return {
    opcode: buffer[0] & 0x0f,
    payload: payload.toString('utf8'),
  };
}

test('socket service connects and completes auth handshake', async () => {
  const store = {
    users: [],
  };
  const socketService = createSocketService({ store });
  const app = createApp({ store, socketService });
  const server = http.createServer(app);
  socketService.attach(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const socket = await connectRawWebSocket(port);

    const welcomePromise = new Promise((resolve) => {
      socket.once('data', (data) => {
        const frame = parseServerFrame(data);
        const parsed = JSON.parse(frame.payload);
        resolve(parsed);
      });
    });

    const welcome = await welcomePromise;
    assert.equal(welcome.type, 'connection_established');
    assert.ok(welcome.clientId);

    // Send auth message
    const authPromise = new Promise((resolve) => {
      socket.once('data', (data) => {
        const frame = parseServerFrame(data);
        const parsed = JSON.parse(frame.payload);
        resolve(parsed);
      });
    });

    sendClientFrame(
      socket,
      JSON.stringify({
        type: 'auth',
        userId: 'demo-player-42',
        user: { id: 'demo-player-42', name: 'Jordan Pace' },
      })
    );

    const authRes = await authPromise;
    assert.equal(authRes.type, 'auth_success');
    assert.equal(authRes.userId, 'demo-player-42');

    const stats = socketService.getStats();
    assert.equal(stats.connectedClients, 1);
    assert.ok(stats.rooms.includes('user:demo-player-42'));

    socket.destroy();
  } finally {
    socketService.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('socket service handles room subscriptions and live chat message distribution', async () => {
  const store = { users: [] };
  const socketService = createSocketService({ store });
  const app = createApp({ store, socketService });
  const server = http.createServer(app);
  socketService.attach(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const sender = await connectRawWebSocket(port);
    const receiver = await connectRawWebSocket(port);

    // Wait for welcome frames on both
    await new Promise((resolve) => sender.once('data', resolve));
    await new Promise((resolve) => receiver.once('data', resolve));

    // Receiver subscribes to chat room
    sendClientFrame(
      receiver,
      JSON.stringify({
        type: 'subscribe',
        room: 'chat:conversation-scout-1',
      })
    );

    await new Promise((resolve) => receiver.once('data', resolve)); // Subscribed confirmation

    // Sender emits a chat message into the room
    const chatReceivePromise = new Promise((resolve) => {
      receiver.once('data', (data) => {
        const frame = parseServerFrame(data);
        const parsed = JSON.parse(frame.payload);
        resolve(parsed);
      });
    });

    sendClientFrame(
      sender,
      JSON.stringify({
        type: 'chat_message',
        conversationId: 'conversation-scout-1',
        text: 'Hello Scout, excited for the upcoming trial!',
      })
    );

    const receivedChat = await chatReceivePromise;
    assert.equal(receivedChat.type, 'chat_message');
    assert.equal(receivedChat.conversationId, 'conversation-scout-1');
    assert.equal(receivedChat.text, 'Hello Scout, excited for the upcoming trial!');

    sender.destroy();
    receiver.destroy();
  } finally {
    socketService.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
