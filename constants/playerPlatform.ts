export type OpportunityStage = 'New' | 'Saved' | 'Applied' | 'Trial booked' | 'Offer talks';

export type Opportunity = {
  id: string;
  club: string;
  league: string;
  city: string;
  country: string;
  position: string;
  fit: number;
  ageBand: string;
  contract: string;
  compensation: string;
  trialDate: string;
  deadline: string;
  scout: string;
  stage: OpportunityStage;
  description: string;
  requirements: string[];
  perks: string[];
  tags: string[];
};

export type PlayerMessage = {
  id: string;
  club: string;
  sender: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  opportunityId: string;
  icon: 'football-outline' | 'shield-checkmark-outline' | 'trophy-outline' | 'pulse-outline';
};

export type PlayerClipStatus = 'Draft' | 'Scout-ready' | 'Sent';

export type PlayerClip = {
  id: string;
  playerId: string;
  title: string;
  type: string;
  focus: string;
  opponent: string;
  date: string;
  duration: string;
  status: PlayerClipStatus;
  visibility: string;
  tags: string[];
  notes: string;
  views: number;
  attachedToOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
};

export const colors = {
  background: '#F8FAFC',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  primary: '#0D5C3A',
  primaryDark: '#08281D',
  accent: '#D97706',
  blue: '#2563EB',
  red: '#DC2626',
  tab: '#0A1E17',
};

export const demoCredentials = {
  email: 'player@scoutlink.com',
  password: 'player123',
};

export const defaultPlayerProfile = {
  name: 'Alex Rivera',
  email: demoCredentials.email,
  position: 'Right winger',
  secondaryPositions: ['Left winger', 'Attacking midfielder'],
  location: 'Copenhagen, Denmark',
  clubStatus: 'Free agent',
  age: '20',
  height: '178 cm',
  foot: 'Right',
  passport: 'EU passport',
  availability: 'Ready for trials now',
  headline: 'Explosive wide player with direct 1v1 threat, repeat sprints, and final-third production.',
  completion: 88,
  matchFit: 94,
  responseRate: 97,
  scoutViews: 46,
  videoMinutes: 18,
  verifiedClips: 12,
  strengths: ['Acceleration', '1v1 dribbling', 'High pressing', 'Cutbacks', 'Weak-side runs'],
};

export const performanceStats = [
  { label: 'Sprint peak', value: '34.6 km/h', trend: '+1.8' },
  { label: 'Assists / 90', value: '0.42', trend: '+12%' },
  { label: 'Press wins', value: '7.1', trend: '+9%' },
  { label: 'xG chain', value: '0.71', trend: '+0.08' },
];

