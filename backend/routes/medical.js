const express = require('express');
const {
  ensureMedicalRecord,
  calculateMedicalReadiness,
} = require('../services/medicalService');

function createMedicalRouter(store, socketService) {
  const router = express.Router();

  // GET /api/medical/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureMedicalRecord(data, req.params.playerId);

    const record = data.medicalRecords.find((r) => r.playerId === req.params.playerId);
    const readiness = calculateMedicalReadiness(record);

    return res.json({
      playerId: req.params.playerId,
      readiness,
      record,
    });
  });

  // POST /api/medical/:playerId/injuries
  router.post('/:playerId/injuries', async (req, res) => {
    const {
      type,
      bodyPart,
      dateOccurred,
      returnToPlayDate,
      recoveryWeeks,
      recurrenceRisk = 'Low',
      treatingPhysio = '',
      status = 'Fully Resolved',
      notes = '',
    } = req.body;

    if (!type || !bodyPart || !dateOccurred) {
      return res.status(400).json({ error: 'type, bodyPart, and dateOccurred are required.' });
    }

    const updated = await store.update((data) => {
      ensureMedicalRecord(data, req.params.playerId);
      const record = data.medicalRecords.find((r) => r.playerId === req.params.playerId);
      if (!record) return null;

      const newInjury = {
        id: `inj-${Date.now()}`,
        playerId: req.params.playerId,
        type: String(type).trim(),
        bodyPart: String(bodyPart).trim(),
        dateOccurred: String(dateOccurred).trim(),
        returnToPlayDate: returnToPlayDate ? String(returnToPlayDate).trim() : '',
        recoveryWeeks: Number(recoveryWeeks) || 1,
        recurrenceRisk: String(recurrenceRisk).trim(),
        treatingPhysio: String(treatingPhysio).trim(),
        status: String(status).trim(),
        notes: String(notes).trim(),
      };

      record.injuries.unshift(newInjury);
      return newInjury;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'medical_injury_logged',
        injury: updated,
      });
    }

    return res.status(201).json(updated);
  });

  // PATCH /api/medical/:playerId/clearance
  router.patch('/:playerId/clearance', async (req, res) => {
    const {
      clearanceStatus,
      cardiacScreeningDate,
      cardiacScreeningStatus,
      bloodPanelStatus,
      concussionBaselineDate,
      orthopedicSummary,
    } = req.body;

    const updatedRecord = await store.update((data) => {
      ensureMedicalRecord(data, req.params.playerId);
      const record = data.medicalRecords.find((r) => r.playerId === req.params.playerId);
      if (!record) return null;

      if (clearanceStatus) record.clearanceStatus = clearanceStatus;
      if (cardiacScreeningDate !== undefined) record.cardiacScreeningDate = cardiacScreeningDate;
      if (cardiacScreeningStatus !== undefined) record.cardiacScreeningStatus = cardiacScreeningStatus;
      if (bloodPanelStatus !== undefined) record.bloodPanelStatus = bloodPanelStatus;
      if (concussionBaselineDate !== undefined) record.concussionBaselineDate = concussionBaselineDate;
      if (orthopedicSummary !== undefined) record.orthopedicSummary = orthopedicSummary;

      return record;
    });

    if (!updatedRecord) {
      return res.status(404).json({ error: 'Medical record not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'medical_clearance_updated',
        record: updatedRecord,
      });
    }

    return res.json(updatedRecord);
  });

  // POST /api/medical/:playerId/protocols
  router.post('/:playerId/protocols', async (req, res) => {
    const { title, focus, frequency = '3x / week', status = 'Active Maintenance' } = req.body;

    if (!title || !focus) {
      return res.status(400).json({ error: 'title and focus are required.' });
    }

    const newProtocol = await store.update((data) => {
      ensureMedicalRecord(data, req.params.playerId);
      const record = data.medicalRecords.find((r) => r.playerId === req.params.playerId);
      if (!record) return null;

      const prot = {
        id: `prot-${Date.now()}`,
        title: String(title).trim(),
        focus: String(focus).trim(),
        frequency: String(frequency).trim(),
        completedRounds: 1,
        status: String(status).trim(),
      };

      record.rehabProtocols.unshift(prot);
      return prot;
    });

    return res.status(201).json(newProtocol);
  });

  return router;
}

module.exports = {
  createMedicalRouter,
};
