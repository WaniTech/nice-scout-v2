const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculatePassportScore,
  defaultCareerMilestones,
} = require('../services/passportService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-passport-'));
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

test('passport service correctly calculates verification score from milestones and work permit', () => {
  const sample = {
    milestones: defaultCareerMilestones,
    metrics: { workPermitStatus: 'Full EU Working Rights (No Visa Required)' },
  };

  const score = calculatePassportScore(sample);
  assert.ok(score >= 90, 'Score should be high for verified EU player with 3 milestones');
  assert.ok(score <= 99, 'Score should not exceed 99');
});

test('player career passport can be retrieved and initialized with verified milestones', async () => {
  await withApi(async (baseUrl) => {
    const passportRes = await request(baseUrl, '/passport/demo-player');
    assert.equal(passportRes.response.status, 200);
    assert.equal(passportRes.body.playerId, 'demo-player');
    assert.ok(passportRes.body.metrics.fifaId);
    assert.ok(passportRes.body.milestones.length >= 3);
    assert.ok(passportRes.body.verificationScore >= 80);
    assert.ok(passportRes.body.shareableUrl.includes('demo-player'));
  });
});

test('career milestones can be added to the player passport timeline', async () => {
  await withApi(async (baseUrl) => {
    const addRes = await request(baseUrl, '/passport/demo-player/milestones', {
      method: 'POST',
      body: JSON.stringify({
        club: 'AZ Alkmaar U23 Trial',
        role: 'Invited Trialist (Right Wing)',
        period: 'Summer 2026',
        appearances: 4,
        goals: 2,
        assists: 3,
        category: 'Trial Assessment',
      }),
    });

    assert.equal(addRes.response.status, 201);
    assert.equal(addRes.body.milestones[0].club, 'AZ Alkmaar U23 Trial');
    assert.equal(addRes.body.milestones[0].goals, 2);
    assert.equal(addRes.body.milestones[0].verified, true);

    const getRes = await request(baseUrl, '/passport/demo-player');
    assert.equal(getRes.response.status, 200);
    assert.ok(getRes.body.milestones.some((m) => m.club === 'AZ Alkmaar U23 Trial'));
  });
});

test('passport metrics and representation details can be updated', async () => {
  await withApi(async (baseUrl) => {
    const updateRes = await request(baseUrl, '/passport/demo-player/metrics', {
      method: 'PUT',
      body: JSON.stringify({
        agencyRepresentation: 'Elite Global Sports Management',
        preferredFoot: 'Both (Left 5/5, Right 5/5)',
        scoutEndorsements: 9,
      }),
    });

    assert.equal(updateRes.response.status, 200);
    assert.equal(updateRes.body.metrics.agencyRepresentation, 'Elite Global Sports Management');
    assert.equal(updateRes.body.metrics.preferredFoot, 'Both (Left 5/5, Right 5/5)');
    assert.equal(updateRes.body.metrics.scoutEndorsements, 9);
  });
});

test('milestone addition broadcasts real-time socket event to player room', async () => {
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
    await request(baseUrl, '/passport/demo-player/milestones', {
      method: 'POST',
      body: JSON.stringify({
        club: 'SC Freiburg II Trial',
        role: 'Trialist',
        period: 'July 2026',
      }),
    });

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'passport_updated')
    );
  }, { socketService: mockSocketService });
});
