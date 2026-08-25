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
    clips: [
      {
        id: 'clip-1',
        playerId: 'demo-player',
        title: 'Match Highlights vs Randers FC',
        type: 'Match reel',
        focus: '1v1 take-ons & transitional runs',
        opponent: 'Randers FC',
        date: '2026-05-18',
        duration: '02:45',
        status: 'Scout-ready',
        visibility: 'Public link',
        tags: ['1v1', 'Pace', 'Dribbling'],
        notes: 'Full sequence of second-half wing play.',
        views: 14,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    messages: [],
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

test('creates a new player clip asset with default draft status', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const response = await fetch(`${baseUrl}/player/demo-player/clips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Tactical Pressing & Defensive Recovery',
        type: 'Tactical analysis',
        focus: 'High pressing triggers',
        opponent: 'Silkeborg IF',
        date: '2026-06-01',
        duration: '01:30',
        status: 'Draft',
        visibility: 'Private link',
        tags: ['Pressing', 'Work rate'],
        notes: 'Review with agent before sharing with clubs.',
      }),
    });

    assert.equal(response.status, 201);
    const created = await response.json();
    assert.ok(created.id);
    assert.equal(created.title, 'Tactical Pressing & Defensive Recovery');
    assert.equal(created.status, 'Draft');
    assert.equal(created.views, 0);

    const listRes = await fetch(`${baseUrl}/player/demo-player/clips`);
    const clips = await listRes.json();
    assert.equal(clips.length, 2);
  } finally {
    await close();
  }
});

test('updates clip status from Draft to Scout-ready to Sent', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const patchRes = await fetch(`${baseUrl}/player/demo-player/clips/clip-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Sent' }),
    });

    assert.equal(patchRes.status, 200);
    const updated = await patchRes.json();
    assert.equal(updated.status, 'Sent');
  } finally {
    await close();
  }
});

test('deletes a player clip from the media vault', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const delRes = await fetch(`${baseUrl}/player/demo-player/clips/clip-1`, {
      method: 'DELETE',
    });

    assert.equal(delRes.status, 204);

    const listRes = await fetch(`${baseUrl}/player/demo-player/clips`);
    const remaining = await listRes.json();
    assert.equal(remaining.length, 0);
  } finally {
    await close();
  }
});
