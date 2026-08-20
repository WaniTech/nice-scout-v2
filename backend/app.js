const express = require('express');
const { createAuthRouter } = require('./routes/auth');
const { createOpportunitiesRouter } = require('./routes/opportunities');
const { createPlayerRouter } = require('./routes/player');
const { createPlayerMatchRouter } = require('./routes/playerMatch');

function createApp({ store, socketService } = {}) {
  if (!store) {
    throw new Error('A store instance is required.');
  }

  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      service: 'Scout Link Player API',
      realtime: Boolean(socketService),
      timestamp: new Date().toISOString(),
    });
  });

  // Socket status and management endpoint
  app.get('/api/socket/stats', (req, res) => {
    if (!socketService) {
      return res.status(503).json({ error: 'WebSocket service not attached.' });
    }
    return res.json(socketService.getStats());
  });

  app.post('/api/socket/broadcast', (req, res) => {
    if (!socketService) {
      return res.status(503).json({ error: 'WebSocket service not attached.' });
    }
    const { room, event, payload } = req.body || {};
    if (!event) {
      return res.status(400).json({ error: 'event is required.' });
    }

    if (room) {
      socketService.broadcastToRoom(room, { type: event, ...payload });
    } else {
      socketService.broadcast({ type: event, ...payload });
    }

    return res.json({ ok: true, broadcastedTo: room || 'all' });
  });

  app.use('/api/auth', createAuthRouter(store));
  app.use('/api/opportunities', createOpportunitiesRouter(store));
  app.use('/api/player', createPlayerRouter(store));
  app.use('/api/player-match', createPlayerMatchRouter(store));

  return app;
}

module.exports = {
  createApp,
};
