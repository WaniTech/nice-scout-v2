const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const { calculateTelestrationSummary, defaultTelestrations } = require('../services/annotationService');

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

async function withApi(run, options = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-annotations-'));
  const store = createJsonStore({
    filePath: path.join(tempDir, 'db.json'),
    seedData,
  });
  await store.reset();

  const server = createApp({ store, ...options }).listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await run(baseUrl, store);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test('annotation service computes verified counts, categories, and readiness index', () => {
  const summary = calculateTelestrationSummary(defaultTelestrations);

  assert.equal(summary.totalAnnotations, 2);
  assert.equal(summary.verifiedCount, 2);
  assert.equal(summary.categoryCount, 2);
  assert.ok(summary.scoutReadinessIndex >= 80);
});

test('video telestration report can be retrieved with taxonomy and annotations', async () => {
  await withApi(async (baseUrl) => {
    const res = await request(baseUrl, '/annotations/demo-player');
    assert.equal(res.response.status, 200);
    assert.equal(res.body.playerId, 'demo-player');
    assert.ok(res.body.summary.totalAnnotations >= 2);
    assert.ok(res.body.taxonomy.length >= 5);
    assert.ok(res.body.annotations.length >= 2);
    assert.equal(res.body.annotations[0].title, '1v1 Acceleration & Near-Post Cutback');
  });
});

test('filtering annotations by clipId returns scoped telestration list', async () => {
  await withApi(async (baseUrl) => {
    const res = await request(baseUrl, '/annotations/demo-player?clipId=clip-1');
    assert.equal(res.response.status, 200);
    assert.ok(res.body.annotations.every((a) => a.clipId === 'clip-1'));
  });
});

test('creating a new video annotation stores markup and timestamps', async () => {
  await withApi(async (baseUrl) => {
    const addRes = await request(baseUrl, '/annotations/demo-player', {
      method: 'POST',
      body: JSON.stringify({
        clipId: 'clip-3',
        title: 'High Press Acceleration & Trap Trigger',
        timestampSeconds: 28.5,
        type: 'Spotlight',
        tacticalCategory: 'Defensive Pressing',
        coachingNote: 'Anticipated opponent backpass and forced turnover in attacking third.',
        verifiedByScout: 'Lena Weiss (SC Freiburg II)',
      }),
    });

    assert.equal(addRes.response.status, 201);
    assert.equal(addRes.body.clipId, 'clip-3');
    assert.equal(addRes.body.title, 'High Press Acceleration & Trap Trigger');
    assert.equal(addRes.body.timestampFormatted, '00:28.50');
    assert.ok(addRes.body.shareableUrl.includes('clip-3'));

    const listRes = await request(baseUrl, '/annotations/demo-player');
    assert.equal(listRes.response.status, 200);
    assert.ok(listRes.body.annotations.some((a) => a.title === 'High Press Acceleration & Trap Trigger'));
  });
});

test('deleting an annotation removes it and broadcasts socket deletion event', async () => {
  const socketEvents = [];
  const mockSocketService = {
    getStats() {
      return { connectedClients: 1, activeRooms: 1 };
    },
    broadcastToRoom(room, message) {
      socketEvents.push({ room, message });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const deleteRes = await request(baseUrl, '/annotations/demo-player/tel-1', {
      method: 'DELETE',
    });

    assert.equal(deleteRes.response.status, 204);

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'video_telestration_deleted')
    );

    const getRes = await request(baseUrl, '/annotations/demo-player');
    assert.equal(getRes.response.status, 200);
    assert.ok(!getRes.body.annotations.some((a) => a.id === 'tel-1'));
  }, { socketService: mockSocketService });
});
