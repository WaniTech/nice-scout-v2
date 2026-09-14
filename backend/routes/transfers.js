const express = require('express');
const {
  ensureTransferRecord,
  calculateMarketValuation,
} = require('../services/transferService');

const validTransferStatuses = new Set([
  'Free Agent',
  'Under Contract',
  'Loan Listed',
  'Transfer Listed',
  'Academy Prospect',
]);

function createTransferRouter(store, socketService) {
  const router = express.Router();

  // GET /api/transfers/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureTransferRecord(data, req.params.playerId);

    const record = data.transfers?.find((t) => t.playerId === req.params.playerId);
    if (!record) {
      return res.status(404).json({ error: 'Player transfer profile not found.' });
    }

    return res.json(record);
  });

  // POST /api/transfers/:playerId/pitch
  router.post('/:playerId/pitch', async (req, res) => {
    const { mandateId, message, attachedClipCount = 2 } = req.body;

    if (!mandateId) {
      return res.status(400).json({ error: 'mandateId is required.' });
    }

    const updated = await store.update((data) => {
      ensureTransferRecord(data, req.params.playerId);
      const record = data.transfers?.find((t) => t.playerId === req.params.playerId);
      if (!record) return null;

      const mandate = record.mandates?.find((m) => m.id === mandateId);
      if (!mandate) return null;

      const newPitch = {
        id: `pitch-${Date.now()}`,
        mandateId: mandate.id,
        playerId: req.params.playerId,
        club: mandate.club,
        pitchDate: new Date().toISOString(),
        status: 'Submitted',
        message: message ? String(message).trim() : `Dossier submitted for ${mandate.club} recruitment mandate.`,
        attachedClipCount: Number(attachedClipCount) || 1,
      };

      if (!record.pitches) {
        record.pitches = [];
      }
      record.pitches.unshift(newPitch);

      return { record, newPitch };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Player record or mandate not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'mandate_pitch_submitted',
        pitch: updated.newPitch,
      });
    }

    return res.status(201).json(updated.newPitch);
  });

  // PATCH /api/transfers/:playerId/status
  router.patch('/:playerId/status', async (req, res) => {
    const { transferStatus, contractExpiry, releaseClauseEur } = req.body;

    if (transferStatus && !validTransferStatuses.has(transferStatus)) {
      return res.status(400).json({ error: 'Invalid transfer status provided.' });
    }

    const updated = await store.update((data) => {
      ensureTransferRecord(data, req.params.playerId);
      const record = data.transfers?.find((t) => t.playerId === req.params.playerId);
      if (!record) return null;

      if (transferStatus) {
        record.transferStatus = transferStatus;
      }
      if (contractExpiry !== undefined) {
        record.contractExpiry = String(contractExpiry).trim();
      }
      if (releaseClauseEur !== undefined) {
        record.releaseClauseEur = releaseClauseEur === null ? null : Number(releaseClauseEur);
      }

      return record;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Player transfer record not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'transfer_status_updated',
        transfer: updated,
      });
    }

    return res.json(updated);
  });

  // POST /api/transfers/:playerId/valuation/recalculate
  router.post('/:playerId/valuation/recalculate', async (req, res) => {
    const factors = req.body || {};

    const updated = await store.update((data) => {
      ensureTransferRecord(data, req.params.playerId);
      const record = data.transfers?.find((t) => t.playerId === req.params.playerId);
      if (!record) return null;

      const newValuation = calculateMarketValuation(factors);
      record.valuation = {
        ...record.valuation,
        ...newValuation,
      };

      return record;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Player transfer record not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'transfer_valuation_recalculated',
        valuation: updated.valuation,
      });
    }

    return res.json(updated.valuation);
  });

  return router;
}

module.exports = {
  createTransferRouter,
};