export const opportunities: Opportunity[] = [
  {
    id: '1',
    club: 'FC Midtjylland',
    league: 'Danish Superliga academy bridge',
    city: 'Herning',
    country: 'Denmark',
    position: 'Right winger',
    fit: 96,
    ageBand: '18-22',
    contract: 'Trial to first-team pathway',
    compensation: 'Travel covered, stipend available',
    trialDate: 'June 24, 2026',
    deadline: 'June 18',
    scout: 'Mikkel Soren, Nordic Recruitment',
    stage: 'Trial booked',
    description:
      'High-tempo side looking for a direct winger who can attack space, press fullbacks, and create chances from wide isolation.',
    requirements: ['Recent match video', 'GPS sprint report', 'EU work eligibility', 'Available within 14 days'],
    perks: ['First-team training exposure', 'Performance testing', 'Housing support', 'Video analyst feedback'],
    tags: ['Top fit', 'Verified scout', 'Fast decision'],
  },
  {
    id: '2',
    club: 'AZ Alkmaar',
    league: 'Eredivisie U23 pathway',
    city: 'Alkmaar',
    country: 'Netherlands',
    position: 'Left winger',
    fit: 92,
    ageBand: '19-23',
    contract: 'U23 contract review',
    compensation: 'Club accommodation',
    trialDate: 'July 2, 2026',
    deadline: 'June 21',
    scout: 'Noah Janssen, Talent ID',
    stage: 'Applied',
    description:
      'Technical academy environment seeking a winger who can play both touchline and inside-forward roles against compact blocks.',
    requirements: ['Two full-match links', 'Medical summary', 'Passport copy', 'Reference from current staff'],
    perks: ['Technical staff review', 'Strength plan', 'Dutch league exposure', 'Agent-friendly process'],
    tags: ['Technical fit', 'Academy bridge', 'Video review'],
  },
  {
    id: '3',
    club: 'SC Freiburg II',
    league: 'German development squad',
    city: 'Freiburg',
    country: 'Germany',
    position: 'Attacking midfielder',
    fit: 89,
    ageBand: '18-21',
    contract: 'Development contract',
    compensation: 'Salary band disclosed after shortlist',
    trialDate: 'July 9, 2026',
    deadline: 'June 28',
    scout: 'Lena Weiss, DACH Scouting',
    stage: 'Saved',
    description:
      'Recruiting an intense, positionally flexible attacker for a development squad that values pressing intelligence and quick combination play.',
    requirements: ['Pressing clips', 'Fitness data', 'German or English interview', 'Availability calendar'],
    perks: ['Bundesliga methodology', 'Language support', 'Clear progression plan', 'Sports science report'],
    tags: ['Pressing role', 'Strong pathway', 'Shortlist open'],
  },
  {
    id: '4',
    club: 'Vitoria SC',
    league: 'Liga Portugal recruitment group',
    city: 'Guimaraes',
    country: 'Portugal',
    position: 'Right winger',
    fit: 86,
    ageBand: '20-24',
    contract: 'B-team plus senior cup exposure',
    compensation: 'Monthly salary plus bonuses',
    trialDate: 'July 15, 2026',
    deadline: 'July 1',
    scout: 'Tiago Rocha, Iberian Scout Desk',
    stage: 'New',
    description:
      'Portugal-based opportunity for a wide forward with strong transition threat and the confidence to receive under pressure.',
    requirements: ['Highlight reel', 'Full-match sample', 'Injury history', 'Agent contact optional'],
    perks: ['Senior staff visibility', 'Warm-weather camp', 'Performance bonus path', 'Portuguese market exposure'],
    tags: ['Open trial', 'Attack role', 'Contract path'],
  },
  {
    id: '5',
    club: 'New York Red Bulls II',
    league: 'MLS Next Pro',
    city: 'New Jersey',
    country: 'United States',
    position: 'Wide forward',
    fit: 84,
    ageBand: '18-24',
    contract: 'Roster trial',
    compensation: 'Travel review after shortlist',
    trialDate: 'August 4, 2026',
    deadline: 'July 16',
    scout: 'Marcus Lee, North America Desk',
    stage: 'New',
    description:
      'Pressing-heavy environment looking for a winger with vertical running, repeat sprint capacity, and quick defensive reactions.',
    requirements: ['Work permit pathway', 'GPS output', 'Pressing actions video', 'Staff reference'],
    perks: ['MLS pipeline', 'Athletic testing', 'Clear role brief', 'Data-backed evaluation'],
    tags: ['High press', 'International route', 'Data match'],
  },
];

export const messages: PlayerMessage[] = [
  {
    id: '1',
    club: 'FC Midtjylland',
    sender: 'Mikkel Soren',
    subject: 'Trial slot confirmed',
    preview: 'We reviewed your wide-player clips and want to hold the June 24 trial slot.',
    body:
      'Hi Alex, your pace profile and 1v1 clips fit what our recruitment group is looking for. Please confirm that June 24 works and upload your latest GPS export before the weekend.',
    time: '09:45',
    unread: true,
    opportunityId: '1',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '2',
    club: 'AZ Alkmaar',
    sender: 'Noah Janssen',
    subject: 'Video review next step',
    preview: 'The staff liked your clips. Can you send one full match from the right side?',
    body:
      'Hello Alex, the first review was positive. The head of recruitment asked for a full match where you start on the right wing, plus any clips showing defensive work after turnovers.',
    time: 'Yesterday',
    unread: true,
    opportunityId: '2',
    icon: 'football-outline',
  },
  {
    id: '3',
    club: 'SC Freiburg II',
    sender: 'Lena Weiss',
    subject: 'Pressing data request',
    preview: 'Your profile is on our shortlist. We need pressing and sprint context.',
    body:
      'Alex, we are comparing three attacking midfield profiles this week. Your ball-carrying data is strong; please add pressing actions, repeat sprint data, and your July availability.',
    time: 'Mon',
    unread: false,
    opportunityId: '3',
    icon: 'pulse-outline',
  },
  {
    id: '4',
    club: 'Vitoria SC',
    sender: 'Tiago Rocha',
    subject: 'Portugal trial interest',
    preview: 'We are opening July trials and your profile has been tagged as a fit.',
    body:
      'Hi Alex, our staff wants direct wide forwards for July. If Portugal is interesting, save the role and send two recent clips against senior opposition.',
    time: 'Fri',
    unread: false,
    opportunityId: '4',
    icon: 'trophy-outline',
  },
];

