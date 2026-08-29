const benchmarkStandards = {
  'Right winger': {
    sprintPeak: { target: 34.0, max: 36.0, unit: 'km/h', label: 'Top Sprint Speed' },
    xGChain: { target: 0.65, max: 1.0, unit: '/90', label: 'Expected Goal Chain' },
    pressWins: { target: 6.5, max: 10.0, unit: '/90', label: 'High Press Regains' },
    dribbleSuccess: { target: 62.0, max: 80.0, unit: '%', label: '1v1 Dribble Success' },
    crossAccuracy: { target: 32.0, max: 45.0, unit: '%', label: 'Open-Play Cross Accuracy' },
    defensiveWorkrate: { target: 70.0, max: 100.0, unit: '%', label: 'Defensive Recovery Rate' },
  },
  'Left winger': {
    sprintPeak: { target: 33.8, max: 35.8, unit: 'km/h', label: 'Top Sprint Speed' },
    xGChain: { target: 0.68, max: 1.0, unit: '/90', label: 'Expected Goal Chain' },
    pressWins: { target: 6.2, max: 10.0, unit: '/90', label: 'High Press Regains' },
    dribbleSuccess: { target: 60.0, max: 80.0, unit: '%', label: '1v1 Dribble Success' },
    crossAccuracy: { target: 30.0, max: 45.0, unit: '%', label: 'Open-Play Cross Accuracy' },
    defensiveWorkrate: { target: 68.0, max: 100.0, unit: '%', label: 'Defensive Recovery Rate' },
  },
  'Attacking midfielder': {
    sprintPeak: { target: 32.5, max: 34.5, unit: 'km/h', label: 'Top Sprint Speed' },
    xGChain: { target: 0.75, max: 1.1, unit: '/90', label: 'Expected Goal Chain' },
    pressWins: { target: 7.0, max: 10.0, unit: '/90', label: 'High Press Regains' },
    dribbleSuccess: { target: 58.0, max: 75.0, unit: '%', label: '1v1 Dribble Success' },
    crossAccuracy: { target: 38.0, max: 50.0, unit: '%', label: 'Key Pass Accuracy' },
    defensiveWorkrate: { target: 65.0, max: 100.0, unit: '%', label: 'Defensive Recovery Rate' },
  },
};

const leagueBaselines = {
  'Danish Superliga Academy': { multiplier: 1.0, tier: 'Tier 1 Academy' },
  'Eredivisie U23': { multiplier: 1.05, tier: 'Pro Pathway' },
  'German Development Squad': { multiplier: 1.08, tier: 'Bundesliga Bridge' },
  'MLS Next Pro': { multiplier: 0.96, tier: 'North American Pro' },
};

function calculatePillarScores(player = {}) {
  const strengths = new Set((player.strengths || []).map((s) => s.toLowerCase()));

  let physical = 84;
  let technical = 82;
  let tactical = 80;
  let mental = 83;

  if (strengths.has('acceleration') || strengths.has('pace') || strengths.has('sprint peak')) {
    physical += 8;
  }
  if (strengths.has('1v1 dribbling') || strengths.has('cutbacks') || strengths.has('ball-carrying')) {
    technical += 9;
  }
  if (strengths.has('high pressing') || strengths.has('weak-side runs') || strengths.has('pressing intelligence')) {
    tactical += 8;
  }
  if (strengths.has('resilience') || strengths.has('leadership') || strengths.has('work ethic')) {
    mental += 7;
  }

  return {
    physical: Math.min(physical, 98),
    technical: Math.min(technical, 96),
    tactical: Math.min(tactical, 95),
    mental: Math.min(mental, 94),
    overallRadarScore: Math.round((physical + technical + tactical + mental) / 4),
  };
}

function calculateBenchmarks(position = 'Right winger', baselineName = 'Danish Superliga Academy') {
  const standard = benchmarkStandards[position] || benchmarkStandards['Right winger'];
  const baseline = leagueBaselines[baselineName] || leagueBaselines['Danish Superliga Academy'];

  const playerStats = {
    sprintPeak: 34.6,
    xGChain: 0.71,
    pressWins: 7.1,
    dribbleSuccess: 68.0,
    crossAccuracy: 35.5,
    defensiveWorkrate: 74.0,
  };

  const comparisons = Object.keys(standard).map((key) => {
    const item = standard[key];
    const playerVal = playerStats[key] ?? item.target;
    const targetVal = +(item.target * baseline.multiplier).toFixed(2);
    const percentile = Math.min(Math.round((playerVal / targetVal) * 85), 99);
    const diff = +(playerVal - targetVal).toFixed(2);

    return {
      metric: key,
      label: item.label,
      playerValue: playerVal,
      benchmarkValue: targetVal,
      unit: item.unit,
      percentile,
      diff,
      status: diff >= 0 ? 'Above Benchmark' : 'Developing',
    };
  });

  const averagePercentile = Math.round(
    comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length
  );

  return {
    position,
    baseline: baselineName,
    tier: baseline.tier,
    readinessIndex: averagePercentile,
    metrics: comparisons,
  };
}

function getScoutActivityFeed(playerId = 'demo-player') {
  return {
    playerId,
    totalViews: 68,
    activeWatchlists: 7,
    videoReplays: 34,
    viewsByLeague: [
      { league: 'Danish Superliga Academy', views: 28, trend: '+14%' },
      { league: 'Eredivisie U23', views: 22, trend: '+8%' },
      { league: 'German 3. Liga / Development', views: 12, trend: '+20%' },
      { league: 'Liga Portugal B', views: 6, trend: '+5%' },
    ],
    recentScouts: [
      { club: 'FC Midtjylland', scout: 'Mikkel Soren', action: 'Video replayed (3x)', time: '2 hours ago' },
      { club: 'AZ Alkmaar', scout: 'Noah Janssen', action: 'Added to Watchlist', time: 'Yesterday' },
      { club: 'SC Freiburg II', scout: 'Lena Weiss', action: 'Downloaded GPS Profile', time: '2 days ago' },
    ],
  };
}

module.exports = {
  calculatePillarScores,
  calculateBenchmarks,
  getScoutActivityFeed,
  benchmarkStandards,
  leagueBaselines,
};
