const express = require('express');
const {
  calculatePillarScores,
  calculateBenchmarks,
  getScoutActivityFeed,
} = require('../services/analyticsEngine');

const allowedStages = new Set(['New', 'Saved', 'Applied', 'Trial booked', 'Offer talks']);
const allowedClipStatuses = new Set(['Draft', 'Scout-ready', 'Sent']);

function ensurePlayerRecords(data, playerId) {
  data.clips = data.clips || [];

  if (!data.profiles.some((profile) => profile.playerId === playerId)) {
    data.profiles.push({
      playerId,
      name: 'Player',
      email: '',
      position: '',
      secondaryPositions: [],
      location: '',
      clubStatus: 'Building profile',
      age: '',
      height: '',
      foot: '',
      passport: '',
      availability: 'Building profile',
      headline: '',
      strengths: [],
    });
  }

  if (!data.preferences.some((preference) => preference.playerId === playerId)) {
    data.preferences.push({
      playerId,
      markets: [],
      contractType: '',
      travelWindow: '',
      minimumPackage: '',
      openToLoan: false,
      hiddenRules: {
        locations: '',
        formats: '',
        clubs: '',
      },
      availability: {
        ready: false,
        travelDate: '',
        trainingLoad: '',
        contactWindow: '',
      },
    });
  }
}

