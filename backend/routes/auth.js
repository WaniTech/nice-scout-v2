const express = require('express');
const { publicUser } = require('../utils/publicUser');

function createAuthRouter(store) {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const data = await store.read();
    const user = data.users.find(
      (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password,
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid player credentials.' });
    }

    return res.json({ user: publicUser(user) });
  });

  router.post('/register', async (req, res) => {
    const { name, email, password, position, location } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const createdUser = await store.update((data) => {
      if (data.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        return null;
      }

      const user = {
        id: `player-${Date.now()}`,
        name: String(name).trim(),
        email: normalizedEmail,
        password,
        position: position || 'Right winger',
        location: location || 'Copenhagen, Denmark',
        clubStatus: 'Building profile',
        role: 'player',
      };

      data.users.push(user);
      data.profiles.push({
        playerId: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        secondaryPositions: [],
        location: user.location,
        clubStatus: user.clubStatus,
        age: '',
        height: '',
        foot: '',
        passport: '',
        availability: 'Building profile',
        headline: '',
        strengths: [],
      });
      data.preferences.push({
        playerId: user.id,
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

      return user;
    });

    if (!createdUser) {
      return res.status(409).json({ error: 'That email already exists.' });
    }

    return res.status(201).json({ user: publicUser(createdUser) });
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
