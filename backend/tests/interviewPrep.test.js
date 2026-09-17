const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  ensureInterviewPrepRecord,
  toggleQuestionPracticed,
  logSimulatedInterview,
} = require('../services/interviewPrepService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-interview-'));
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

test('interview prep service toggles questions practiced status and recalculates score', () => {
  const data = {};
  const record = ensureInterviewPrepRecord(data, 'test-player');
  assert.equal(record.playerId, 'test-player');

  const q1 = record.questionsBank[0];
  const initialStatus = q1.practiced;

  const toggled = toggleQuestionPracticed(record, q1.id, 'My custom answer');
  assert.equal(toggled.practiced, !initialStatus);
  assert.equal(toggled.userNotes, 'My custom answer');
  assert.ok(record.overallReadinessScore > 0);
});

test('interview prep service logs simulated interview sessions', () => {
  const data = {};
  const record = ensureInterviewPrepRecord(data, 'test-player');

  const session = logSimulatedInterview(record, {
    club: 'SC Freiburg II',
    score: 95,
    feedback: 'Excellent tactical clarity on transition duties.',
  });

  assert.equal(session.club, 'SC Freiburg II');
  assert.equal(session.score, 95);
  assert.equal(record.simulationSessions[0].id, session.id);
});

test('GET /api/interview-prep/:playerId returns prep hub data', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/interview-prep/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.ok(body.overallReadinessScore >= 0);
    assert.ok(Array.isArray(body.questionsBank));
    assert.ok(Array.isArray(body.modules));
  });
});

test('PATCH /api/interview-prep/:playerId/questions/:questionId updates practiced state', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/interview-prep/demo-player/questions/q-3', {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'Practice counter pressing sprint triggers' }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.question.id, 'q-3');
    assert.equal(body.question.practiced, true);
    assert.equal(body.question.userNotes, 'Practice counter pressing sprint triggers');

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'interview_prep_updated');
  }, { socketService: fakeSocket });
});

test('POST /api/interview-prep/:playerId/simulate logs simulation and broadcasts event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
    broadcast() {},
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/interview-prep/demo-player/simulate', {
      method: 'POST',
      body: JSON.stringify({
        club: 'AZ Alkmaar',
        score: 91,
        feedback: 'Clear tactical terminology and great communication.',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.club, 'AZ Alkmaar');
    assert.equal(body.score, 91);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'interview_simulation_logged');
  }, { socketService: fakeSocket });
});
