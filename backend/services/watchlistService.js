/**
 * Scout Watchlist & Talent Shortlist Network Engine
 * Manages scout bookmarking, talent watchlist tiers (Priority, Monitored, Extended),
 * verified scout inquiries, notes, and activity feeds.
 */

const defaultWatchlistEntries = [
  {
    id: 'watch-1',
    scoutId: 'scout-101',
    scoutName: 'Mikkel Soren',
    club: 'FC Midtjylland',
    league: 'Danish Superliga Academy bridge',
    role: 'Head of Nordic Recruitment',
    tier: 'Priority Target',
    addedDate: '2026-08-15',
    lastViewedAt: '2026-08-31T18:20:00.000Z',
    notes: 'Primary target for wide attacking vacancy. Attending trial assessment.',
    tags: ['First Team Pathway', 'Trialist', 'Immediate Fit'],
    inquiryStatus: 'Active Conversation',
  },
  {
    id: 'watch-2',
    scoutId: 'scout-102',
    scoutName: 'Noah Janssen',
    club: 'AZ Alkmaar',
    league: 'Eredivisie U23 pathway',
    role: 'Lead Talent Scout',
    tier: 'Monitored',
    addedDate: '2026-08-20',
    lastViewedAt: '2026-08-30T14:10:00.000Z',
    notes: 'Tracking left-side adaptability and recovery run GPS outputs.',
    tags: ['U23 Review', 'GPS Monitored'],
    inquiryStatus: 'Clips Requested',
  },
  {
    id: 'watch-3',
    scoutId: 'scout-103',
    scoutName: 'Lena Weiss',
    club: 'SC Freiburg II',
    league: 'German development squad',
    role: 'DACH Scouting Director',
    tier: 'Priority Target',
    addedDate: '2026-08-24',
    lastViewedAt: '2026-08-31T09:45:00.000Z',
    notes: 'Shortlisted for development squad. Reviewing July pressing data.',
    tags: ['High Press', 'Shortlisted'],
    inquiryStatus: 'Data Review',
  },
  {
    id: 'watch-4',
    scoutId: 'scout-104',
    scoutName: 'Tiago Rocha',
    club: 'Vitoria SC',
    league: 'Liga Portugal recruitment group',
    role: 'Iberian Talent ID Desk',
    tier: 'Extended List',
    addedDate: '2026-08-28',
    lastViewedAt: '2026-08-29T16:00:00.000Z',
    notes: 'Direct transition winger profile flagged in Iberian talent query.',
    tags: ['Transition Threat', 'Portugal Trial'],
    inquiryStatus: 'Open Invitation',
  },
];

const defaultInquiries = [
  {
    id: 'inq-1',
    scoutName: 'Mikkel Soren',
    club: 'FC Midtjylland',
    type: 'Trial Availability Confirmation',
    status: 'Confirmed',
    message: 'Confirmed attendance for June 24 morning session. Medical team notified.',
    date: '2026-08-30',
  },
  {
    id: 'inq-2',
    scoutName: 'Noah Janssen',
    club: 'AZ Alkmaar',
    type: 'Match Footage Request',
    status: 'Pending Review',
    message: 'Reviewing full-match left-side footage vs Lyngby Reserve.',
    date: '2026-08-31',
  },
];

function ensureWatchlistRecord(data, playerId = 'demo-player') {
  if (!data.watchlists) {
    data.watchlists = defaultWatchlistEntries.map((w) => ({
      ...w,
      playerId,
    }));
  }
  if (!data.inquiries) {
    data.inquiries = defaultInquiries.map((i) => ({
      ...i,
      playerId,
    }));
  }
}

function calculateWatchlistMetrics(watchlist = []) {
  const totalScouts = watchlist.length;
  const priorityCount = watchlist.filter((w) => w.tier === 'Priority Target').length;
  const monitoredCount = watchlist.filter((w) => w.tier === 'Monitored').length;
  const extendedCount = watchlist.filter((w) => w.tier === 'Extended List').length;
  const activeLeagues = Array.from(new Set(watchlist.map((w) => w.league)));

  return {
    totalScouts,
    priorityCount,
    monitoredCount,
    extendedCount,
    activeLeaguesCount: activeLeagues.length,
    activeLeagues,
    interestIndex: Math.min(Math.round((priorityCount * 30) + (monitoredCount * 18) + (extendedCount * 10)), 99),
  };
}

module.exports = {
  defaultWatchlistEntries,
  defaultInquiries,
  ensureWatchlistRecord,
  calculateWatchlistMetrics,
};
