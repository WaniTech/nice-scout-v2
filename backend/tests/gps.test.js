const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const { calculateWorkloadDiagnostics, defaultGpsSessions } = require('../services/gpsService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-gps-'));
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

test('gps service calculates ACWR ratios, injury risk zones, and peak sprint speed', () => {
  const diagnostics = calculateWorkloadDiagnostics(defaultGpsSessions);

  assert.ok(diagnostics.acwr > 0.8 && diagnostics.acwr < 1.4);
  assert.equal(diagnostics.injuryRiskZone, 'Optimal (Sweet Spot)');
  assert.equal(diagnostics.topSpeedPeak, 34.6);
  assert.ok(diagnostics.readinessScore >= 90);
  assert.ok(diagnostics.totalDistanceKm > 20);
});

test('player gps report can be retrieved with diagnostics and historical sessions', async () => {
  await withApi(async (baseUrl) => {
    const res = await request(baseUrl, '/gps/demo-player');
    assert.equal(res.response.status, 200);
    assert.equal(res.body.playerId, 'demo-player');
    assert.ok(res.body.diagnostics);
    assert.ok(res.body.sessions.length >= 3);
    assert.equal(res.body.sessions[0].sessionType, 'Match Simulation');
  });
});

test('logging a new gps athletic session computes player load and prepends log', async () => {
  await withApi(async (baseUrl) => {
    const addRes = await request(baseUrl, '/gps/demo-player', {
      method: 'POST',
      body: JSON.stringify({
        sessionType: 'Speed & Agility Assessment',
        durationMinutes: 60,
        totalDistanceKm: 6.8,
        highSpeedRunningMeters: 720,
        sprintDistanceMeters: 310,
        topSpeedKmh: 34.9,
        accelerationsCount: 38,
        decelerationsCount: 34,
        notes: 'Personal best top sprint speed achieved on turf.',
      }),
    });

    assert.equal(addRes.response.status, 201);
    assert.equal(addRes.body.sessionType, 'Speed & Agility Assessment');
    assert.equal(addRes.body.topSpeedKmh, 34.9);
    assert.ok(addRes.body.playerLoadScore > 0);

    const getRes = await request(baseUrl, '/gps/demo-player');
    assert.equal(getRes.response.status, 200);
    assert.ok(getRes.body.sessions.some((s) => s.sessionType === 'Speed & Agility Assessment'));
    assert.equal(getRes.body.diagnostics.topSpeedPeak, 34.9);
  });
});

test('logging a gps session broadcasts real-time socket event to player room', async () => {
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
    await request(baseUrl, '/gps/demo-player', {
      method: 'POST',
      body: JSON.stringify({
        sessionType: 'Endurance Flush Run',
        totalDistanceKm: 5.2,
      }),
    });

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'gps_session_logged')
    );
  }, { socketService: mockSocketService });
});
