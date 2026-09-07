const defaultEvaluations = [
  {
    id: 'eval-1',
    playerId: 'demo-player',
    scoutId: 'scout-101',
    scoutName: 'Mikkel Soren',
    club: 'FC Midtjylland',
    league: 'Danish Superliga Academy',
    matchOpponent: 'AGF Aarhus U19',
    matchDate: '2026-08-15',
    overallRating: 8.8,
    categories: {
      gameIntelligence: 9.0,
      technicalExecution: 8.7,
      physicalImpact: 8.5,
      tacticalDiscipline: 9.0,
    },
    recommendation: 'Recommend Immediate Trial',
    strengthsObserved: ['1v1 Wide Acceleration', 'High-Press Triggers', 'Weak-Side Recovery'],
    coachingNotes: 'Exceptional direct threat down the right channel. Showed high tactical awareness during turnover transitions.',
    acknowledged: true,
    createdAt: '2026-08-16T10:00:00.000Z',
  },
  {
    id: 'eval-2',
    playerId: 'demo-player',
    scoutId: 'scout-102',
    scoutName: 'Noah Janssen',
    club: 'AZ Alkmaar',
    league: 'Eredivisie U23 Pathway',
    matchOpponent: 'FC Nordsjaelland U19',
    matchDate: '2026-08-22',
    overallRating: 8.4,
    categories: {
      gameIntelligence: 8.6,
      technicalExecution: 8.5,
      physicalImpact: 8.0,
      tacticalDiscipline: 8.5,
    },
    recommendation: 'Shortlist for Scouting Camp',
    strengthsObserved: ['Inside-Forward Movement', 'First-Touch Under Pressure'],
    coachingNotes: 'Strong combinations when cutting inside onto stronger foot. Can work on final cross timing against compact low blocks.',
    acknowledged: false,
    createdAt: '2026-08-23T14:30:00.000Z',
  },
];

function calculateFeedbackMetrics(evaluations = []) {
  if (!evaluations.length) {
    return {
      totalEvaluations: 0,
      averageRating: 0,
      recommendationCount: 0,
      categoryAverages: {
        gameIntelligence: 0,
        technicalExecution: 0,
        physicalImpact: 0,
        tacticalDiscipline: 0,
      },
      topObservedStrengths: [],
    };
  }

  const sumRating = evaluations.reduce((sum, e) => sum + (e.overallRating || 0), 0);
  const averageRating = Number((sumRating / evaluations.length).toFixed(1));

  const categorySums = evaluations.reduce(
    (acc, e) => {
      const c = e.categories || {};
      acc.gameIntelligence += c.gameIntelligence || 0;
      acc.technicalExecution += c.technicalExecution || 0;
      acc.physicalImpact += c.physicalImpact || 0;
      acc.tacticalDiscipline += c.tacticalDiscipline || 0;
      return acc;
    },
    { gameIntelligence: 0, technicalExecution: 0, physicalImpact: 0, tacticalDiscipline: 0 }
  );

  const count = evaluations.length;
  const categoryAverages = {
    gameIntelligence: Number((categorySums.gameIntelligence / count).toFixed(1)),
    technicalExecution: Number((categorySums.technicalExecution / count).toFixed(1)),
    physicalImpact: Number((categorySums.physicalImpact / count).toFixed(1)),
    tacticalDiscipline: Number((categorySums.tacticalDiscipline / count).toFixed(1)),
  };

  const strengthFreq = {};
  evaluations.forEach((e) => {
    (e.strengthsObserved || []).forEach((s) => {
      strengthFreq[s] = (strengthFreq[s] || 0) + 1;
    });
  });

  const topObservedStrengths = Object.keys(strengthFreq)
    .sort((a, b) => strengthFreq[b] - strengthFreq[a])
    .slice(0, 5);

  const recommendationCount = evaluations.filter(
    (e) => e.recommendation && e.recommendation.toLowerCase().includes('recommend')
  ).length;

  return {
    totalEvaluations: count,
    averageRating,
    recommendationCount,
    categoryAverages,
    topObservedStrengths,
  };
}

function ensureFeedbackRecord(data, playerId) {
  if (!data.evaluations) {
    data.evaluations = [];
  }

  const playerEvals = data.evaluations.filter((e) => e.playerId === playerId);
  if (playerEvals.length === 0 && playerId === 'demo-player') {
    data.evaluations.push(...defaultEvaluations);
  }
}

module.exports = {
  defaultEvaluations,
  calculateFeedbackMetrics,
  ensureFeedbackRecord,
};
