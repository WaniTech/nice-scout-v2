const express = require('express');
const {
  ensurePathwayRecord,
  toggleMilestoneStatus,
  simulatePathwayScenario,
} = require('../services/pathwayService');

function createPathwayRouter(store, socketService) {
  const router = express.Router();

  // GET /api/pathway/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    const record = ensurePathwayRecord(data, req.params.playerId);
    return res.json(record);
  });

  // PATCH /api/pathway/:playerId/milestones/:milestoneId
  router.patch('/:playerId/milestones/:milestoneId', async (req, res) => {
    const { status, notes } = req.body || {};

    const updated = await store.update((data) => {
      const record = ensurePathwayRecord(data, req.params.playerId);
      const milestone = toggleMilestoneStatus(record, req.params.milestoneId, status, notes);
      if (!milestone) return null;

      return { record, milestone };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'pathway_milestone_updated',
        trajectoryRating: updated.record.trajectoryRating,
        milestone: updated.milestone,
      });
    }

    return res.json({
      trajectoryRating: updated.record.trajectoryRating,
      milestone: updated.milestone,
    });
  });

  // POST /api/pathway/:playerId/simulate
  router.post('/:playerId/simulate', async (req, res) => {
    const { name, pathwayType, targetHorizonYears, customFocus } = req.body || {};

    const updated = await store.update((data) => {
      const record = ensurePathwayRecord(data, req.params.playerId);
      const scenario = simulatePathwayScenario(record, {
        name,
        pathwayType,
        targetHorizonYears,
        customFocus,
      });
      return { record, scenario };
    });

    if (!updated) {
      return res.status(500).json({ error: 'Could not simulate pathway scenario' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'pathway_scenario_simulated',
        scenario: updated.scenario,
        trajectoryRating: updated.record.trajectoryRating,
      });
    }

    return res.status(201).json(updated.scenario);
  });

  return router;
}

module.exports = {
  createPathwayRouter,
};
