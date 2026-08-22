const express = require('express');
const { matchPlayerToClubs, evaluateSingleMatch } = require('../controllers/playerMatchController');

function createPlayerMatchRouter(store) {
  const router = express.Router();

  router.post('/match', async (req, res) => {
    try {
      const data = await store.read();
      const { profile, playerProfile, options, weights, minCompatibility, limit } = req.body || {};
      const targetProfile = profile || playerProfile || req.body;
      const matchOptions = {
        weights,
        minCompatibility,
        limit,
        ...(options || {}),
      };

      const matches = await matchPlayerToClubs(targetProfile, data.opportunities || [], matchOptions);
      res.status(200).json(matches);
    } catch (error) {
      console.error('Player match error:', error);
      res.status(500).json({ error: 'Player matching calculation failed.' });
    }
  });

  router.post('/evaluate/:opportunityId', async (req, res) => {
    try {
      const data = await store.read();
      const opportunity = (data.opportunities || []).find((o) => String(o.id) === String(req.params.opportunityId));
      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found.' });
      }

      const { profile, playerProfile, weights } = req.body || {};
      const targetProfile = profile || playerProfile || req.body;
      const evaluation = await evaluateSingleMatch(targetProfile, opportunity, weights);
      res.status(200).json(evaluation);
    } catch (error) {
      console.error('Player evaluation error:', error);
      res.status(500).json({ error: 'Opportunity evaluation calculation failed.' });
    }
  });

  return router;
}

module.exports = {
  createPlayerMatchRouter,
};
