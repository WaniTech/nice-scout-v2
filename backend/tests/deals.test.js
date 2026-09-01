const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const { calculateDealValue, defaultContractTemplates } = require('../services/dealService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-deals-'));
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

test('deal service calculates guaranteed total and projected deal valuations', () => {
  const sample = defaultContractTemplates[0];
  const financials = calculateDealValue(sample);

  assert.equal(financials.months, 24);
  assert.equal(financials.guaranteedTotal, (4200 * 24) + 8000 + (850 * 24));
  assert.ok(financials.projectedTotal > financials.guaranteedTotal);
  assert.ok(financials.monthlyNetEstimate > 2000);
  assert.ok(financials.dealScore >= 80);
});

test('contract deals can be listed and queried by player ID', async () => {
  await withApi(async (baseUrl) => {
    const listRes = await request(baseUrl, '/deals/demo-player');
    assert.equal(listRes.response.status, 200);
    assert.ok(Array.isArray(listRes.body));
    assert.ok(listRes.body.length >= 2);
    assert.equal(listRes.body[0].club, 'FC Midtjylland');
    assert.ok(listRes.body[0].financials);

    const detailRes = await request(baseUrl, '/deals/demo-player/deal-1');
    assert.equal(detailRes.response.status, 200);
    assert.equal(detailRes.body.id, 'deal-1');
    assert.equal(detailRes.body.status, 'Offered');
    assert.ok(detailRes.body.negotiationHistory.length >= 1);
  });
});

test('submitting a counter-offer updates deal status and appends negotiation trail', async () => {
  await withApi(async (baseUrl) => {
    const counterRes = await request(baseUrl, '/deals/demo-player/deal-1/counter', {
      method: 'POST',
      body: JSON.stringify({
        counterSalaryMonthly: 5000,
        counterSigningBonus: 10000,
        notes: 'Requested increase to align with starting winger role expectations.',
      }),
    });

    assert.equal(counterRes.response.status, 200);
    assert.equal(counterRes.body.baseSalaryMonthly, 5000);
    assert.equal(counterRes.body.signingBonus, 10000);
    assert.equal(counterRes.body.status, 'Countered');
    assert.equal(counterRes.body.negotiationHistory[0].action, 'Counter-Offer Submitted');
    assert.ok(counterRes.body.negotiationHistory[0].notes.includes('starting winger'));
  });
});

test('signing a contract deal updates status to Signed and stores digital signature', async () => {
  await withApi(async (baseUrl) => {
    const signRes = await request(baseUrl, '/deals/demo-player/deal-1/sign', {
      method: 'PATCH',
      body: JSON.stringify({
        signature: 'Alex Rivera (Verified Digital ID)',
        confirmationNotes: 'Officially accepted FC Midtjylland terms.',
      }),
    });

    assert.equal(signRes.response.status, 200);
    assert.equal(signRes.body.status, 'Signed');
    assert.equal(signRes.body.signature, 'Alex Rivera (Verified Digital ID)');
    assert.ok(signRes.body.signedAt);
    assert.equal(signRes.body.negotiationHistory[0].action, 'Contract Formally Executed');
  });
});

test('counter and sign actions broadcast real-time events to player websocket room', async () => {
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
    await request(baseUrl, '/deals/demo-player/deal-1/counter', {
      method: 'POST',
      body: JSON.stringify({
        counterSalaryMonthly: 4700,
      }),
    });

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'deal_counter_submitted')
    );

    await request(baseUrl, '/deals/demo-player/deal-1/sign', {
      method: 'PATCH',
      body: JSON.stringify({
        signature: 'Alex Rivera',
      }),
    });

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'deal_signed')
    );
  }, { socketService: mockSocketService });
});
