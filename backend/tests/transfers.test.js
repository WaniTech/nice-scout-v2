const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculateMarketValuation,
} = require('../services/transferService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-transfers-'));
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

test('transfer service calculates market valuation based on sprint speed and ratings', () => {
  const valuation = calculateMarketValuation({
    age: 20,
    sprintSpeed: 33.8,
    matchRating: 8.4,
    milestonesCount: 4,
    hasEuPassport: true,
    scoutInquiriesCount: 8,
  });

  assert.ok(valuation.estimatedValueEur >= 150000);
  assert.ok(valuation.valueRangeMinEur < valuation.estimatedValueEur);
  assert.ok(valuation.valueRangeMaxEur > valuation.estimatedValueEur);
  assert.equal(valuation.marketTier, 'Top Tier European U21 Target');
  assert.ok(valuation.demandIndex > 80);
});

test('transfers endpoint returns player transfer report and active mandates', async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/transfers/demo-player');

    assert.equal(response.status, 200);
    assert.equal(body.playerId, 'demo-player');
    assert.equal(body.transferStatus, 'Free Agent');
    assert.ok(body.valuation.estimatedValueEur > 0);
    assert.ok(Array.isArray(body.mandates));
    assert.ok(body.mandates.length >= 3);
  });
});

test('submitting a dossier pitch to a club mandate broadcasts socket event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(
      baseUrl,
      '/transfers/demo-player/pitch',
      {
        method: 'POST',
        body: JSON.stringify({
          mandateId: 'mandate-102',
          message: 'Direct pitch with verified sprint analytics and trial availability.',
          attachedClipCount: 3,
        }),
      }
    );

    assert.equal(response.status, 201);
    assert.equal(body.mandateId, 'mandate-102');
    assert.equal(body.club, 'FC Midtjylland');
    assert.equal(body.status, 'Submitted');
    assert.equal(body.attachedClipCount, 3);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'mandate_pitch_submitted');
  }, { socketService: fakeSocket });
});

test('updating transfer status updates record and broadcasts event', async () => {
  const broadcasted = [];
  const fakeSocket = {
    broadcastToRoom(room, event) {
      broadcasted.push({ room, event });
    },
  };

  await withApi(async (baseUrl) => {
    const { response, body } = await request(
      baseUrl,
      '/transfers/demo-player/status',
      {
        method: 'PATCH',
        body: JSON.stringify({
          transferStatus: 'Transfer Listed',
          contractExpiry: '2027-06-30',
          releaseClauseEur: 250000,
        }),
      }
    );

    assert.equal(response.status, 200);
    assert.equal(body.transferStatus, 'Transfer Listed');
    assert.equal(body.contractExpiry, '2027-06-30');
    assert.equal(body.releaseClauseEur, 250000);

    assert.equal(broadcasted.length, 1);
    assert.equal(broadcasted[0].room, 'player:demo-player');
    assert.equal(broadcasted[0].event.type, 'transfer_status_updated');
  }, { socketService: fakeSocket });
});
