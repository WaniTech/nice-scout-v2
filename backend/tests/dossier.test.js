const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  compileDossier,
  generateDossierExport,
} = require('../services/dossierService');

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = response.status === 204
    ? null
    : contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  return { response, body };
}

async function withApi(run, options = {}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-dossier-'));
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

test('dossier service compiles player data with tactical, medical, and GPS metrics', () => {
  const dummyData = {
    passports: [{ playerId: 'test-p', metrics: { fifaId: 'FIFA-9988' } }],
    transfers: [{ playerId: 'test-p', valuation: { estimatedValueEur: 210000, valueRangeMinEur: 180000, valueRangeMaxEur: 250000 }, transferStatus: 'Free Agent' }],
    medicals: [{ playerId: 'test-p', clearanceStatus: 'Grade A Cleared' }],
    gpsReports: [{ playerId: 'test-p', peakSprintSpeedKmh: 34.2 }],
  };

  const dossier = compileDossier(dummyData, 'test-p');
  assert.equal(dossier.playerId, 'test-p');
  assert.equal(dossier.sections.transferAndValuation.estimatedValueEur, 210000);
  assert.equal(dossier.sections.transferAndValuation.fifaTalentId, 'FIFA-9988');
  assert.equal(dossier.sections.medicalClearance.status, 'Grade A Cleared');
  assert.equal(dossier.sections.athleticGps.peakSprintSpeed, '34.2 km/h');
});

test('dossier service generates export records with download URLs', () => {
  const dummyDossier = {
    playerId: 'demo-player',
    version: '2026.3',
    exportsHistory: [],
  };

  const exp = generateDossierExport(dummyDossier, {
    format: 'PDF',
    targetClub: 'AZ Alkmaar',
    scoutRecipient: 'Lars van der Beek',
  });

  assert.equal(exp.format, 'PDF');
  assert.equal(exp.targetClub, 'AZ Alkmaar');
  assert.ok(exp.downloadUrl.includes('/api/dossier/demo-player/export/'));
  assert.equal(dummyDossier.exportsHistory.length, 1);
});

test('GET /api/dossier/:playerId returns full dossier intelligence', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/dossier/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(body.dossierId.startsWith('DOS-'));
    assert.ok(body.scoutSummary.readinessRating > 0);
    assert.ok(Array.isArray(body.exportTemplates));
    assert.ok(body.exportTemplates.length >= 3);
  });
});

test('POST /api/dossier/:playerId/export generates export and broadcasts websocket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/dossier/demo-player/export', {
      method: 'POST',
      body: JSON.stringify({
        format: 'JSON',
        targetClub: 'SC Freiburg II',
        scoutRecipient: 'Lena Weiss',
        templateId: 'template-executive',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.format, 'JSON');
    assert.equal(body.targetClub, 'SC Freiburg II');
    assert.equal(body.status, 'Delivered');

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'dossier_export_generated');
  }, { socketService: fakeSocket });
});

test('GET /api/dossier/:playerId/export/:filename serves mock exported file', async () => {
  await withApi(async (baseUrl) => {
    // Check existing export exp-1
    const { response, body } = await request(baseUrl, '/dossier/demo-player/export/exp-1.pdf');
    assert.equal(response.status, 200);
    assert.ok(typeof body === 'string');
    assert.ok(body.includes('Mock Scout Intelligence Dossier Export'));
  });
});
