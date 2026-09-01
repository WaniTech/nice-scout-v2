const express = require('express');
const {
  ensureWatchlistRecord,
  calculateWatchlistMetrics,
} = require('../services/watchlistService');

const allowedTiers = new Set(['Priority Target', 'Monitored', 'Extended List']);

function createWatchlistRouter(store, socketService) {
  const router = express.Router();

  // Get player watchlist, metrics, and active scout inquiries
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureWatchlistRecord(data, req.params.playerId);

    const playerWatchlist = data.watchlists.filter((w) => w.playerId === req.params.playerId);
    const playerInquiries = data.inquiries.filter((i) => i.playerId === req.params.playerId);
    const metrics = calculateWatchlistMetrics(playerWatchlist);

    return res.json({
      playerId: req.params.playerId,
      metrics,
      watchlists: playerWatchlist,
      inquiries: playerInquiries,
    });
  });

  // Add or update scout on player watchlist
  router.post('/:playerId', async (req, res) => {
    const {
      scoutName,
      club,
      league = 'Professional League',
      role = 'Talent Scout',
      tier = 'Monitored',
      notes = '',
      tags = [],
    } = req.body;

    if (!scoutName || !club) {
      return res.status(400).json({ error: 'scoutName and club are required.' });
    }

    if (tier && !allowedTiers.has(tier)) {
      return res.status(400).json({ error: 'Invalid watchlist tier.' });
    }

    const updated = await store.update((data) => {
      ensureWatchlistRecord(data, req.params.playerId);
      const now = new Date().toISOString();

      const existingIndex = data.watchlists.findIndex(
        (w) => w.playerId === req.params.playerId && w.scoutName.toLowerCase() === scoutName.toLowerCase()
      );

      if (existingIndex >= 0) {
        data.watchlists[existingIndex] = {
          ...data.watchlists[existingIndex],
          club,
          league,
          role,
          tier: tier || data.watchlists[existingIndex].tier,
          notes: notes || data.watchlists[existingIndex].notes,
          tags: Array.isArray(tags) && tags.length ? tags : data.watchlists[existingIndex].tags,
          lastViewedAt: now,
        };
        return data.watchlists[existingIndex];
      }

      const newEntry = {
        id: `watch-${Date.now()}`,
        playerId: req.params.playerId,
        scoutId: `scout-${Date.now()}`,
        scoutName: String(scoutName).trim(),
        club: String(club).trim(),
        league,
        role,
        tier,
        addedDate: now.split('T')[0],
        lastViewedAt: now,
        notes,
        tags: Array.isArray(tags) ? tags : [],
        inquiryStatus: 'Added to Watchlist',
      };

      data.watchlists.unshift(newEntry);
      return newEntry;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'watchlist_updated',
        entry: updated,
      });
    }

    return res.status(201).json(updated);
  });

  // Update watchlist tier or notes
  router.patch('/:playerId/:entryId', async (req, res) => {
    const { tier, notes, inquiryStatus } = req.body;

    if (tier && !allowedTiers.has(tier)) {
      return res.status(400).json({ error: 'Invalid watchlist tier.' });
    }

    const updatedEntry = await store.update((data) => {
      ensureWatchlistRecord(data, req.params.playerId);
      const entry = data.watchlists.find(
        (w) => w.playerId === req.params.playerId && w.id === req.params.entryId
      );

      if (!entry) return null;

      if (tier) entry.tier = tier;
      if (typeof notes === 'string') entry.notes = notes;
      if (inquiryStatus) entry.inquiryStatus = inquiryStatus;
      entry.lastViewedAt = new Date().toISOString();

      return entry;
    });

    if (!updatedEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'watchlist_entry_updated',
        entry: updatedEntry,
      });
    }

    return res.json(updatedEntry);
  });

  // Submit formal scout inquiry
  router.post('/:playerId/inquiries', async (req, res) => {
    const { scoutName, club, type, message } = req.body;

    if (!scoutName || !club || !type) {
      return res.status(400).json({ error: 'scoutName, club, and type are required.' });
    }

    const newInquiry = await store.update((data) => {
      ensureWatchlistRecord(data, req.params.playerId);
      const inq = {
        id: `inq-${Date.now()}`,
        playerId: req.params.playerId,
        scoutName: String(scoutName).trim(),
        club: String(club).trim(),
        type,
        status: 'Pending Review',
        message: message || 'Scout submitted an official recruitment query.',
        date: new Date().toISOString().split('T')[0],
      };

      data.inquiries.unshift(inq);
      return inq;
    });

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'scout_inquiry_received',
        inquiry: newInquiry,
      });
    }

    return res.status(201).json(newInquiry);
  });

  return router;
}

module.exports = {
  createWatchlistRouter,
};
