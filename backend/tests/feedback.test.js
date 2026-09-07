const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculateFeedbackMetrics,
} = require('../services/feedbackService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-feedback-'));
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

test('feedback service correctly calculates average ratings and category averages', () => {
  const evaluations = [
    {
      overallRating: 9.0,
      categories: { gameIntelligence: 9.0, technicalExecution: 8.5, physicalImpact: 8.0, tacticalDiscipline: 9.5 },
      recommendation: 'Recommend Trial',
      strengthsObserved: ['Pace', 'Pressing'],
    },
    {
      overallRating: 8.0,
      categories: { gameIntelligence: 8.0, technicalExecution: 8.5, physicalImpact: 8.0, tacticalDiscipline: 8.5 },
      recommendation: 'Monitor',
      strengthsObserved: ['Pace', 'Passing'],
    },
  ];

  const metrics = calculateFeedbackMetrics(evaluations);
  assert.equal(metrics.totalEvaluations, 2);
  assert.equal(metrics.averageRating, 8.5);
  assert.equal(metrics.categoryAverages.gameIntelligence, 8.5);
  assert.equal(metrics.categoryAverages.technicalExecution, 8.5);
  assert.equal(metrics.recommendationCount, 1);
  assert.deepEqual(metrics.topObservedStrengths, ['Pace', 'Pressing', 'Passing']);
});

test('feedback endpoint returns player evaluations and metrics', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/feedback/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(Array.isArray(body.evaluations));
    assert.ok(body.evaluations.length >= 2);
    assert.ok(body.metrics.averageRating > 0);
  });
});

test('submitting a new scout evaluation adds entry and broadcasts websocket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
  };

  await withApi(async (baseUrl) => {
    const newEvalPayload = {
      scoutName: 'Lars Holm',
      club: 'Brondby IF',
      league: 'Danish Superliga',
      matchOpponent: 'FC Copenhagen U19',
      matchDate: '2026-09-01',
      overallRating: 9.2,
      categories: {
        gameIntelligence: 9.5,
        technicalExecution: 9.0,
        physicalImpact: 9.0,
        tacticalDiscipline: 9.2,
      },
      recommendation: 'Recommend Trial immediately',
      strengthsObserved: ['Explosive Burst', 'Defensive Press'],
      coachingNotes: 'Standout player on the pitch throughout 90 minutes.',
    };

    const { response: postRes, body: created } = await request(baseUrl, '/feedback/demo-player', {
      method: 'POST',
      body: JSON.stringify(newEvalPayload),
    });

    assert.equal(postRes.status, 201);
    assert.equal(created.scoutName, 'Lars Holm');
    assert.equal(created.overallRating, 9.2);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'scout_evaluation_received');

    // Verify PATCH endpoint to acknowledge feedback
    const { response: patchRes, body: updated } = await request(baseUrl, `/feedback/demo-player/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledged: true }),
    });

    assert.equal(patchRes.status, 200);
    assert.equal(updated.acknowledged, true);
  }, { socketService: fakeSocket });
});
