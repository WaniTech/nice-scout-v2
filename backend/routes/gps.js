const express = require('express');
const {
  ensureGpsRecord,
  calculateWorkloadDiagnostics,
} = require('../services/gpsService');

function createGpsRouter(store, socketService) {
  const router = express.Router();

  // Get GPS tracking report, workload metrics, and session logs
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureGpsRecord(data, req.params.playerId);

    const sessions = data.gpsSessions.filter((s) => s.playerId === req.params.playerId);
    const diagnostics = calculateWorkloadDiagnostics(sessions);

    return res.json({
      playerId: req.params.playerId,
      diagnostics,
      sessions,
    });
  });

  // Log a new athletic GPS training / match session
  router.post('/:playerId', async (req, res) => {
    const {
      sessionType = 'Match Simulation',
      durationMinutes = 90,
      totalDistanceKm = 10.5,
      highSpeedRunningMeters = 850,
      sprintDistanceMeters = 320,
      topSpeedKmh = 34.2,
      accelerationsCount = 40,
      decelerationsCount = 35,
      heartRateAvgBpm = 165,
      heartRateMaxBpm = 190,
      rpeScore = 8,
      notes = '',
    } = req.body;

    const newSession = await store.update((data) => {
      ensureGpsRecord(data, req.params.playerId);
      const now = new Date().toISOString();

      const playerLoadScore = Math.round(
        (Number(totalDistanceKm) * 35) + (Number(highSpeedRunningMeters) * 0.25) + (Number(sprintDistanceMeters) * 0.45)
      );

      const session = {
        id: `gps-${Date.now()}`,
        playerId: req.params.playerId,
        date: now.split('T')[0],
        sessionType,
        durationMinutes: Number(durationMinutes) || 90,
        totalDistanceKm: Number(totalDistanceKm) || 10.0,
        highSpeedRunningMeters: Number(highSpeedRunningMeters) || 800,
        sprintDistanceMeters: Number(sprintDistanceMeters) || 300,
        topSpeedKmh: Number(topSpeedKmh) || 34.0,
        accelerationsCount: Number(accelerationsCount) || 35,
        decelerationsCount: Number(decelerationsCount) || 30,
        heartRateAvgBpm: Number(heartRateAvgBpm) || 160,
        heartRateMaxBpm: Number(heartRateMaxBpm) || 185,
        playerLoadScore,
        rpeScore: Number(rpeScore) || 7,
        readinessStatus: 'Optimal Fit',
        notes,
      };

      data.gpsSessions.unshift(session);
      return session;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'gps_session_logged',
        session: newSession,
      });
    }

    return res.status(201).json(newSession);
  });

  return router;
}

module.exports = {
  createGpsRouter,
};
