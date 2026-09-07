const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculateMedicalReadiness,
  defaultMedicalRecord,
} = require('../services/medicalService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-medical-'));
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

test('medical service calculates clearance readiness and safety tier', () => {
  const readiness = calculateMedicalReadiness(defaultMedicalRecord);
  assert.equal(readiness.clearanceStatus, 'Full Match Clearance');
  assert.equal(readiness.readinessScore, 100);
  assert.equal(readiness.cardiacVerified, true);
  assert.equal(readiness.safetyTier, 'Elite Medical Grade');
});

test('medical endpoint returns player medical record and readiness assessment', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/medical/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(body.record);
    assert.ok(Array.isArray(body.record.injuries));
    assert.ok(body.readiness.readinessScore > 0);
  });
});

test('logging an injury updates medical history and broadcasts websocket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
  };

  await withApi(async (baseUrl) => {
    const injuryPayload = {
      type: 'Calf Strain',
      bodyPart: 'Right Gastrocnemius',
      dateOccurred: '2026-07-10',
      returnToPlayDate: '2026-07-24',
      recoveryWeeks: 2,
      recurrenceRisk: 'Low',
      treatingPhysio: 'Dr. Emil Lind',
      status: 'Fully Resolved',
      notes: 'Isometric calf raises and plyometric bounding completed.',
    };

    const { response: postRes, body: created } = await request(baseUrl, '/medical/demo-player/injuries', {
      method: 'POST',
      body: JSON.stringify(injuryPayload),
    });

    assert.equal(postRes.status, 201);
    assert.equal(created.type, 'Calf Strain');
    assert.equal(created.recoveryWeeks, 2);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'medical_injury_logged');

    // Test patch clearance
    const { response: patchRes, body: updatedRecord } = await request(baseUrl, '/medical/demo-player/clearance', {
      method: 'PATCH',
      body: JSON.stringify({ orthopedicSummary: 'All ligaments intact.' }),
    });

    assert.equal(patchRes.status, 200);
    assert.equal(updatedRecord.orthopedicSummary, 'All ligaments intact.');
  }, { socketService: fakeSocket });
});
