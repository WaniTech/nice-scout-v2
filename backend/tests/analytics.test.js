const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');
const {
  calculatePillarScores,
  calculateBenchmarks,
  getScoutActivityFeed,
} = require('../services/analyticsEngine');

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

async function withApi(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-analytics-'));
  const store = createJsonStore({
    filePath: path.join(tempDir, 'db.json'),
    seedData,
  });
  await store.reset();

  const server = createApp({ store }).listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await run(baseUrl, store);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test('analytics engine calculates 4-pillar scores with strength bonuses', () => {
  const baseline = calculatePillarScores({ strengths: [] });
  assert.equal(baseline.physical, 84);
  assert.equal(baseline.technical, 82);
  assert.equal(baseline.tactical, 80);
  assert.equal(baseline.mental, 83);
  assert.equal(baseline.overallRadarScore, 82);

  const enhanced = calculatePillarScores({
    strengths: ['Acceleration', '1v1 dribbling', 'High pressing', 'Resilience'],
  });

  assert.equal(enhanced.physical, 92);
  assert.equal(enhanced.technical, 91);
  assert.equal(enhanced.tactical, 88);
  assert.equal(enhanced.mental, 90);
  assert.equal(enhanced.overallRadarScore, 90);
});

test('analytics engine compares player performance metrics against league benchmarks', () => {
  const result = calculateBenchmarks('Right winger', 'Danish Superliga Academy');

  assert.equal(result.position, 'Right winger');
  assert.equal(result.baseline, 'Danish Superliga Academy');
  assert.ok(result.readinessIndex >= 80);
  assert.ok(Array.isArray(result.metrics));

  const sprintMetric = result.metrics.find((m) => m.metric === 'sprintPeak');
  assert.ok(sprintMetric);
  assert.equal(sprintMetric.unit, 'km/h');
  assert.equal(sprintMetric.status, 'Above Benchmark');
});

test('analytics endpoints provide player radar, benchmarks, and scout activity', async () => {
  await withApi(async (baseUrl) => {
    const radar = await request(baseUrl, '/player/demo-player/analytics');
    assert.equal(radar.response.status, 200);
    assert.equal(radar.body.playerId, 'demo-player');
    assert.ok(radar.body.pillars.overallRadarScore >= 80);

    const benchmarks = await request(
      baseUrl,
      '/player/demo-player/benchmarks?position=Right%20winger&baseline=Eredivisie%20U23',
    );
    assert.equal(benchmarks.response.status, 200);
    assert.equal(benchmarks.body.baseline, 'Eredivisie U23');
    assert.ok(benchmarks.body.metrics.length > 0);

    const scoutActivity = await request(baseUrl, '/player/demo-player/scout-activity');
    assert.equal(scoutActivity.response.status, 200);
    assert.equal(scoutActivity.body.playerId, 'demo-player');
    assert.ok(scoutActivity.body.totalViews > 0);
    assert.ok(scoutActivity.body.viewsByLeague.length > 0);
    assert.ok(scoutActivity.body.recentScouts.length > 0);
  });
});
