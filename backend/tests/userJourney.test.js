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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scout-link-e2e-'));
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

test('Full User Journey: Verify all README "What You Can Do" features', async () => {
  await withApi(async (baseUrl) => {
    // -------------------------------------------------------------
    // Feature 1: Log in with the demo account shown on login page
    // -------------------------------------------------------------
    const demoLogin = await request(baseUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'player@scoutlink.com',
        password: 'player123',
      }),
    });
    assert.equal(demoLogin.response.status, 200, 'Demo account login should succeed');
    assert.equal(demoLogin.body.user.email, 'player@scoutlink.com');
    assert.equal(demoLogin.body.user.role, 'player');
    assert.ok(demoLogin.body.user.id, 'Demo user should have a valid user ID');

    // -------------------------------------------------------------
    // Feature 2: Create a player account
    // -------------------------------------------------------------
    const newPlayerEmail = 'marcus.rashford@scoutlink.com';
    const registerResponse = await request(baseUrl, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Marcus Rashford',
        email: newPlayerEmail,
        password: 'securePassword2026',
        position: 'Left winger',
        location: 'Manchester, UK',
      }),
    });
    assert.equal(registerResponse.response.status, 201, 'Account creation should succeed');
    assert.equal(registerResponse.body.user.name, 'Marcus Rashford');
    assert.equal(registerResponse.body.user.email, newPlayerEmail);
    const newPlayerId = registerResponse.body.user.id;
    assert.ok(newPlayerId, 'Created user should receive an ID');

    // Verify logging in with the newly created player account
    const newPlayerLogin = await request(baseUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: newPlayerEmail,
        password: 'securePassword2026',
      }),
    });
    assert.equal(newPlayerLogin.response.status, 200, 'Newly created user login should succeed');
    assert.equal(newPlayerLogin.body.user.id, newPlayerId);

    // -------------------------------------------------------------
    // Feature 3: See the dashboard (intelligence, radar, benchmarks, scout activity)
    // -------------------------------------------------------------
    const dashboardProfile = await request(baseUrl, `/player/${newPlayerId}/profile`);
    assert.equal(dashboardProfile.response.status, 200);

    const radar = await request(baseUrl, `/player/${newPlayerId}/analytics`);
    assert.equal(radar.response.status, 200, 'Dashboard radar analytics should be accessible');
    assert.ok(radar.body.pillars.physical > 0);
    assert.ok(radar.body.pillars.technical > 0);
    assert.ok(radar.body.pillars.tactical > 0);
    assert.ok(radar.body.pillars.mental > 0);

    const benchmarks = await request(baseUrl, `/player/${newPlayerId}/benchmarks?position=Left%20winger&baseline=Eredivisie%20U23`);
    assert.equal(benchmarks.response.status, 200, 'Dashboard benchmarks should load');
    assert.ok(benchmarks.body.metrics.length > 0);

    const scoutActivity = await request(baseUrl, `/player/${newPlayerId}/scout-activity`);
    assert.equal(scoutActivity.response.status, 200, 'Scout activity engagement should load');
    assert.ok(Array.isArray(scoutActivity.body.viewsByLeague));

    // -------------------------------------------------------------
    // Feature 4: View profile
    // -------------------------------------------------------------
    const viewProfile = await request(baseUrl, `/player/${newPlayerId}/profile`);
    assert.equal(viewProfile.response.status, 200, 'Profile viewing should succeed');
    assert.equal(viewProfile.body.name, 'Marcus Rashford');
    assert.equal(viewProfile.body.position, 'Left winger');

    const viewPrefs = await request(baseUrl, `/player/${newPlayerId}/preferences`);
    assert.equal(viewPrefs.response.status, 200, 'Preferences viewing should succeed');

    // -------------------------------------------------------------
    // Feature 5: Edit profile, CV, preferences, and availability
    // -------------------------------------------------------------
    const editProfile = await request(baseUrl, `/player/${newPlayerId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({
        headline: 'Dynamic wide forward with high pressing intensity and clinical finishing.',
        height: '185 cm',
        foot: 'Right',
        passport: 'UK passport',
        clubStatus: 'Free agent / Available for July trials',
        secondaryPositions: ['Striker', 'Right winger'],
        strengths: ['Acceleration', '1v1 dribbling', 'High pressing', 'Weak-side runs'],
      }),
    });
    assert.equal(editProfile.response.status, 200, 'Profile edit should succeed');
    assert.equal(editProfile.body.height, '185 cm');
    assert.deepEqual(editProfile.body.secondaryPositions, ['Striker', 'Right winger']);

    const editPrefs = await request(baseUrl, `/player/${newPlayerId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify({
        markets: ['Germany', 'Netherlands', 'Denmark'],
        contractType: 'First team / U23 bridge',
        travelWindow: 'Immediate',
        minimumPackage: 'Stipend + accommodation covered',
        openToLoan: true,
      }),
    });
    assert.equal(editPrefs.response.status, 200, 'Preferences edit should succeed');
    assert.deepEqual(editPrefs.body.markets, ['Germany', 'Netherlands', 'Denmark']);

    const editAvailability = await request(baseUrl, `/player/${newPlayerId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({
        ready: true,
        travelDate: '2026-07-01',
        trainingLoad: 'Full match fitness',
        contactWindow: 'Anytime via agent or direct chat',
      }),
    });
    assert.equal(editAvailability.response.status, 200, 'Availability edit should succeed');
    assert.equal(editAvailability.body.ready, true);
    assert.equal(editAvailability.body.travelDate, '2026-07-01');

    // -------------------------------------------------------------
    // Feature 6: Browse trials and jobs (opportunities + matching engine)
    // -------------------------------------------------------------
    const allOpportunities = await request(baseUrl, '/opportunities');
    assert.equal(allOpportunities.response.status, 200, 'Browsing opportunities should return 200');
    assert.ok(allOpportunities.body.length >= 4, 'Should contain pre-seeded opportunities');

    const specificOpp = await request(baseUrl, `/opportunities/${allOpportunities.body[0].id}`);
    assert.equal(specificOpp.response.status, 200, 'Viewing single opportunity detail should succeed');
    assert.ok(specificOpp.body.club);

    const matchFeed = await request(baseUrl, '/player-match/match', {
      method: 'POST',
      body: JSON.stringify({
        profile: {
          position: 'Left winger',
          secondaryPositions: ['Right winger'],
          strengths: ['Acceleration', '1v1 dribbling', 'High pressing'],
          location: 'Manchester, UK',
          preferences: {
            markets: ['Germany', 'Netherlands'],
          },
        },
      }),
    });
    assert.equal(matchFeed.response.status, 200, 'Matching feed evaluation should return 200');
    assert.ok(matchFeed.body.length > 0);
    assert.ok(matchFeed.body[0].compatibilityScore >= 10);

    // -------------------------------------------------------------
    // Feature 7: Save or update job applications (Full pipeline CRUD)
    // -------------------------------------------------------------
    const targetOppId = allOpportunities.body[0].id;

    // Save application
    const saveApp = await request(baseUrl, `/player/${newPlayerId}/applications`, {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: targetOppId,
        stage: 'Saved',
        notes: 'Reviewing trial dates with agent',
      }),
    });
    assert.equal(saveApp.response.status, 201, 'Saving application should return 201');
    assert.equal(saveApp.body.stage, 'Saved');
    const createdAppId = saveApp.body.id;

    // View applications
    const playerApps = await request(baseUrl, `/player/${newPlayerId}/applications`);
    assert.equal(playerApps.response.status, 200);
    assert.equal(playerApps.body.length, 1);
    assert.equal(playerApps.body[0].id, createdAppId);

    // Update application stage (Saved -> Applied -> Trial booked)
    const updateAppStage = await request(baseUrl, `/player/${newPlayerId}/applications/${createdAppId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        stage: 'Trial booked',
        notes: 'Flight booked for July 2',
      }),
    });
    assert.equal(updateAppStage.response.status, 200, 'Updating application stage should succeed');
    assert.equal(updateAppStage.body.stage, 'Trial booked');
    assert.equal(updateAppStage.body.notes, 'Flight booked for July 2');

    // -------------------------------------------------------------
    // Feature 8: Read messages, reply, and archive them
    // -------------------------------------------------------------
    const demoPlayerMessages = await request(baseUrl, '/player/demo-player/messages');
    assert.equal(demoPlayerMessages.response.status, 200, 'Reading inbox messages should succeed');
    assert.ok(demoPlayerMessages.body.length > 0, 'Inbox should contain pre-seeded messages');

    const firstMsg = demoPlayerMessages.body[0];
    const messageDetail = await request(baseUrl, `/player/demo-player/messages/${firstMsg.id}`);
    assert.equal(messageDetail.response.status, 200, 'Reading message detail should succeed');
    assert.equal(messageDetail.body.id, firstMsg.id);

    // Send a reply
    const replyResponse = await request(baseUrl, `/player/demo-player/messages/${firstMsg.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({
        body: 'Thank you for reaching out! I have uploaded my GPS report and full match footage.',
        attachments: ['gps-report-june.pdf', 'match-vs-copenhagen.mp4'],
      }),
    });
    assert.equal(replyResponse.response.status, 201, 'Sending message reply should return 201');
    assert.ok(replyResponse.body.id);
    assert.deepEqual(replyResponse.body.attachments, ['gps-report-june.pdf', 'match-vs-copenhagen.mp4']);

    // Archive the message
    const archiveResponse = await request(baseUrl, `/player/demo-player/messages/${firstMsg.id}/archive`, {
      method: 'PATCH',
    });
    assert.equal(archiveResponse.response.status, 200, 'Archiving message should succeed');
    assert.equal(archiveResponse.body.archived, true);
    assert.equal(archiveResponse.body.unread, false);

    // Verify inbox without archived messages
    const unarchivedMessages = await request(baseUrl, '/player/demo-player/messages?archived=false');
    assert.ok(!unarchivedMessages.body.some((m) => m.id === firstMsg.id), 'Archived message should not appear in active inbox');
  });
});
