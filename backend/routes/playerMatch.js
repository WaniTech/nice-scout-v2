const express = require('express');
const { matchPlayerToClubs } = require('../controllers/playerMatchController');

function createPlayerMatchRouter(store) {
  const router = express.Router();

  router.post('/match', async (req, res) => {
    try {
      const data = await store.read();
      const matches = await matchPlayerToClubs(req.body, data.opportunities);
      res.status(200).json(matches);
    } catch (error) {
      console.error('Player match error:', error);
      res.status(500).json({ error: 'Player matching failed.' });
    }
  });

  return router;
}

module.exports = {
  createPlayerMatchRouter,
};
