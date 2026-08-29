const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const { calculateChecklistProgress } = require('../services/trialService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-trials-'));
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

test('trial service correctly computes checklist progress and required items status', () => {
  const empty = calculateChecklistProgress([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.percent, 0);

  const sample = [
    { id: '1', title: 'GPS', completed: true, required: true },
    { id: '2', title: 'Medical', completed: false, required: true },
    { id: '3', title: 'Boots', completed: true, required: false },
  ];

  const progress = calculateChecklistProgress(sample);
  assert.equal(progress.total, 3);
  assert.equal(progress.completed, 2);
  assert.equal(progress.percent, 67);
  assert.equal(progress.requiredComplete, false);

  sample[1].completed = true;
  const fullProgress = calculateChecklistProgress(sample);
  assert.equal(fullProgress.requiredComplete, true);
  assert.equal(fullProgress.percent, 100);
});

test('player trials can be listed, scheduled, and updated with time slots', async () => {
  await withApi(async (baseUrl) => {
    // 1. Get initial trials for demo player
    const initial = await request(baseUrl, '/trials/demo-player');
    assert.equal(initial.response.status, 200);
    assert.ok(Array.isArray(initial.body));
    assert.ok(initial.body.length >= 1);
    assert.equal(initial.body[0].club, 'FC Midtjylland');

    // 2. Schedule a new trial for AZ Alkmaar (opp 2)
    const schedule = await request(baseUrl, '/trials/demo-player/schedule', {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: '2',
        club: 'AZ Alkmaar',
        trialDate: 'July 2, 2026',
        timeSlot: 'Afternoon Match Assessment (14:30 - 17:00 CET)',
        location: 'AFAS Trainingscomplex, Alkmaar',
        scoutContact: 'Noah Janssen',
        notes: 'Full match review on the right wing.',
      }),
    });

    assert.equal(schedule.response.status, 201);
    assert.equal(schedule.body.club, 'AZ Alkmaar');
    assert.equal(schedule.body.status, 'Confirmed');
    assert.equal(schedule.body.timeSlot, 'Afternoon Match Assessment (14:30 - 17:00 CET)');
    assert.ok(schedule.body.checklist.length >= 5);
    assert.ok(schedule.body.progress);

    // 3. Verify trial appears in player trials list
    const afterSchedule = await request(baseUrl, '/trials/demo-player');
    assert.equal(afterSchedule.response.status, 200);
    assert.ok(afterSchedule.body.some((t) => t.opportunityId === '2'));
  });
});

test('trial RSVP handles confirmation, rescheduling, and rejection state machine', async () => {
  await withApi(async (baseUrl) => {
    // 1. RSVP Reschedule
    const reschedule = await request(baseUrl, '/trials/demo-player/trial-1/rsvp', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Rescheduled',
        requestedDate: 'June 28, 2026',
        requestedTimeSlot: 'Afternoon Match Assessment (14:30 - 17:00 CET)',
        reason: 'Travel delay due to flight schedule.',
      }),
    });

    assert.equal(reschedule.response.status, 200);
    assert.equal(reschedule.body.status, 'Rescheduled');
    assert.equal(reschedule.body.trialDate, 'June 28, 2026');
    assert.ok(reschedule.body.notes.includes('Travel delay'));

    // 2. RSVP Confirm
    const confirm = await request(baseUrl, '/trials/demo-player/trial-1/rsvp', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Confirmed',
        reason: 'Confirmed for June 28.',
      }),
    });

    assert.equal(confirm.response.status, 200);
    assert.equal(confirm.body.status, 'Confirmed');

    // 3. Invalid status validation
    const invalid = await request(baseUrl, '/trials/demo-player/trial-1/rsvp', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'NotAStatus',
      }),
    });
    assert.equal(invalid.response.status, 400);
  });
});

test('trial checklist items can be toggled and track preparation readiness', async () => {
  await withApi(async (baseUrl) => {
    // 1. Toggle medical clearance (chk-3) to completed
    const toggle = await request(baseUrl, '/trials/demo-player/trial-1/checklist/chk-3', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    assert.equal(toggle.response.status, 200);
    const item = toggle.body.checklist.find((c) => c.id === 'chk-3');
    assert.ok(item);
    assert.equal(item.completed, true);
    assert.ok(toggle.body.progress.completed > 3);

    // 2. Non-existent item returns 404
    const notFound = await request(baseUrl, '/trials/demo-player/trial-1/checklist/chk-999', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(notFound.response.status, 404);
  });
});

test('trial actions broadcast real-time events to player websocket room', async () => {
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
    await request(baseUrl, '/trials/demo-player/schedule', {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: '3',
        club: 'SC Freiburg II',
        trialDate: 'July 9, 2026',
      }),
    });

    assert.ok(socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'trial_scheduled'));

    await request(baseUrl, '/trials/demo-player/trial-1/rsvp', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Confirmed',
      }),
    });

    assert.ok(socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'trial_rsvp_updated'));
  }, { socketService: mockSocketService });
});