export const mediaClips: PlayerClip[] = [
  {
    id: 'clip-1',
    playerId: 'demo-player',
    title: 'Right wing 1v1 isolations',
    type: 'Highlight reel',
    focus: 'Acceleration and cutbacks',
    opponent: 'HB Koge U21',
    date: '2026-06-08',
    duration: '02:14',
    status: 'Scout-ready',
    visibility: 'Public link',
    tags: ['1v1', 'cutbacks', 'right wing'],
    notes: 'Best clip for Danish and Dutch wide-player roles.',
    views: 28,
    attachedToOpportunityId: '1',
    createdAt: '2026-06-08T18:00:00.000Z',
    updatedAt: '2026-06-12T08:00:00.000Z',
  },
  {
    id: 'clip-2',
    playerId: 'demo-player',
    title: 'Full match: left side role',
    type: 'Full match',
    focus: 'Defensive reactions after turnovers',
    opponent: 'Lyngby Reserve',
    date: '2026-06-02',
    duration: '88:00',
    status: 'Sent',
    visibility: 'Private link',
    tags: ['full match', 'pressing', 'left wing'],
    notes: 'Sent to AZ Alkmaar after scout request.',
    views: 11,
    attachedToOpportunityId: '2',
    createdAt: '2026-06-02T19:30:00.000Z',
    updatedAt: '2026-06-11T10:00:00.000Z',
  },
  {
    id: 'clip-3',
    playerId: 'demo-player',
    title: 'Pressing and repeat sprint package',
    type: 'Data clip',
    focus: 'Press wins and recovery runs',
    opponent: 'Training block',
    date: '2026-06-11',
    duration: '01:36',
    status: 'Draft',
    visibility: 'Hidden',
    tags: ['pressing', 'sprints', 'GPS'],
    notes: 'Needs GPS overlay before sending to Freiburg.',
    views: 4,
    attachedToOpportunityId: '3',
    createdAt: '2026-06-11T13:00:00.000Z',
    updatedAt: '2026-06-11T13:00:00.000Z',
  },
];

export const applicationSteps = [
  { label: 'Profile verified', done: true },
  { label: 'Video reviewed', done: true },
  { label: 'Scout call', done: true },
  { label: 'Trial day', done: false },
  { label: 'Contract decision', done: false },
];

export const profileTasks = [
  'Upload a recent full match',
  'Add sprint data from the last 30 days',
  'Confirm July travel availability',
];

export type PillarScores = {
  physical: number;
  technical: number;
  tactical: number;
  mental: number;
  overallRadarScore: number;
};

export type BenchmarkMetric = {
  metric: string;
  label: string;
  playerValue: number;
  benchmarkValue: number;
  unit: string;
  percentile: number;
  diff: number;
  status: 'Above Benchmark' | 'Developing';
};

export type BenchmarkReport = {
  position: string;
  baseline: string;
  tier: string;
  readinessIndex: number;
  metrics: BenchmarkMetric[];
};

export type ScoutActivityLeague = {
  league: string;
  views: number;
  trend: string;
};

export type ScoutActivityItem = {
  club: string;
  scout: string;
  action: string;
  time: string;
};

export type ScoutActivityReport = {
  playerId: string;
  totalViews: number;
  activeWatchlists: number;
  videoReplays: number;
  viewsByLeague: ScoutActivityLeague[];
  recentScouts: ScoutActivityItem[];
};

