const assert = require('node:assert/strict');
const test = require('node:test');
const {
  calculatePositionScore,
  calculatePhysicalAndTacticalScore,
  calculateLocationScore,
  evaluatePlayerMatch,
  matchPlayerToOpportunities,
} = require('../services/matchingEngine');

test('position scoring provides high compatibility for exact and group matches', () => {
  const exact = calculatePositionScore('Striker', ['Left Winger'], 'Striker');
  assert.equal(exact.score, 100);

  const secondary = calculatePositionScore('Striker', ['Left Winger'], 'Left Winger');
  assert.equal(secondary.score, 85);

  const group = calculatePositionScore('Striker', [], 'Right Winger');
  assert.equal(group.score, 75);
});

test('tactical and physical scoring evaluates overlapping requirements', () => {
  const result = calculatePhysicalAndTacticalScore(
    ['Pace', 'Finishing', 'Pressing'],
    ['Pace', 'Counter-attack'],
    ['High stamina', 'Finishing in box']
  );

  assert.ok(result.score >= 80);
  assert.ok(result.matched.length >= 2);
});

test('location scoring factors in player location and target markets', () => {
  const domestic = calculateLocationScore('London, UK', ['UK', 'Germany'], 'UK', 'London');
  assert.equal(domestic.score, 100);

  const market = calculateLocationScore('London, UK', ['Germany', 'Spain'], 'Germany', 'Berlin');
  assert.equal(market.score, 95);
});

test('multi-criteria evaluation calculates composite score with granular breakdown', () => {
  const player = {
    position: 'Striker',
    secondaryPositions: ['Left Winger'],
    strengths: ['Finishing', 'Acceleration', 'Pressing'],
    location: 'Copenhagen, Denmark',
    preferences: {
      markets: ['Denmark', 'Sweden', 'Germany'],
      contractType: 'Full-time Pro',
      minimumPackage: '€4,000/mo',
    },
  };

  const opportunity = {
    id: 'opp-1',
    club: 'FC Midtjylland',
    position: 'Striker',
    country: 'Denmark',
    city: 'Herning',
    tags: ['Finishing', 'Pressing'],
    requirements: ['High work rate', 'Acceleration'],
    package: '€4,500/mo',
    fit: 85,
  };

  const evaluation = evaluatePlayerMatch(player, opportunity);
  assert.ok(evaluation.compatibilityScore >= 85);
  assert.equal(evaluation.fitBreakdown.positionalFit, 100);
  assert.equal(evaluation.fitBreakdown.locationFit, 100);
  assert.ok(evaluation.isHighMatch);
});

test('matchPlayerToOpportunities ranks opportunities by compatibility score', () => {
  const player = {
    position: 'Center Back',
    strengths: ['Aerial Duels', 'Tackling'],
    location: 'London, UK',
  };

  const opportunities = [
    { id: '1', position: 'Striker', country: 'Spain', tags: ['Pace'], requirements: ['Finishing'] },
    { id: '2', position: 'Center Back', country: 'UK', tags: ['Aerial Duels'], requirements: ['Tackling'] },
    { id: '3', position: 'Left Back', country: 'UK', tags: ['Tackling'], requirements: ['Crossing'] },
  ];

  const matches = matchPlayerToOpportunities(player, opportunities);
  assert.equal(matches[0].id, '2');
  assert.ok(matches[0].compatibilityScore > matches[1].compatibilityScore);
});
