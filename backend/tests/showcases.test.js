const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculateShowcaseMetrics,
  defaultShowcases,
} = require('../services/showcaseService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-showcases-'));
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

test('showcase service calculates tournament statistics and club representation', () => {
  const metrics = calculateShowcaseMetrics(defaultShowcases);

  assert.equal(metrics.totalShowcases, 3);
  assert.equal(metrics.attendingCount, 1);
  assert.equal(metrics.invitedCount, 2);
  assert.ok(metrics.totalScoutsAttending >= 40);
  assert.ok(metrics.uniqueClubsRepresented >= 10);
});

test('showcases endpoint returns player tournaments and metrics', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/showcases/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(Array.isArray(body.showcases));
    assert.ok(body.showcases.length >= 2);
    assert.ok(body.metrics.totalShowcases >= 2);
  });
});

test('updating showcase RSVP transitions status and broadcasts socket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
  };

  await withApi(async (baseUrl) => {
    const { response: rsvpRes, body: updated } = await request(
      baseUrl,
      '/showcases/demo-player/showcase-2/rsvp',
      {
        method: 'POST',
        body: JSON.stringify({
          rsvpStatus: 'Attending',
          assignedSquad: 'Team South • Attacking Midfielder (#10)',
        }),
      }
    );

    assert.equal(rsvpRes.status, 200);
    assert.equal(updated.rsvpStatus, 'Attending');
    assert.equal(updated.assignedSquad, 'Team South • Attacking Midfielder (#10)');

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'showcase_rsvp_updated');
  }, { socketService: fakeSocket });
});
