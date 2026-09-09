const defaultShowcases = [
  {
    id: 'showcase-1',
    playerId: 'demo-player',
    title: 'Nordic Elite U23 Combine 2026',
    organizer: 'Scandinavian Scout Union & Superliga Bridge',
    location: 'Right to Dream Park, Farum',
    city: 'Farum',
    country: 'Denmark',
    startDate: '2026-09-18',
    endDate: '2026-09-20',
    format: '3x 45min 11v11 Matches + Catapult GPS Testing',
    ageCategory: 'U19 - U23',
    confirmedScoutsCount: 18,
    confirmedClubs: [
      'FC Midtjylland',
      'AZ Alkmaar',
      'Brondby IF',
      'SC Freiburg',
      'Vitoria SC',
      'Malmo FF',
    ],
    pitchType: 'Natural Grass Stadium',
    registrationDeadline: '2026-09-12',
    rsvpStatus: 'Attending',
    assignedSquad: 'Team Green • Right Wing (#7)',
    matchSchedule: [
      {
        matchId: 'm1',
        time: 'Sept 18, 14:00',
        opponent: 'Team White (Danish Academy Selection)',
        pitch: 'Pitch 1 (Main)',
      },
      {
        matchId: 'm2',
        time: 'Sept 19, 11:30',
        opponent: 'Team Blue (Swedish Allsvenskan Prospects)',
        pitch: 'Pitch 2',
      },
      {
        matchId: 'm3',
        time: 'Sept 20, 15:00',
        opponent: 'Showcase All-Star XI',
        pitch: 'Main Stadium',
      },
    ],
    notes: 'GPS sensors provided at 09:00 briefing. Scouts will have full live tactical video feeds.',
    createdAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'showcase-2',
    playerId: 'demo-player',
    title: 'Iberian Pro Trial Combine',
    organizer: 'Liga Portugal Talent ID Desk',
    location: 'Complexo Desportivo de Guimaraes',
    city: 'Guimaraes',
    country: 'Portugal',
    startDate: '2026-10-04',
    endDate: '2026-10-06',
    format: '11v11 Tournament Showcase + Speed Traps',
    ageCategory: '18 - 24',
    confirmedScoutsCount: 14,
    confirmedClubs: [
      'Vitoria SC',
      'SC Braga',
      'FC Famalicao',
      'Boavista FC',
      'Rio Ave',
    ],
    pitchType: 'Hybrid Grass',
    registrationDeadline: '2026-09-28',
    rsvpStatus: 'Invited',
    assignedSquad: 'Pending Confirmation',
    matchSchedule: [
      {
        matchId: 'm10',
        time: 'Oct 4, 15:30',
        opponent: 'Portugal North Talent XI',
        pitch: 'Field A',
      },
      {
        matchId: 'm11',
        time: 'Oct 5, 11:00',
        opponent: 'Iberian Invitational Selection',
        pitch: 'Field B',
      },
    ],
    notes: 'Direct bridge to B-team trial agreements for top 3 match ratings.',
    createdAt: '2026-08-28T12:00:00.000Z',
  },
  {
    id: 'showcase-3',
    playerId: 'demo-player',
    title: 'Benelux International Scouting Invitational',
    organizer: 'Eredivisie & Belgian Pro League Scout Consortium',
    location: 'AFAS Trainingscomplex',
    city: 'Alkmaar',
    country: 'Netherlands',
    startDate: '2026-10-22',
    endDate: '2026-10-24',
    format: 'Positional Masterclass + 11v11 Matches',
    ageCategory: 'U21 - First Team Gateway',
    confirmedScoutsCount: 22,
    confirmedClubs: [
      'AZ Alkmaar',
      'FC Utrecht',
      'KRC Genk',
      'Club Brugge',
      'SC Heerenveen',
    ],
    pitchType: 'Natural Grass',
    registrationDeadline: '2026-10-15',
    rsvpStatus: 'Invited',
    assignedSquad: 'Pending Confirmation',
    matchSchedule: [
      {
        matchId: 'm20',
        time: 'Oct 22, 13:00',
        opponent: 'Dutch U21 Regional XI',
        pitch: 'Pitch 1',
      },
    ],
    notes: 'Focus on tactical flexibility against deep defensive blocks.',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

function calculateShowcaseMetrics(showcases = []) {
  const totalShowcases = showcases.length;
  const attendingCount = showcases.filter((s) => s.rsvpStatus === 'Attending').length;
  const invitedCount = showcases.filter((s) => s.rsvpStatus === 'Invited').length;
  const totalScoutsAttending = showcases.reduce((sum, s) => sum + (s.confirmedScoutsCount || 0), 0);

  const clubSet = new Set();
  showcases.forEach((s) => {
    (s.confirmedClubs || []).forEach((c) => clubSet.add(c));
  });

  return {
    totalShowcases,
    attendingCount,
    invitedCount,
    totalScoutsAttending,
    uniqueClubsRepresented: clubSet.size,
    showcaseIndex: totalShowcases > 0 ? Math.min(100, 70 + attendingCount * 15) : 0,
  };
}

function ensureShowcaseRecord(data, playerId) {
  if (!data.showcases) {
    data.showcases = [];
  }

  const playerEvents = data.showcases.filter((s) => s.playerId === playerId);
  if (playerEvents.length === 0 && playerId === 'demo-player') {
    data.showcases.push(...JSON.parse(JSON.stringify(defaultShowcases)));
  }
}

module.exports = {
  defaultShowcases,
  calculateShowcaseMetrics,
  ensureShowcaseRecord,
};
