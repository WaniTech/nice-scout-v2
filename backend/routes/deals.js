const express = require('express');
const {
  ensureDealsRecord,
  calculateDealValue,
} = require('../services/dealService');

const allowedDealStatuses = new Set(['Offered', 'Countered', 'UnderReview', 'Agreed', 'Declined', 'Signed']);

function createDealsRouter(store, socketService) {
  const router = express.Router();

  // Get all active contract offers for a player
  router.get('/:playerId', async (req, res) => {
    const data = await store.read();
    ensureDealsRecord(data, req.params.playerId);

    const playerDeals = data.deals
      .filter((d) => d.playerId === req.params.playerId)
      .map((d) => ({
        ...d,
        financials: calculateDealValue(d),
      }));

    return res.json(playerDeals);
  });

  // Get specific deal details
  router.get('/:playerId/:dealId', async (req, res) => {
    const data = await store.read();
    ensureDealsRecord(data, req.params.playerId);

    const deal = data.deals.find(
      (d) => d.playerId === req.params.playerId && d.id === req.params.dealId
    );

    if (!deal) {
      return res.status(404).json({ error: 'Contract deal sheet not found.' });
    }

    return res.json({
      ...deal,
      financials: calculateDealValue(deal),
    });
  });

  // Player submits a counter-offer
  router.post('/:playerId/:dealId/counter', async (req, res) => {
    const {
      counterSalaryMonthly,
      counterSigningBonus,
      counterDurationYears,
      notes = '',
    } = req.body;

    if (!counterSalaryMonthly || counterSalaryMonthly < 1000) {
      return res.status(400).json({ error: 'Valid counter monthly salary is required.' });
    }

    const updatedDeal = await store.update((data) => {
      ensureDealsRecord(data, req.params.playerId);
      const deal = data.deals.find(
        (d) => d.playerId === req.params.playerId && d.id === req.params.dealId
      );

      if (!deal) return null;

      deal.baseSalaryMonthly = Number(counterSalaryMonthly);
      if (counterSigningBonus !== undefined) deal.signingBonus = Number(counterSigningBonus);
      if (counterDurationYears !== undefined) deal.durationYears = Number(counterDurationYears);

      deal.status = 'Countered';
      deal.updatedAt = new Date().toISOString();

      deal.negotiationHistory.unshift({
        id: `hist-${Date.now()}`,
        sender: 'player',
        author: 'Player / Agency',
        action: 'Counter-Offer Submitted',
        baseSalaryMonthly: deal.baseSalaryMonthly,
        notes: notes || 'Counter-proposal on salary and performance incentives.',
        timestamp: deal.updatedAt,
      });

      return deal;
    });

    if (!updatedDeal) {
      return res.status(404).json({ error: 'Contract deal not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'deal_counter_submitted',
        deal: { ...updatedDeal, financials: calculateDealValue(updatedDeal) },
      });
    }

    return res.json({
      ...updatedDeal,
      financials: calculateDealValue(updatedDeal),
    });
  });

  // Sign official contract deal
  router.patch('/:playerId/:dealId/sign', async (req, res) => {
    const { signature = '', confirmationNotes = '' } = req.body;

    const updatedDeal = await store.update((data) => {
      ensureDealsRecord(data, req.params.playerId);
      const deal = data.deals.find(
        (d) => d.playerId === req.params.playerId && d.id === req.params.dealId
      );

      if (!deal) return null;

      deal.status = 'Signed';
      deal.signature = signature || 'Alex Rivera (Verified Digital Signature)';
      deal.signedAt = new Date().toISOString();
      deal.updatedAt = deal.signedAt;

      deal.negotiationHistory.unshift({
        id: `hist-${Date.now()}`,
        sender: 'player',
        author: 'Player Signature Desk',
        action: 'Contract Formally Executed',
        baseSalaryMonthly: deal.baseSalaryMonthly,
        notes: confirmationNotes || 'Contract signed digitally and dispatched to club recruitment registry.',
        timestamp: deal.signedAt,
      });

      return deal;
    });

    if (!updatedDeal) {
      return res.status(404).json({ error: 'Contract deal not found.' });
    }

    if (socketService) {
      socketService.broadcastToRoom(`player:${req.params.playerId}`, {
        type: 'deal_signed',
        deal: { ...updatedDeal, financials: calculateDealValue(updatedDeal) },
      });
    }

    return res.json({
      ...updatedDeal,
      financials: calculateDealValue(updatedDeal),
    });
  });

  return router;
}

module.exports = {
  createDealsRouter,
};
