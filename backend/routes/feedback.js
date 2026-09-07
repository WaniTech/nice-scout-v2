const express = require('express');
const {
  ensureFeedbackRecord,
  calculateFeedbackMetrics,
} = require('../services/feedbackService');

function createFeedbackRouter(store, socketService) {
  const router = express.Router();

  // GET /api/feedback/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureFeedbackRecord(data, req.params.playerId);

    const playerEvaluations = data.evaluations.filter((e) => e.playerId === req.params.playerId);
    const metrics = calculateFeedbackMetrics(playerEvaluations);

    return res.json({
      playerId: req.params.playerId,
      metrics,
      evaluations: playerEvaluations,
    });
  });

  // POST /api/feedback/:playerId
  router.post('/:playerId', async (req, res) => {
    const {
      scoutName,
      club,
      league = 'Professional Scouting Circuit',
      matchOpponent,
      matchDate,
      overallRating,
      categories,
      recommendation = 'Monitor Progress',
      strengthsObserved = [],
      coachingNotes = '',
    } = req.body;

    if (!scoutName || !club || !matchOpponent || overallRating === undefined) {
      return res.status(400).json({ error: 'scoutName, club, matchOpponent, and overallRating are required.' });
    }

    const ratingNum = Number(overallRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      return res.status(400).json({ error: 'overallRating must be a number between 1 and 10.' });
    }

    const newEvaluation = await store.update((data) => {
      ensureFeedbackRecord(data, req.params.playerId);
      const now = new Date().toISOString();

      const evalEntry = {
        id: `eval-${Date.now()}`,
        playerId: req.params.playerId,
        scoutId: `scout-${Date.now()}`,
        scoutName: String(scoutName).trim(),
        club: String(club).trim(),
        league,
        matchOpponent: String(matchOpponent).trim(),
        matchDate: matchDate || now.split('T')[0],
        overallRating: ratingNum,
        categories: {
          gameIntelligence: Number(categories?.gameIntelligence) || ratingNum,
          technicalExecution: Number(categories?.technicalExecution) || ratingNum,
          physicalImpact: Number(categories?.physicalImpact) || ratingNum,
          tacticalDiscipline: Number(categories?.tacticalDiscipline) || ratingNum,
        },
        recommendation,
        strengthsObserved: Array.isArray(strengthsObserved) ? strengthsObserved : [],
        coachingNotes: String(coachingNotes || '').trim(),
        acknowledged: false,
        createdAt: now,
      };

      data.evaluations.unshift(evalEntry);
      return evalEntry;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'scout_evaluation_received',
        evaluation: newEvaluation,
      });
    }

    return res.status(201).json(newEvaluation);
  });

  // PATCH /api/feedback/:playerId/:evaluationId
  router.patch('/:playerId/:evaluationId', async (req, res) => {
    const { acknowledged, coachingNotes } = req.body;

    const updated = await store.update((data) => {
      ensureFeedbackRecord(data, req.params.playerId);
      const target = data.evaluations.find(
        (e) => e.playerId === req.params.playerId && e.id === req.params.evaluationId
      );

      if (!target) return null;

      if (typeof acknowledged === 'boolean') {
        target.acknowledged = acknowledged;
      }
      if (typeof coachingNotes === 'string') {
        target.coachingNotes = coachingNotes.trim();
      }

      return target;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'scout_evaluation_updated',
        evaluation: updated,
      });
    }

    return res.json(updated);
  });

  return router;
}

module.exports = {
  createFeedbackRouter,
};
