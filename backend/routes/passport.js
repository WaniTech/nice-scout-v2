const express = require('express');
const {
  ensurePassportRecord,
  calculatePassportScore,
} = require('../services/passportService');

function createPassportRouter(store, socketService) {
  const router = express.Router();

  // Get player career passport
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    const passport = ensurePassportRecord(data, req.params.playerId);
    passport.verificationScore = calculatePassportScore(passport);

    return res.json(passport);
  });

  // Add career milestone to passport
  router.post('/:playerId/milestones', async (req, res) => {
    const { club, role, period, appearances = 0, goals = 0, assists = 0, category = 'Club' } = req.body;

    if (!club || !role || !period) {
      return res.status(400).json({ error: 'club, role, and period are required.' });
    }

    const updatedPassport = await store.update((data) => {
      const passport = ensurePassportRecord(data, req.params.playerId);
      const newMilestone = {
        id: `milestone-${Date.now()}`,
        club: String(club).trim(),
        role: String(role).trim(),
        period: String(period).trim(),
        appearances: Number(appearances) || 0,
        goals: Number(goals) || 0,
        assists: Number(assists) || 0,
        verified: true,
        category,
      };

      passport.milestones.unshift(newMilestone);
      passport.verificationScore = calculatePassportScore(passport);
      passport.updatedAt = new Date().toISOString();

      return passport;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'passport_updated',
        passport: updatedPassport,
      });
    }

    return res.status(201).json(updatedPassport);
  });

  // Update passport metrics / verification details
  router.put('/:playerId/metrics', async (req, res) => {
    const updatedPassport = await store.update((data) => {
      const passport = ensurePassportRecord(data, req.params.playerId);
      passport.metrics = {
        ...passport.metrics,
        ...req.body,
      };
      passport.verificationScore = calculatePassportScore(passport);
      passport.updatedAt = new Date().toISOString();

      return passport;
    });

    return res.json(updatedPassport);
  });

  return router;
}

module.exports = {
  createPassportRouter,
};
