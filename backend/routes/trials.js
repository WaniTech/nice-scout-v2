const express = require('express');
const {
  defaultChecklistTemplates,
  availableTimeSlots,
  ensureTrialsRecord,
  calculateChecklistProgress,
} = require('../services/trialService');

const allowedStatuses = new Set(['Pending', 'Confirmed', 'Rescheduled', 'Declined', 'Completed']);

function createTrialsRouter(store, socketService) {
  const router = express.Router();

  // Get all trial bookings for a player
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureTrialsRecord(data);

    const playerTrials = data.trials
      .filter((t) => t.playerId === req.params.playerId)
      .map((t) => ({
        ...t,
        progress: calculateChecklistProgress(t.checklist),
      }));

    return res.json(playerTrials);
  });

  // Schedule or request a new trial booking
  router.post('/:playerId/schedule', async (req, res) => {
    const {
      opportunityId,
      club,
      trialDate,
      timeSlot = availableTimeSlots[0],
      location = 'Club Training Grounds',
      scoutContact = 'Head of Academy Recruitment',
      notes = '',
    } = req.body;

    if (!opportunityId || !trialDate) {
      return res.status(400).json({ error: 'opportunityId and trialDate are required.' });
    }

    const trial = await store.update((data) => {
      ensureTrialsRecord(data);
      const now = new Date().toISOString();

      const existingIndex = data.trials.findIndex(
        (t) => t.playerId === req.params.playerId && t.opportunityId === opportunityId
      );

      const checklist = defaultChecklistTemplates.map((item) => ({ ...item }));

      if (existingIndex >= 0) {
        data.trials[existingIndex] = {
          ...data.trials[existingIndex],
          club: club || data.trials[existingIndex].club,
          trialDate,
          timeSlot,
          location,
          scoutContact,
          notes: notes || data.trials[existingIndex].notes,
          status: 'Confirmed',
          updatedAt: now,
        };
        return data.trials[existingIndex];
      }

      const newTrial = {
        id: `trial-${Date.now()}`,
        playerId: req.params.playerId,
        opportunityId,
        club: club || 'Target Club',
        trialDate,
        timeSlot,
        location,
        scoutContact,
        status: 'Confirmed',
        notes,
        checklist,
        createdAt: now,
        updatedAt: now,
      };

      data.trials.push(newTrial);
      return newTrial;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'trial_scheduled',
        trial,
      });
    }

    return res.status(201).json({
      ...trial,
      progress: calculateChecklistProgress(trial.checklist),
    });
  });

  // RSVP to a trial (Confirm, Reschedule, Decline)
  router.patch('/:playerId/:trialId/rsvp', async (req, res) => {
    const { status, reason = '', requestedDate = '', requestedTimeSlot = '' } = req.body;

    if (!status || !allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'Valid status is required (Pending, Confirmed, Rescheduled, Declined).' });
    }

    const updatedTrial = await store.update((data) => {
      ensureTrialsRecord(data);
      const trial = data.trials.find(
        (t) => t.playerId === req.params.playerId && t.id === req.params.trialId
      );

      if (!trial) return null;

      trial.status = status;
      if (status === 'Rescheduled' && requestedDate) {
        trial.trialDate = requestedDate;
        if (requestedTimeSlot) trial.timeSlot = requestedTimeSlot;
      }
      trial.notes = reason ? `[RSVP: ${status}] ${reason}` : trial.notes;
      trial.updatedAt = new Date().toISOString();

      return trial;
    });

    if (!updatedTrial) {
      return res.status(404).json({ error: 'Trial booking not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'trial_rsvp_updated',
        trial: updatedTrial,
      });
    }

    return res.json({
      ...updatedTrial,
      progress: calculateChecklistProgress(updatedTrial.checklist),
    });
  });

  // Toggle checklist item for trial preparation
  router.patch('/:playerId/:trialId/checklist/:itemId', async (req, res) => {
    const { completed } = req.body;

    const updatedTrial = await store.update((data) => {
      ensureTrialsRecord(data);
      const trial = data.trials.find(
        (t) => t.playerId === req.params.playerId && t.id === req.params.trialId
      );

      if (!trial) return null;

      const item = trial.checklist.find((c) => c.id === req.params.itemId);
      if (!item) return { missingItem: true };

      item.completed = typeof completed === 'boolean' ? completed : !item.completed;
      trial.updatedAt = new Date().toISOString();

      return trial;
    });

    if (!updatedTrial) {
      return res.status(404).json({ error: 'Trial booking not found.' });
    }
    if (updatedTrial.missingItem) {
      return res.status(404).json({ error: 'Checklist item not found.' });
    }

    return res.json({
      ...updatedTrial,
      progress: calculateChecklistProgress(updatedTrial.checklist),
    });
  });

  return router;
}

module.exports = {
  createTrialsRouter,
};
