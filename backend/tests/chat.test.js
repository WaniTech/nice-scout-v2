const assert = require('node:assert/strict');
const test = require('node:test');
const { createApp } = require('../app');

function createTestStore(initialData = {}) {
  const storeData = {
    users: [],
    opportunities: [],
    applications: [],
    profiles: [],
    preferences: [],
    clips: [],
    messages: [
      {
        id: '1',
        playerId: 'demo-player',
        club: 'Aarhus Fremad',
        sender: 'Jonas Møller (Chief Scout)',
        role: 'Scout',
        subject: 'Trial invitation — attacking midfielder / winger',
        preview: 'We have analyzed your recent video reels and want to invite you.',
        body: 'We have analyzed your recent video reels and want to invite you to an on-site trial with our first team.',
        time: 'Today, 09:30',
        unread: true,
        opportunityId: 'opp-1',
        replies: [],
      },
    ],
    ...initialData,
  };

  return {
    read: async () => JSON.parse(JSON.stringify(storeData)),
    update: async (mutator) => {
      const cloned = JSON.parse(JSON.stringify(storeData));
      const result = await mutator(cloned);
      Object.assign(storeData, cloned);
      return result;
    },
    findUserById: async (id) => storeData.users.find((u) => u.id === id) || null,
  };
}

async function startTestApp(store) {
  const app = createApp({ store });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}/api`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('creates a real-time message reply with attachments and clears unread status', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const response = await fetch(`${baseUrl}/player/demo-player/messages/1/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: 'Thank you for the invitation! I have attached my latest match highlights and available dates.',
        attachments: ['match-clips', 'availability-window'],
      }),
    });

    assert.equal(response.status, 201);
    const reply = await response.json();
    assert.ok(reply.id);
    assert.equal(reply.body, 'Thank you for the invitation! I have attached my latest match highlights and available dates.');
    assert.deepEqual(reply.attachments, ['match-clips', 'availability-window']);

    const data = await store.read();
    const updatedMessage = data.messages.find((m) => m.id === '1');
    assert.equal(updatedMessage.unread, false);
    assert.equal(updatedMessage.replies.length, 1);
  } finally {
    await close();
  }
});

test('archives a conversation successfully', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const response = await fetch(`${baseUrl}/player/demo-player/messages/1/archive`, {
      method: 'PATCH',
    });

    assert.equal(response.status, 200);
    const archived = await response.json();
    assert.equal(archived.archived, true);

    const data = await store.read();
    assert.equal(data.messages[0].archived, true);
  } finally {
    await close();
  }
});

test('returns 404 when replying to non-existent message', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const response = await fetch(`${baseUrl}/player/demo-player/messages/999/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hello?' }),
    });

    assert.equal(response.status, 404);
  } finally {
    await close();
  }
});