export const defaultPillars: PillarScores = {
  physical: 92,
  technical: 91,
  tactical: 88,
  mental: 90,
  overallRadarScore: 90,
};

export const defaultBenchmarkReport: BenchmarkReport = {
  position: 'Right winger',
  baseline: 'Danish Superliga Academy',
  tier: 'Tier 1 Academy',
  readinessIndex: 91,
  metrics: [
    { metric: 'sprintPeak', label: 'Top Sprint Speed', playerValue: 34.6, benchmarkValue: 34.0, unit: 'km/h', percentile: 94, diff: 0.6, status: 'Above Benchmark' },
    { metric: 'xGChain', label: 'Expected Goal Chain', playerValue: 0.71, benchmarkValue: 0.65, unit: '/90', percentile: 93, diff: 0.06, status: 'Above Benchmark' },
    { metric: 'pressWins', label: 'High Press Regains', playerValue: 7.1, benchmarkValue: 6.5, unit: '/90', percentile: 93, diff: 0.6, status: 'Above Benchmark' },
    { metric: 'dribbleSuccess', label: '1v1 Dribble Success', playerValue: 68.0, benchmarkValue: 62.0, unit: '%', percentile: 93, diff: 6.0, status: 'Above Benchmark' },
    { metric: 'crossAccuracy', label: 'Open-Play Cross Accuracy', playerValue: 35.5, benchmarkValue: 32.0, unit: '%', percentile: 94, diff: 3.5, status: 'Above Benchmark' },
    { metric: 'defensiveWorkrate', label: 'Defensive Recovery Rate', playerValue: 74.0, benchmarkValue: 70.0, unit: '%', percentile: 90, diff: 4.0, status: 'Above Benchmark' },
  ],
};

export const defaultScoutActivityReport: ScoutActivityReport = {
  playerId: 'demo-player',
  totalViews: 68,
  activeWatchlists: 7,
  videoReplays: 34,
  viewsByLeague: [
    { league: 'Danish Superliga Academy', views: 28, trend: '+14%' },
    { league: 'Eredivisie U23', views: 22, trend: '+8%' },
    { league: 'German 3. Liga / Development', views: 12, trend: '+20%' },
    { league: 'Liga Portugal B', views: 6, trend: '+5%' },
  ],
  recentScouts: [
    { club: 'FC Midtjylland', scout: 'Mikkel Soren', action: 'Video replayed (3x)', time: '2 hours ago' },
    { club: 'AZ Alkmaar', scout: 'Noah Janssen', action: 'Added to Watchlist', time: 'Yesterday' },
    { club: 'SC Freiburg II', scout: 'Lena Weiss', action: 'Downloaded GPS Profile', time: '2 days ago' },
  ],
};

export type TrialStatus = 'Pending' | 'Confirmed' | 'Rescheduled' | 'Declined' | 'Completed';

export type TrialChecklistItem = {
  id: string;
  title: string;
  category: 'performance' | 'travel' | 'medical' | 'equipment' | 'logistics';
  completed: boolean;
  required: boolean;
};

