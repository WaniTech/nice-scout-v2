const assert = require('node:assert/strict');
const test = require('node:test');
const { createApp } = require('../app');

function createTestStore(initialData = {}) {
  const storeData = {
    users: [],
    opportunities: [
      {
        id: 'opp-1',
        club: 'Aarhus Fremad',
        league: 'NordicBet Liga',
        city: 'Aarhus',
        country: 'Denmark',
        position: 'Winger / Attacking Midfielder',
        fit: 94,
        ageBand: '18-23',
        contract: 'First team pro',
        compensation: '€3,800/mo + housing',
        trialDate: '2026-07-08',
        deadline: '2026-06-25',
        scout: 'Jonas Møller',
        stage: 'New',
        description: 'Searching for a dynamic winger with high pressing output.',
        requirements: ['Pace', '1v1 attacking', 'High work rate'],
        perks: ['Housing allowance', 'Performance bonuses'],
        tags: ['Denmark', 'Immediate trial', 'U23 priority'],
      },
      {
        id: 'opp-2',
        club: 'IFK Göteborg',
        league: 'Allsvenskan',
        city: 'Gothenburg',
        country: 'Sweden',
        position: 'Central Midfielder',
        fit: 88,
        ageBand: '19-25',
        contract: 'Senior trial contract',
        compensation: '€4,500/mo',
        trialDate: '2026-07-15',
        deadline: '2026-06-30',
        scout: 'Henrik Larsson',
        stage: 'New',
        description: 'Need a box-to-box midfielder with progressive passing metrics.',
        requirements: ['Passing vision', 'Stamina', 'Tactical discipline'],
        perks: ['Gym & physio facilities', 'European competition exposure'],
        tags: ['Sweden', 'Allsvenskan', 'First team'],
      },
    ],
    applications: [],
    profiles: [],
    preferences: [],
    clips: [],
    messages: [],
    ...initialData,
  };

  return {
    read: async () => JSON.parse(JSON.stringify(storeData)),
    update: async (mutator) => {
      const cloned = JSON.parse(JSON.stringify(storeData));
      const result = await mutator(cloned);
      Object.assign(storeData, cloned);
      return result;
    },
    findUserById: async (id) => storeData.users.find((u) => u.id === id) || null,
  };
}

async function startTestApp(store) {
  const app = createApp({ store });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}/api`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('creates a new application in Applied stage and queries player pipeline', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const response = await fetch(`${baseUrl}/player/demo-player/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opportunityId: 'opp-1',
        stage: 'Applied',
      }),
    });

    assert.equal(response.status, 201);
    const created = await response.json();
    assert.ok(created.id);
    assert.equal(created.opportunityId, 'opp-1');
    assert.equal(created.stage, 'Applied');

    // Query player applications list
    const listRes = await fetch(`${baseUrl}/player/demo-player/applications`);
    assert.equal(listRes.status, 200);
    const list = await listRes.json();
    assert.equal(list.length, 1);
    assert.equal(list[0].opportunity.club, 'Aarhus Fremad');
  } finally {
    await close();
  }
});

test('advances application stage through the recruitment lifecycle', async () => {
  const store = createTestStore({
    applications: [
      {
        id: 'app-1',
        playerId: 'demo-player',
        opportunityId: 'opp-1',
        stage: 'Applied',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    // Progress to Trial booked
    const patchTrial = await fetch(`${baseUrl}/player/demo-player/applications/app-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Trial booked' }),
    });
    assert.equal(patchTrial.status, 200);
    const trialData = await patchTrial.json();
    assert.equal(trialData.stage, 'Trial booked');

    // Progress to Offer talks
    const patchOffer = await fetch(`${baseUrl}/player/demo-player/applications/app-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Offer talks' }),
    });
    assert.equal(patchOffer.status, 200);
    const offerData = await patchOffer.json();
    assert.equal(offerData.stage, 'Offer talks');

    // Delete application
    const delRes = await fetch(`${baseUrl}/player/demo-player/applications/app-1`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 204);

    const checkList = await fetch(`${baseUrl}/player/demo-player/applications`);
    const remaining = await checkList.json();
    assert.equal(remaining.length, 0);
  } finally {
    await close();
  }
});

test('filters opportunities by query keyword and returns opportunities list', async () => {
  const store = createTestStore();
  const { server, baseUrl, close } = await startTestApp(store);

  try {
    const searchRes = await fetch(`${baseUrl}/opportunities?q=sweden`);
    assert.equal(searchRes.status, 200);
    const filtered = await searchRes.json();
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].club, 'IFK Göteborg');
  } finally {
    await close();
  }
});
