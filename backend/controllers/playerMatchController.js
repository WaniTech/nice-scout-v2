const { matchPlayerToOpportunities, evaluatePlayerMatch } = require('../services/matchingEngine');

exports.matchPlayerToClubs = async (playerProfile, opportunities, options = {}) => {
  return matchPlayerToOpportunities(playerProfile, opportunities, options);
};

exports.evaluateSingleMatch = async (playerProfile, opportunity, weights) => {
  return evaluatePlayerMatch(playerProfile, opportunity, weights);
};
