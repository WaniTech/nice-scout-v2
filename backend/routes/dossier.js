const express = require('express');
const {
  ensureDossierRecord,
  compileDossier,
  generateDossierExport,
} = require('../services/dossierService');

function createDossierRouter(store, socketService) {
  const router = express.Router();

  // GET /api/dossier/:playerId
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    const dossier = compileDossier(data, req.params.playerId);
    return res.json(dossier);
  });

  // POST /api/dossier/:playerId/export
  router.post('/:playerId/export', async (req, res) => {
    const { format = 'PDF', targetClub = 'General Scout Desk', scoutRecipient = 'Accredited Scout', templateId = 'template-executive' } = req.body || {};

    const updated = await store.update((data) => {
      const dossier = compileDossier(data, req.params.playerId);
      const newExport = generateDossierExport(dossier, {
        format,
        targetClub,
        scoutRecipient,
        templateId,
      });

      return { dossier, newExport };
    });

    if (!updated) {
      return res.status(404).json({ error: 'Player dossier could not be compiled.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'dossier_export_generated',
        export: updated.newExport,
      });
    }

    return res.status(201).json(updated.newExport);
  });

  // GET /api/dossier/:playerId/export/:exportId
  router.get('/:playerId/export/:filename', async (req, res) => {
    const data = await store.read();
    const dossier = compileDossier(data, req.params.playerId);

    const [exportId, ext] = req.params.filename.split('.');
    const record = dossier.exportsHistory?.find((e) => e.id === exportId);

    if (!record) {
      return res.status(404).json({ error: 'Export record not found.' });
    }

    if (ext === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${dossier.dossierId}_${exportId}.json"`);
      return res.json({
        dossierId: dossier.dossierId,
        metadata: record,
        dossier,
      });
    }

    // Mock PDF payload delivery
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${dossier.dossierId}_${exportId}.pdf"`);
    return res.send(`%PDF-1.4 Mock Scout Intelligence Dossier Export for ${dossier.playerId} [ID: ${exportId}]`);
  });

  return router;
}

module.exports = {
  createDossierRouter,
};
