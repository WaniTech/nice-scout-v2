const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createApp } = require('../app');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('../services/jsonStore');

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

async function withApi(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-api-'));
  const store = createJsonStore({
    filePath: path.join(tempDir, 'db.json'),
    seedData,
  });
  await store.reset();

  const server = createApp({ store }).listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    await run(baseUrl, store);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test('auth supports registering and logging in a player', async () => {
  await withApi(async (baseUrl) => {
    const register = await request(baseUrl, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jordan Pace',
        email: 'jordan@example.com',
        password: 'secret123',
        position: 'Striker',
        location: 'Aarhus, Denmark',
      }),
    });

    assert.equal(register.response.status, 201);
    assert.equal(register.body.user.email, 'jordan@example.com');
    assert.equal(register.body.user.role, 'player');

    const login = await request(baseUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'jordan@example.com',
        password: 'secret123',
      }),
    });

    assert.equal(login.response.status, 200);
    assert.equal(login.body.user.name, 'Jordan Pace');
  });
});

test('applications can be created, read, updated, and deleted', async () => {
  await withApi(async (baseUrl) => {
    const create = await request(baseUrl, '/player/demo-player/applications', {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: '4',
        stage: 'Saved',
        notes: 'Review Portugal role',
      }),
    });

    assert.equal(create.response.status, 201);
    assert.equal(create.body.stage, 'Saved');

    const read = await request(baseUrl, '/player/demo-player/applications');
    assert.equal(read.response.status, 200);
    assert.ok(read.body.some((application) => application.id === create.body.id));

    const update = await request(baseUrl, `/player/demo-player/applications/${create.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        stage: 'Applied',
      }),
    });

    assert.equal(update.response.status, 200);
    assert.equal(update.body.stage, 'Applied');

    const remove = await request(baseUrl, `/player/demo-player/applications/${create.body.id}`, {
      method: 'DELETE',
    });

    assert.equal(remove.response.status, 204);

    const afterDelete = await request(baseUrl, '/player/demo-player/applications');
    assert.ok(!afterDelete.body.some((application) => application.id === create.body.id));
  });
});

test('media clips can be created, read, updated, and deleted', async () => {
  await withApi(async (baseUrl) => {
    const create = await request(baseUrl, '/player/demo-player/clips', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Trial-ready finishing package',
        type: 'Highlight reel',
        focus: 'Runs across the near post and cutback finishes',
        opponent: 'Test United U21',
        date: '2026-06-13',
        duration: '01:24',
        status: 'Draft',
        visibility: 'Private link',
        tags: ['finishing', 'movement'],
        notes: 'Needs one intro slate before sending.',
      }),
    });

    assert.equal(create.response.status, 201);
    assert.equal(create.body.title, 'Trial-ready finishing package');
    assert.equal(create.body.views, 0);

    const read = await request(baseUrl, '/player/demo-player/clips');
    assert.equal(read.response.status, 200);
    assert.ok(read.body.some((clip) => clip.id === create.body.id));

    const update = await request(baseUrl, `/player/demo-player/clips/${create.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Scout-ready',
        notes: 'Intro slate added and ready for scouts.',
      }),
    });

    assert.equal(update.response.status, 200);
    assert.equal(update.body.status, 'Scout-ready');
    assert.equal(update.body.notes, 'Intro slate added and ready for scouts.');

    const remove = await request(baseUrl, `/player/demo-player/clips/${create.body.id}`, {
      method: 'DELETE',
    });

    assert.equal(remove.response.status, 204);

    const afterDelete = await request(baseUrl, '/player/demo-player/clips');
    assert.ok(!afterDelete.body.some((clip) => clip.id === create.body.id));
  });
});

test('profile, preferences, availability, and message replies are persisted', async () => {
  await withApi(async (baseUrl) => {
    const profile = await request(baseUrl, '/player/demo-player/profile', {
      method: 'PUT',
      body: JSON.stringify({
        position: 'Left winger',
        clubStatus: 'Trial ready',
      }),
    });

    assert.equal(profile.response.status, 200);
    assert.equal(profile.body.position, 'Left winger');
    assert.equal(profile.body.clubStatus, 'Trial ready');

    const preferences = await request(baseUrl, '/player/demo-player/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        markets: ['Germany', 'Portugal'],
        openToLoan: true,
      }),
    });

    assert.equal(preferences.response.status, 200);
    assert.deepEqual(preferences.body.markets, ['Germany', 'Portugal']);

    const availability = await request(baseUrl, '/player/demo-player/availability', {
      method: 'PATCH',
      body: JSON.stringify({
        ready: false,
        contactWindow: 'Weekends only',
      }),
    });

    assert.equal(availability.response.status, 200);
    assert.equal(availability.body.ready, false);
    assert.equal(availability.body.contactWindow, 'Weekends only');

    const reply = await request(baseUrl, '/player/demo-player/messages/1/replies', {
      method: 'POST',
      body: JSON.stringify({
        body: 'I can send clips today.',
        attachments: ['match-clips'],
      }),
    });

    assert.equal(reply.response.status, 201);
    assert.equal(reply.body.attachments[0], 'match-clips');

    const archive = await request(baseUrl, '/player/demo-player/messages/1/archive', {
      method: 'PATCH',
    });

    assert.equal(archive.response.status, 200);
    assert.equal(archive.body.archived, true);
    assert.equal(archive.body.unread, false);
  });
});

test('opportunities support admin-style CRUD operations', async () => {
  await withApi(async (baseUrl) => {
    const create = await request(baseUrl, '/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        club: 'Test FC',
        league: 'Testing League',
        city: 'Odense',
        country: 'Denmark',
        position: 'Striker',
        description: 'A test opportunity',
      }),
    });

    assert.equal(create.response.status, 201);
    assert.equal(create.body.club, 'Test FC');

    const update = await request(baseUrl, `/opportunities/${create.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fit: 81,
      }),
    });

    assert.equal(update.response.status, 200);
    assert.equal(update.body.fit, 81);

    const remove = await request(baseUrl, `/opportunities/${create.body.id}`, {
      method: 'DELETE',
    });

    assert.equal(remove.response.status, 204);

    const readDeleted = await request(baseUrl, `/opportunities/${create.body.id}`);
    assert.equal(readDeleted.response.status, 404);
  });
});
