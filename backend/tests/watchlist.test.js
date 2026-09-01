const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const { calculateWatchlistMetrics, defaultWatchlistEntries } = require('../services/watchlistService');

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-watchlist-'));
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

test('watchlist service calculates priority distribution and interest index', () => {
  const metrics = calculateWatchlistMetrics(defaultWatchlistEntries);

  assert.equal(metrics.totalScouts, 4);
  assert.equal(metrics.priorityCount, 2);
  assert.equal(metrics.monitoredCount, 1);
  assert.equal(metrics.extendedCount, 1);
  assert.ok(metrics.interestIndex >= 80);
  assert.equal(metrics.activeLeaguesCount, 4);
});

test('player watchlist report can be retrieved with scouts, tiers, and inquiries', async () => {
  await withApi(async (baseUrl) => {
    const reportRes = await request(baseUrl, '/watchlist/demo-player');
    assert.equal(reportRes.response.status, 200);
    assert.equal(reportRes.body.playerId, 'demo-player');
    assert.ok(reportRes.body.metrics.totalScouts >= 4);
    assert.ok(reportRes.body.watchlists.length >= 4);
    assert.ok(reportRes.body.inquiries.length >= 2);
    assert.equal(reportRes.body.watchlists[0].club, 'FC Midtjylland');
  });
});

test('adding a scout to player watchlist stores entry and updates tier', async () => {
  await withApi(async (baseUrl) => {
    const addRes = await request(baseUrl, '/watchlist/demo-player', {
      method: 'POST',
      body: JSON.stringify({
        scoutName: 'Lars Christiansen',
        club: 'Brondby IF',
        league: 'Danish Superliga',
        role: 'Chief Scout',
        tier: 'Priority Target',
        notes: 'Targeting wide attacking depth for first team squad.',
        tags: ['Immediate Starter', 'Danish Market'],
      }),
    });

    assert.equal(addRes.response.status, 201);
    assert.equal(addRes.body.scoutName, 'Lars Christiansen');
    assert.equal(addRes.body.club, 'Brondby IF');
    assert.equal(addRes.body.tier, 'Priority Target');

    const getRes = await request(baseUrl, '/watchlist/demo-player');
    assert.equal(getRes.response.status, 200);
    assert.ok(getRes.body.watchlists.some((w) => w.scoutName === 'Lars Christiansen'));
    assert.ok(getRes.body.metrics.priorityCount >= 3);
  });
});

test('updating watchlist entry tier or inquiry status succeeds', async () => {
  await withApi(async (baseUrl) => {
    const updateRes = await request(baseUrl, '/watchlist/demo-player/watch-2', {
      method: 'PATCH',
      body: JSON.stringify({
        tier: 'Priority Target',
        inquiryStatus: 'Official Trial Offered',
        notes: 'Upgraded from Monitored to Priority Target following full match review.',
      }),
    });

    assert.equal(updateRes.response.status, 200);
    assert.equal(updateRes.body.tier, 'Priority Target');
    assert.equal(updateRes.body.inquiryStatus, 'Official Trial Offered');
  });
});

test('submitting a scout inquiry registers inquiry and broadcasts socket event', async () => {
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
    const inqRes = await request(baseUrl, '/watchlist/demo-player/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        scoutName: 'Marcus Lee',
        club: 'New York Red Bulls II',
        type: 'Medical Summary Request',
        message: 'Requesting medical clearance summary ahead of August trial window.',
      }),
    });

    assert.equal(inqRes.response.status, 201);
    assert.equal(inqRes.body.club, 'New York Red Bulls II');
    assert.equal(inqRes.body.status, 'Pending Review');

    assert.ok(
      socketEvents.some((e) => e.room === 'player:demo-player' && e.message.type === 'scout_inquiry_received')
    );
  }, { socketService: mockSocketService });
});
