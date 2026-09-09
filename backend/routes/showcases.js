const express = require('express');
const {
  ensureShowcaseRecord,
  calculateShowcaseMetrics,
} = require('../services/showcaseService');

const validStatuses = new Set(['Invited', 'Attending', 'Declined', 'Completed']);

function createShowcaseRouter(store, socketService) {
  const router = express.Router();

  // GET /api/showcases/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureShowcaseRecord(data, req.params.playerId);

    const playerShowcases = data.showcases.filter((s) => s.playerId === req.params.playerId);
    const metrics = calculateShowcaseMetrics(playerShowcases);

    return res.json({
      playerId: req.params.playerId,
      metrics,
      showcases: playerShowcases,
    });
  });

  // POST /api/showcases/:playerId/:showcaseId/rsvp
  router.post('/:playerId/:showcaseId/rsvp', async (req, res) => {
    const { rsvpStatus, assignedSquad, notes } = req.body;

    if (!rsvpStatus || !validStatuses.has(rsvpStatus)) {
      return res.status(400).json({ error: 'Valid rsvpStatus is required (Invited, Attending, Declined, Completed).' });
    }

    const updated = await store.update((data) => {
      ensureShowcaseRecord(data, req.params.playerId);
      const target = data.showcases.find(
        (s) => s.playerId === req.params.playerId && s.id === req.params.showcaseId
      );

      if (!target) return null;

      target.rsvpStatus = rsvpStatus;
      if (assignedSquad) target.assignedSquad = String(assignedSquad).trim();
      if (notes) target.notes = String(notes).trim();

      return target;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Showcase not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'showcase_rsvp_updated',
        showcase: updated,
      });
    }

    return res.json(updated);
  });

  // POST /api/showcases/:playerId
  router.post('/:playerId', async (req, res) => {
    const {
      title,
      organizer,
      location,
      city,
      country,
      startDate,
      endDate,
      format,
      ageCategory,
      confirmedScoutsCount = 10,
      confirmedClubs = [],
      pitchType = 'Grass Pitch',
      registrationDeadline,
      assignedSquad = 'Pending Allocation',
    } = req.body;

    if (!title || !location || !startDate) {
      return res.status(400).json({ error: 'title, location, and startDate are required.' });
    }

    const created = await store.update((data) => {
      ensureShowcaseRecord(data, req.params.playerId);
      const now = new Date().toISOString();

      const newShowcase = {
        id: `showcase-${Date.now()}`,
        playerId: req.params.playerId,
        title: String(title).trim(),
        organizer: organizer ? String(organizer).trim() : 'Regional Scout Association',
        location: String(location).trim(),
        city: city ? String(city).trim() : '',
        country: country ? String(country).trim() : '',
        startDate: String(startDate).trim(),
        endDate: endDate ? String(endDate).trim() : String(startDate).trim(),
        format: format ? String(format).trim() : '11v11 Showcase Matches',
        ageCategory: ageCategory ? String(ageCategory).trim() : 'U19 - U23',
        confirmedScoutsCount: Number(confirmedScoutsCount) || 5,
        confirmedClubs: Array.isArray(confirmedClubs) ? confirmedClubs : [],
        pitchType: String(pitchType).trim(),
        registrationDeadline: registrationDeadline ? String(registrationDeadline).trim() : startDate,
        rsvpStatus: 'Invited',
        assignedSquad: String(assignedSquad).trim(),
        matchSchedule: [],
        notes: 'Official scouting combine invitation.',
        createdAt: now,
      };

      data.showcases.unshift(newShowcase);
      return newShowcase;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'showcase_invitation_received',
        showcase: created,
      });
    }

    return res.status(201).json(created);
  });

  return router;
}

module.exports = {
  createShowcaseRouter,
};
