const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  ensurePathwayRecord,
  toggleMilestoneStatus,
  simulatePathwayScenario,
  calculatePathwayScore,
} = require('../services/pathwayService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-pathway-'));
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

test('pathway service initializes record and calculates trajectory score', () => {
  const data = {};
  const record = ensurePathwayRecord(data, 'test-player');
  assert.equal(record.playerId, 'test-player');
  assert.ok(record.phases.length >= 3);
  assert.ok(record.milestones.length >= 5);
  assert.ok(record.trajectoryRating >= 70);

  const score = calculatePathwayScore(record);
  assert.ok(score >= 70 && score <= 100);
});

test('pathway service toggles milestone status and updates notes', () => {
  const data = {};
  const record = ensurePathwayRecord(data, 'test-player');

  const ms = record.milestones[1]; // in progress
  const updated = toggleMilestoneStatus(record, ms.id, 'Completed', 'Debuted in cup match');
  assert.equal(updated.status, 'Completed');
  assert.equal(updated.notes, 'Debuted in cup match');

  // Cycling test
  const cycled = toggleMilestoneStatus(record, ms.id);
  assert.equal(cycled.status, 'Target');
});

test('pathway service creates simulated career scenario with projected valuation', () => {
  const data = {};
  const record = ensurePathwayRecord(data, 'test-player');

  const scenario = simulatePathwayScenario(record, {
    name: 'Benelux Fast-Track Bridge',
    pathwayType: 'Accelerated Nordic & Benelux',
    targetHorizonYears: 2,
    customFocus: 'High sprint volume and pressing triggers',
  });

  assert.equal(scenario.name, 'Benelux Fast-Track Bridge');
  assert.ok(scenario.projectedPeakValuationEur >= 4000000);
  assert.equal(record.simulatedScenarios[0].id, scenario.id);
});

test('GET /api/pathway/:playerId returns roadmap, milestones, and clubs', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/pathway/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(body.trajectoryRating >= 70);
    assert.ok(Array.isArray(body.phases));
    assert.ok(Array.isArray(body.milestones));
    assert.ok(Array.isArray(body.benchmarkedClubs));
  });
});

test('PATCH /api/pathway/:playerId/milestones/:milestoneId updates status and broadcasts socket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/pathway/demo-player/milestones/ms-2', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Completed',
        notes: 'Confirmed 25 min appearance in DBU Pokalen',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.milestone.id, 'ms-2');
    assert.equal(body.milestone.status, 'Completed');
    assert.equal(body.milestone.notes, 'Confirmed 25 min appearance in DBU Pokalen');

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'pathway_milestone_updated');
  }, { socketService: fakeSocket });
});

test('POST /api/pathway/:playerId/simulate logs scenario and broadcasts event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/pathway/demo-player/simulate', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Top 5 League Direct Transition',
        pathwayType: 'Accelerated European Development',
        targetHorizonYears: 3,
        customFocus: '1v1 dribble efficiency and aerobic endurance',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.name, 'Top 5 League Direct Transition');
    assert.ok(body.projectedPeakValuationEur > 0);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'pathway_scenario_simulated');
  }, { socketService: fakeSocket });
});
