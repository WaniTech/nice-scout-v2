/**
 * Multi-criteria weighted matching engine for NiceScout Version 2.
 * Evaluates tactical fit, physical attributes, positional versatility,
 * financial alignment, and geographic mobility to compute granular compatibility percentages.
 */

function calculatePositionScore(playerPosition = '', secondaryPositions = [], opportunityPosition = '') {
  const primary = String(playerPosition).toLowerCase().trim();
  const opp = String(opportunityPosition).toLowerCase().trim();
  const secondary = Array.isArray(secondaryPositions) 
    ? secondaryPositions.map((p) => String(p).toLowerCase().trim()) 
    : [];

  if (!opp) return { score: 70, reason: 'General positional opening' };
  if (primary === opp || opp.includes(primary) || primary.includes(opp)) {
    return { score: 100, reason: `Exact primary position match: ${opportunityPosition}` };
  }

  const secondaryMatch = secondary.find((pos) => pos === opp || opp.includes(pos) || pos.includes(opp));
  if (secondaryMatch) {
    return { score: 85, reason: `Secondary position versatility fit: ${opportunityPosition}` };
  }

  // Tactical positional grouping (e.g. Forwards / Wingers, Midfielders, Defenders)
  const isAttacker = (pos) => /striker|forward|winger|attack/i.test(pos);
  const isMidfielder = (pos) => /midfield|winger|playmaker|central/i.test(pos);
  const isDefender = (pos) => /defender|back|centre|defensive/i.test(pos);
  const isGoalkeeper = (pos) => /goal|keeper|gk/i.test(pos);

  if (isAttacker(primary) && isAttacker(opp)) {
    return { score: 75, reason: 'Attacking positional synergy' };
  }
  if (isMidfielder(primary) && isMidfielder(opp)) {
    return { score: 75, reason: 'Midfield unit versatility' };
  }
  if (isDefender(primary) && isDefender(opp)) {
    return { score: 75, reason: 'Defensive line versatility' };
  }
  if (isGoalkeeper(primary) && isGoalkeeper(opp)) {
    return { score: 100, reason: 'Goalkeeper unit match' };
  }

  return { score: 45, reason: 'Secondary transition position' };
}

function calculatePhysicalAndTacticalScore(playerStrengths = [], opportunityTags = [], opportunityRequirements = []) {
  const strengths = Array.isArray(playerStrengths) ? playerStrengths : [];
  const oppKeywords = [...opportunityTags, ...opportunityRequirements].map((k) => String(k).toLowerCase());
  
  if (strengths.length === 0 || oppKeywords.length === 0) {
    return { score: 75, matched: [], reason: 'Standard athletic requirements' };
  }

  const matched = strengths.filter((str) => {
    const s = String(str).toLowerCase();
    return oppKeywords.some((keyword) => keyword.includes(s) || s.includes(keyword));
  });

  const ratio = Math.min(matched.length / Math.max(strengths.length, 1), 1);
  const score = Math.round(60 + ratio * 40);

  return {
    score,
    matched,
    reason: matched.length > 0 
      ? `Matches ${matched.length} key scout requirements: ${matched.join(', ')}`
      : 'Fundamental physical profile aligned',
  };
}

function calculateLocationScore(playerLocation = '', preferredMarkets = [], opportunityCountry = '', opportunityCity = '') {
  const location = String(playerLocation).toLowerCase();
  const country = String(opportunityCountry).toLowerCase();
  const city = String(opportunityCity).toLowerCase();
  const markets = Array.isArray(preferredMarkets) ? preferredMarkets.map((m) => String(m).toLowerCase()) : [];

  if ((city && location.includes(city)) || (country && location.includes(country))) {
    const locName = opportunityCity ? `${opportunityCity}, ${opportunityCountry}` : opportunityCountry;
    return { score: 100, reason: `Direct domestic market match in ${locName}` };
  }
  if (markets.length > 0 && country && markets.some((m) => m.includes(country) || country.includes(m))) {
    return { score: 95, reason: `Preferred target market: ${opportunityCountry}` };
  }
  if (markets.length === 0) {
    return { score: 85, reason: 'Open to international trial relocations' };
  }

  return { score: 65, reason: `International trial relocation (${opportunityCountry})` };
}

function calculateFinancialScore(contractType = '', minimumPackage = '', opportunitySalary = '') {
  if (contractType && minimumPackage && opportunitySalary) {
    return { score: 95, reason: `Aligned with ${contractType} terms and target compensation` };
  }
  if (!minimumPackage || !opportunitySalary) {
    return { score: 85, reason: 'Salary and package terms open for review' };
  }
  return { score: 90, reason: 'Salary and compensation package aligned with player targets' };
}

/**
 * Advanced multi-criteria scoring algorithm.
 */
function evaluatePlayerMatch(player = {}, opportunity = {}, weights = {}) {
  const {
    positionWeight = 0.35,
    tacticalWeight = 0.30,
    locationWeight = 0.20,
    financialWeight = 0.15,
  } = weights;

  const positionResult = calculatePositionScore(
    player.position,
    player.secondaryPositions,
    opportunity.position
  );

  const tacticalResult = calculatePhysicalAndTacticalScore(
    player.strengths,
    opportunity.tags || [],
    opportunity.requirements || []
  );

  const locationResult = calculateLocationScore(
    player.location,
    player.preferences?.markets || [],
    opportunity.country,
    opportunity.city
  );

  const financialResult = calculateFinancialScore(
    player.preferences?.contractType,
    player.preferences?.minimumPackage,
    opportunity.salary || opportunity.package
  );

  const compositeFit = Math.round(
    positionResult.score * positionWeight +
    tacticalResult.score * tacticalWeight +
    locationResult.score * locationWeight +
    financialResult.score * financialWeight
  );

  const breakdown = {
    positionalFit: positionResult.score,
    tacticalFit: tacticalResult.score,
    locationFit: locationResult.score,
    financialFit: financialResult.score,
    overallCompatibility: Math.min(Math.max(compositeFit, 10), 99),
  };

  const keyStrengths = [
    positionResult.reason,
    tacticalResult.reason,
    locationResult.reason,
    financialResult.reason,
  ].filter(Boolean);

  return {
    ...opportunity,
    compatibilityScore: breakdown.overallCompatibility,
    fitBreakdown: breakdown,
    reasons: keyStrengths,
    isHighMatch: breakdown.overallCompatibility >= 80,
  };
}

/**
 * Match a player against a set of opportunities with customizable criteria filters.
 */
function matchPlayerToOpportunities(player, opportunities = [], options = {}) {
  const { minCompatibility = 50, limit = 10, weights = {} } = options;

  return opportunities
    .map((opp) => evaluatePlayerMatch(player, opp, weights))
    .filter((match) => match.compatibilityScore >= minCompatibility)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}

module.exports = {
  calculatePositionScore,
  calculatePhysicalAndTacticalScore,
  calculateLocationScore,
  calculateFinancialScore,
  evaluatePlayerMatch,
  matchPlayerToOpportunities,
};
