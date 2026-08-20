const express = require('express');

function createOpportunitiesRouter(store) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const data = await store.read();
    const query = String(req.query.q || '').trim().toLowerCase();
    const opportunities = query
      ? data.opportunities.filter((opportunity) =>
          [
            opportunity.club,
            opportunity.league,
            opportunity.city,
            opportunity.country,
            opportunity.position,
            opportunity.tags.join(' '),
          ]
            .join(' ')
            .toLowerCase()
            .includes(query),
        )
      : data.opportunities;

    return res.json(opportunities);
  });

  router.get('/:id', async (req, res) => {
    const data = await store.read();
    const opportunity = data.opportunities.find((entry) => entry.id === req.params.id);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    return res.json(opportunity);
  });

  router.post('/', async (req, res) => {
    const opportunity = await store.update((data) => {
      const nextOpportunity = {
        id: `opp-${Date.now()}`,
        club: '',
        league: '',
        city: '',
        country: '',
        position: '',
        fit: 75,
        ageBand: '',
        contract: '',
        compensation: '',
        trialDate: '',
        deadline: '',
        scout: '',
        stage: 'New',
        description: '',
        requirements: [],
        perks: [],
        tags: [],
        ...req.body,
      };

      data.opportunities.push(nextOpportunity);
      return nextOpportunity;
    });

    return res.status(201).json(opportunity);
  });

  router.patch('/:id', async (req, res) => {
    const opportunity = await store.update((data) => {
      const index = data.opportunities.findIndex((entry) => entry.id === req.params.id);

      if (index === -1) {
        return null;
      }

      data.opportunities[index] = {
        ...data.opportunities[index],
        ...req.body,
        id: data.opportunities[index].id,
      };

      return data.opportunities[index];
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    return res.json(opportunity);
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await store.update((data) => {
      const beforeCount = data.opportunities.length;
      data.opportunities = data.opportunities.filter((entry) => entry.id !== req.params.id);
      data.applications = data.applications.filter((entry) => entry.opportunityId !== req.params.id);
      return data.opportunities.length !== beforeCount;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    return res.status(204).send();
  });

  return router;
}

module.exports = {
  createOpportunitiesRouter,
};
