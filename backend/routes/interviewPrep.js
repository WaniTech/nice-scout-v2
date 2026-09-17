const express = require('express');
const {
  ensureInterviewPrepRecord,
  toggleQuestionPracticed,
  logSimulatedInterview,
} = require('../services/interviewPrepService');

function createInterviewPrepRouter(store, socketService) {
  const router = express.Router();

  // GET /api/interview-prep/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    const record = ensureInterviewPrepRecord(data, req.params.playerId);
    return res.json(record);
  });

  // PATCH /api/interview-prep/:playerId/questions/:questionId
  router.patch('/:playerId/questions/:questionId', async (req, res) => {
    const { notes } = req.body || {};

    const updated = await store.update((data) => {
      const record = ensureInterviewPrepRecord(data, req.params.playerId);
      const question = toggleQuestionPracticed(record, req.params.questionId, notes);
      if (!question) return null;

      return { record, question };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'interview_prep_updated',
        overallReadinessScore: updated.record.overallReadinessScore,
        question: updated.question,
      });
    }

    return res.json({
      overallReadinessScore: updated.record.overallReadinessScore,
      question: updated.question,
    });
  });

  // POST /api/interview-prep/:playerId/simulate
  router.post('/:playerId/simulate', async (req, res) => {
    const { club, score, feedback } = req.body || {};

    const updated = await store.update((data) => {
      const record = ensureInterviewPrepRecord(data, req.params.playerId);
      const session = logSimulatedInterview(record, { club, score, feedback });
      return { record, session };
    });

    if (!updated) {
      return res.status(500).json({ error: 'Could not log interview simulation' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'interview_simulation_logged',
        session: updated.session,
        overallReadinessScore: updated.record.overallReadinessScore,
      });
    }

    return res.status(201).json(updated.session);
  });

  return router;
}

module.exports = {
  createInterviewPrepRouter,
};