function createPlayerRouter(store) {
  const router = express.Router();

  router.get('/:playerId/profile', async (req, res) => {
    const data = await store.read();
    const profile = data.profiles.find((entry) => entry.playerId === req.params.playerId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    return res.json(profile);
  });

  router.put('/:playerId/profile', async (req, res) => {
    const profile = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const index = data.profiles.findIndex((entry) => entry.playerId === req.params.playerId);
      data.profiles[index] = {
        ...data.profiles[index],
        ...req.body,
        playerId: req.params.playerId,
      };
      return data.profiles[index];
    });

    return res.json(profile);
  });

  router.get('/:playerId/preferences', async (req, res) => {
    const data = await store.read();
    const preferences = data.preferences.find((entry) => entry.playerId === req.params.playerId);

    if (!preferences) {
      return res.status(404).json({ error: 'Preferences not found.' });
    }

    return res.json(preferences);
  });

  router.put('/:playerId/preferences', async (req, res) => {
    const preferences = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const index = data.preferences.findIndex((entry) => entry.playerId === req.params.playerId);
      data.preferences[index] = {
        ...data.preferences[index],
        ...req.body,
        playerId: req.params.playerId,
      };
      return data.preferences[index];
    });

    return res.json(preferences);
  });

  router.patch('/:playerId/availability', async (req, res) => {
    const availability = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const index = data.preferences.findIndex((entry) => entry.playerId === req.params.playerId);
      data.preferences[index].availability = {
        ...data.preferences[index].availability,
        ...req.body,
      };
      return data.preferences[index].availability;
    });

    return res.json(availability);
  });

  router.get('/:playerId/applications', async (req, res) => {
    const data = await store.read();
    const applications = data.applications
      .filter((entry) => entry.playerId === req.params.playerId)
      .map((application) => ({
        ...application,
        opportunity: data.opportunities.find((opportunity) => opportunity.id === application.opportunityId) || null,
      }));

    return res.json(applications);
  });

  router.post('/:playerId/applications', async (req, res) => {
    const { opportunityId, stage = 'Saved', notes = '' } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ error: 'opportunityId is required.' });
    }

    if (!allowedStages.has(stage)) {
      return res.status(400).json({ error: 'Invalid application stage.' });
    }

    const application = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);

      if (!data.opportunities.some((opportunity) => opportunity.id === opportunityId)) {
        return { missingOpportunity: true };
      }

      const existing = data.applications.find(
        (entry) => entry.playerId === req.params.playerId && entry.opportunityId === opportunityId,
      );
      const now = new Date().toISOString();

      if (existing) {
        existing.stage = stage;
        existing.notes = notes || existing.notes;
        existing.updatedAt = now;
        return existing;
      }

      const nextApplication = {
        id: `app-${Date.now()}`,
        playerId: req.params.playerId,
        opportunityId,
        stage,
        notes,
        createdAt: now,
        updatedAt: now,
      };

      data.applications.push(nextApplication);
      return nextApplication;
    });

    if (application.missingOpportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    return res.status(201).json(application);
  });

  router.patch('/:playerId/applications/:applicationId', async (req, res) => {
    const { stage, notes } = req.body;

    if (stage && !allowedStages.has(stage)) {
      return res.status(400).json({ error: 'Invalid application stage.' });
    }

    const application = await store.update((data) => {
      const applicationToUpdate = data.applications.find(
        (entry) => entry.playerId === req.params.playerId && entry.id === req.params.applicationId,
      );

      if (!applicationToUpdate) {
        return null;
      }

      if (stage) {
        applicationToUpdate.stage = stage;
      }

      if (typeof notes === 'string') {
        applicationToUpdate.notes = notes;
      }

      applicationToUpdate.updatedAt = new Date().toISOString();
      return applicationToUpdate;
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json(application);
  });

  router.delete('/:playerId/applications/:applicationId', async (req, res) => {
    const deleted = await store.update((data) => {
      const beforeCount = data.applications.length;
      data.applications = data.applications.filter(
        (entry) => !(entry.playerId === req.params.playerId && entry.id === req.params.applicationId),
      );
      return data.applications.length !== beforeCount;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.status(204).send();
  });

  router.get('/:playerId/messages', async (req, res) => {
    const data = await store.read();
    const includeArchived = req.query.archived === 'true';
    const playerMessages = data.messages.filter(
      (message) => message.playerId === req.params.playerId && (includeArchived || !message.archived),
    );

    return res.json(playerMessages);
  });

  router.get('/:playerId/messages/:messageId', async (req, res) => {
    const data = await store.read();
    const message = data.messages.find(
      (entry) => entry.playerId === req.params.playerId && entry.id === req.params.messageId,
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    return res.json(message);
  });

  router.patch('/:playerId/messages/:messageId', async (req, res) => {
    const message = await store.update((data) => {
      const messageToUpdate = data.messages.find(
        (entry) => entry.playerId === req.params.playerId && entry.id === req.params.messageId,
      );

      if (!messageToUpdate) {
        return null;
      }

      Object.assign(messageToUpdate, req.body, {
        id: messageToUpdate.id,
        playerId: messageToUpdate.playerId,
      });

      return messageToUpdate;
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    return res.json(message);
  });

  router.post('/:playerId/messages/:messageId/replies', async (req, res) => {
    const reply = await store.update((data) => {
      const message = data.messages.find(
        (entry) => entry.playerId === req.params.playerId && entry.id === req.params.messageId,
      );

      if (!message) {
        return null;
      }

      const nextReply = {
        id: `reply-${Date.now()}`,
        body: req.body.body || 'Thanks, I will send the requested details.',
        attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
        createdAt: new Date().toISOString(),
      };

      message.replies.push(nextReply);
      message.unread = false;
      return nextReply;
    });

    if (!reply) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    return res.status(201).json(reply);
  });

  router.patch('/:playerId/messages/:messageId/archive', async (req, res) => {
    const message = await store.update((data) => {
      const messageToArchive = data.messages.find(
        (entry) => entry.playerId === req.params.playerId && entry.id === req.params.messageId,
      );

      if (!messageToArchive) {
        return null;
      }

      messageToArchive.archived = true;
      messageToArchive.unread = false;
      return messageToArchive;
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    return res.json(message);
  });

  router.get('/:playerId/clips', async (req, res) => {
    const data = await store.read();
    const clips = (data.clips || []).filter((clip) => clip.playerId === req.params.playerId);

    return res.json(clips);
  });

  router.post('/:playerId/clips', async (req, res) => {
    const {
      title,
      type = 'Highlight reel',
      focus = '',
      opponent = '',
      date = '',
      duration = '00:30',
      status = 'Draft',
      visibility = 'Private link',
      tags = [],
      notes = '',
      attachedToOpportunityId,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Clip title is required.' });
    }

    if (!allowedClipStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid clip status.' });
    }

    const clip = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const now = new Date().toISOString();
      const nextClip = {
        id: `clip-${Date.now()}`,
        playerId: req.params.playerId,
        title: String(title).trim(),
        type,
        focus,
        opponent,
        date,
        duration,
        status,
        visibility,
        tags: Array.isArray(tags) ? tags : [],
        notes,
        views: 0,
        attachedToOpportunityId,
        createdAt: now,
        updatedAt: now,
      };

      data.clips.push(nextClip);
      return nextClip;
    });

    return res.status(201).json(clip);
  });

  router.patch('/:playerId/clips/:clipId', async (req, res) => {
    if (req.body.status && !allowedClipStatuses.has(req.body.status)) {
      return res.status(400).json({ error: 'Invalid clip status.' });
    }

    const clip = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const clipToUpdate = data.clips.find(
        (entry) => entry.playerId === req.params.playerId && entry.id === req.params.clipId,
      );

      if (!clipToUpdate) {
        return null;
      }

      Object.assign(clipToUpdate, req.body, {
        id: clipToUpdate.id,
        playerId: clipToUpdate.playerId,
        updatedAt: new Date().toISOString(),
      });

      return clipToUpdate;
    });

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    return res.json(clip);
  });

  router.delete('/:playerId/clips/:clipId', async (req, res) => {
    const deleted = await store.update((data) => {
      ensurePlayerRecords(data, req.params.playerId);
      const beforeCount = data.clips.length;
      data.clips = data.clips.filter(
        (entry) => !(entry.playerId === req.params.playerId && entry.id === req.params.clipId),
      );
      return data.clips.length !== beforeCount;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    return res.status(204).send();
  });

  router.get('/:playerId/analytics', async (req, res) => {
    const data = await store.read();
    const profile = data.profiles.find((entry) => entry.playerId === req.params.playerId) || {};
    const pillars = calculatePillarScores(profile);

    return res.json({
      playerId: req.params.playerId,
      pillars,
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/:playerId/benchmarks', async (req, res) => {
    const data = await store.read();
    const profile = data.profiles.find((entry) => entry.playerId === req.params.playerId) || {};
    const position = req.query.position || profile.position || 'Right winger';
    const baseline = req.query.baseline || 'Danish Superliga Academy';

    const benchmarks = calculateBenchmarks(position, baseline);
    return res.json(benchmarks);
  });

  router.get('/:playerId/scout-activity', async (req, res) => {
    const activity = getScoutActivityFeed(req.params.playerId);
    return res.json(activity);
  });

  return router;
}

module.exports = {
  createPlayerRouter,
};
