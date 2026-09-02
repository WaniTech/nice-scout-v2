const express = require('express');
const {
  ensureTelestrationsRecord,
  calculateTelestrationSummary,
  tacticalTagTaxonomy,
} = require('../services/annotationService');

const allowedTypes = new Set(['Telestration', 'FreezeFrame', 'Spotlight', 'ZoneHighlight']);

function createAnnotationRouter(store, socketService) {
  const router = express.Router();

  // Get all video annotations and summary for a player or specific clip
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureTelestrationsRecord(data, req.params.playerId);

    const { clipId } = req.query;
    let annotations = data.telestrations.filter((t) => t.playerId === req.params.playerId);

    if (clipId) {
      annotations = annotations.filter((t) => t.clipId === clipId);
    }

    const summary = calculateTelestrationSummary(annotations);

    return res.json({
      playerId: req.params.playerId,
      summary,
      taxonomy: tacticalTagTaxonomy,
      annotations,
    });
  });

  // Create a new telestration markup on a video clip
  router.post('/:playerId', async (req, res) => {
    const {
      clipId,
      title,
      timestampSeconds = 0,
      timestampFormatted,
      type = 'Telestration',
      drawingData = {},
      tacticalCategory = 'Attacking Transition',
      coachingNote = '',
      verifiedByScout = '',
    } = req.body;

    if (!clipId || !title) {
      return res.status(400).json({ error: 'clipId and title are required.' });
    }

    if (type && !allowedTypes.has(type)) {
      return res.status(400).json({ error: 'Invalid annotation type.' });
    }

    const formattedTime = timestampFormatted || `${Math.floor(timestampSeconds / 60).toString().padStart(2, '0')}:${(timestampSeconds % 60).toFixed(2).padStart(5, '0')}`;

    const newAnnotation = await store.update((data) => {
      ensureTelestrationsRecord(data, req.params.playerId);
      const now = new Date().toISOString();

      const annotation = {
        id: `tel-${Date.now()}`,
        clipId,
        playerId: req.params.playerId,
        title: String(title).trim(),
        timestampSeconds: Number(timestampSeconds) || 0,
        timestampFormatted: formattedTime,
        type,
        drawingData,
        tacticalCategory,
        coachingNote,
        verifiedByScout,
        shareableUrl: `https://nicescout.app/clips/${clipId}/annotate?t=${timestampSeconds}`,
        createdAt: now,
      };

      data.telestrations.unshift(annotation);
      return annotation;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'video_telestration_added',
        annotation: newAnnotation,
      });
    }

    return res.status(201).json(newAnnotation);
  });

  // Delete a video annotation
  router.delete('/:playerId/:annotationId', async (req, res) => {
    const deleted = await store.update((data) => {
      ensureTelestrationsRecord(data, req.params.playerId);
      const beforeCount = data.telestrations.length;
      data.telestrations = data.telestrations.filter(
        (t) => !(t.playerId === req.params.playerId && t.id === req.params.annotationId)
      );
      return data.telestrations.length !== beforeCount;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Annotation not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'video_telestration_deleted',
        annotationId: req.params.annotationId,
      });
    }

    return res.status(204).send();
  });

  return router;
}

module.exports = {
  createAnnotationRouter,
};