export type TrialBooking = {
  id: string;
  playerId: string;
  opportunityId: string;
  club: string;
  trialDate: string;
  timeSlot: string;
  location: string;
  status: TrialStatus;
  scoutContact: string;
  notes: string;
  checklist: TrialChecklistItem[];
  progress?: {
    total: number;
    completed: number;
    percent: number;
    requiredComplete: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export const defaultTrialBookings: TrialBooking[] = [
  {
    id: 'trial-1',
    playerId: 'demo-player',
    opportunityId: '1',
    club: 'FC Midtjylland',
    trialDate: 'June 24, 2026',
    timeSlot: 'Morning Session (09:30 - 12:00 CET)',
    location: 'Ikast Træningscenter, Herning, Denmark',
    status: 'Confirmed',
    scoutContact: 'Mikkel Soren',
    notes: 'First-team bridge trial. Pitch 3, bring white training kit.',
    checklist: [
      { id: 'chk-1', title: 'GPS Sprint Report (Last 30 Days)', category: 'performance', completed: true, required: true },
      { id: 'chk-2', title: 'Valid Passport / EU Travel Permit', category: 'travel', completed: true, required: true },
      { id: 'chk-3', title: 'Sports Medical & Injury Clearance', category: 'medical', completed: false, required: true },
      { id: 'chk-4', title: 'Two Pairs of Firm-Ground / Turf Boots', category: 'equipment', completed: true, required: false },
      { id: 'chk-5', title: 'Emergency Contact & Club Accommodation Form', category: 'logistics', completed: false, required: false },
    ],
    progress: {
      total: 5,
      completed: 3,
      percent: 60,
      requiredComplete: false,
    },
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-12T14:30:00.000Z',
  },
];

export type CareerMilestone = {
  id: string;
  club: string;
  role: string;
  period: string;
  appearances: number;
  goals: number;
  assists: number;
  verified: boolean;
  category: string;
};

export type PassportMetrics = {
  fifaId: string;
  passportStatus: string;
  verificationTier: string;
  nationality: string;
  secondNationality: string;
  workPermitStatus: string;
  preferredFoot: string;
  heightWeight: string;
  agencyRepresentation: string;
  medicalClearance: string;
  scoutEndorsements: number;
};

export type PlayerPassport = {
  playerId: string;
  metrics: PassportMetrics;
  milestones: CareerMilestone[];
  verificationScore: number;
  shareableUrl: string;
  updatedAt: string;
};

export const defaultPassport: PlayerPassport = {
  playerId: 'demo-player',
  metrics: {
    fifaId: 'FIFA-DK-2026-88912',
    passportStatus: 'Verified Pro Prospect',
    verificationTier: 'Tier 1 Talent ID',
    nationality: 'Danish (EU Citizen)',
    secondNationality: 'None',
    workPermitStatus: 'Full EU Working Rights (No Visa Required)',
    preferredFoot: 'Right (Left 4/5)',
    heightWeight: '178 cm / 72 kg',
    agencyRepresentation: 'Nordic Sports Talent Management',
    medicalClearance: 'FIFA Grade A (Clean 2026)',
    scoutEndorsements: 6,
  },
  milestones: [
    {
      id: 'milestone-1',
      club: 'FC Midtjylland Academy',
      role: 'U19 Starting Winger',
      period: '2023 - 2025',
      appearances: 38,
      goals: 14,
      assists: 11,
      verified: true,
      category: 'Academy',
    },
    {
      id: 'milestone-2',
      club: 'HB Koge Reserve',
      role: 'Senior Cup Trialist',
      period: '2025 - 2026',
      appearances: 12,
      goals: 5,
      assists: 4,
      verified: true,
      category: 'Senior Reserve',
    },
    {
      id: 'milestone-3',
      club: 'Denmark U20 National Pool',
      role: 'Invited Training Camp',
      period: 'Spring 2026',
      appearances: 3,
      goals: 1,
      assists: 2,
      verified: true,
      category: 'International',
    },
  ],
  verificationScore: 94,
  shareableUrl: 'https://nicescout.app/passport/demo-player',
  updatedAt: '2026-08-30T10:00:00.000Z',
};

export type DealStatus = 'Offered' | 'Countered' | 'UnderReview' | 'Agreed' | 'Declined' | 'Signed';

export type NegotiationEntry = {
  id: string;
  sender: 'club' | 'player';
  author: string;
  action: string;
  baseSalaryMonthly: number;
  notes: string;
  timestamp: string;
};

export type DealFinancials = {
  months: number;
  guaranteedTotal: number;
  projectedTotal: number;
  monthlyNetEstimate: number;
  dealScore: number;
};

export type ContractDeal = {
  id: string;
  playerId: string;
  opportunityId: string;
  club: string;
  league: string;
  contractType: string;
  durationYears: number;
  baseSalaryMonthly: number;
  currency: string;
  signingBonus: number;
  appearanceBonus: number;
  goalAssistBonus: number;
  housingStipendMonthly: number;
  releaseClause: number;
  status: DealStatus;
  scoutContact: string;
  signature?: string;
  signedAt?: string;
  negotiationHistory: NegotiationEntry[];
  financials?: DealFinancials;
  createdAt: string;
  updatedAt: string;
};

export const defaultDeals: ContractDeal[] = [
  {
    id: 'deal-1',
    playerId: 'demo-player',
    opportunityId: '1',
    club: 'FC Midtjylland',
    league: 'Danish Superliga Academy Bridge',
    contractType: 'First Team Pathway / Development Pro',
    durationYears: 2,
    baseSalaryMonthly: 4200,
    currency: 'EUR',
    signingBonus: 8000,
    appearanceBonus: 400,
    goalAssistBonus: 300,
    housingStipendMonthly: 850,
    releaseClause: 350000,
    status: 'Offered',
    scoutContact: 'Mikkel Soren (Nordic Recruitment)',
    negotiationHistory: [
      {
        id: 'hist-1',
        sender: 'club',
        author: 'Mikkel Soren',
        action: 'Initial Offer Submitted',
        baseSalaryMonthly: 4200,
        notes: '2-year development contract with senior cup call-up incentives.',
        timestamp: '2026-08-28T14:00:00.000Z',
      },
    ],
    financials: {
      months: 24,
      guaranteedTotal: 129200,
      projectedTotal: 140200,
      monthlyNetEstimate: 2856,
      dealScore: 92,
    },
    createdAt: '2026-08-28T14:00:00.000Z',
    updatedAt: '2026-08-29T10:30:00.000Z',
  },
];

export type WatchlistTier = 'Priority Target' | 'Monitored' | 'Extended List';

export type WatchlistEntry = {
  id: string;
  playerId: string;
  scoutId: string;
  scoutName: string;
  club: string;
  league: string;
  role: string;
  tier: WatchlistTier;
  addedDate: string;
  lastViewedAt: string;
  notes: string;
  tags: string[];
  inquiryStatus: string;
};

export type ScoutInquiry = {
  id: string;
  playerId: string;
  scoutName: string;
  club: string;
  type: string;
  status: string;
  message: string;
  date: string;
};

export type WatchlistMetrics = {
  totalScouts: number;
  priorityCount: number;
  monitoredCount: number;
  extendedCount: number;
  activeLeaguesCount: number;
  activeLeagues: string[];
  interestIndex: number;
};

export type WatchlistReport = {
  playerId: string;
  metrics: WatchlistMetrics;
  watchlists: WatchlistEntry[];
  inquiries: ScoutInquiry[];
};

export const defaultWatchlistReport: WatchlistReport = {
  playerId: 'demo-player',
  metrics: {
    totalScouts: 4,
    priorityCount: 2,
    monitoredCount: 1,
    extendedCount: 1,
    activeLeaguesCount: 4,
    activeLeagues: [
      'Danish Superliga Academy bridge',
      'Eredivisie U23 pathway',
      'German development squad',
      'Liga Portugal recruitment group',
    ],
    interestIndex: 88,
  },
  watchlists: [
    {
      id: 'watch-1',
      playerId: 'demo-player',
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
      playerId: 'demo-player',
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
      playerId: 'demo-player',
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
      playerId: 'demo-player',
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
  ],
  inquiries: [
    {
      id: 'inq-1',
      playerId: 'demo-player',
      scoutName: 'Mikkel Soren',
      club: 'FC Midtjylland',
      type: 'Trial Availability Confirmation',
      status: 'Confirmed',
      message: 'Confirmed attendance for June 24 morning session. Medical team notified.',
      date: '2026-08-30',
    },
    {
      id: 'inq-2',
      playerId: 'demo-player',
      scoutName: 'Noah Janssen',
      club: 'AZ Alkmaar',
      type: 'Match Footage Request',
      status: 'Pending Review',
      message: 'Reviewing full-match left-side footage vs Lyngby Reserve.',
      date: '2026-08-31',
    },
  ],
};

export function findOpportunity(id?: string | string[]) {
  const normalizedId = Array.isArray(id) ? id[0] : id;
  return opportunities.find((opportunity) => opportunity.id === normalizedId);
}

export function findMessage(id?: string | string[]) {
  const normalizedId = Array.isArray(id) ? id[0] : id;
  return messages.find((message) => message.id === normalizedId);
}
