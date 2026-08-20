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
  background: '#F5F7F0',
  ink: '#111813',
  muted: '#657166',
  line: '#DDE4D7',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF3E8',
  primary: '#1E6B4E',
  primaryDark: '#0D3427',
  accent: '#C9922E',
  blue: '#2D5B7C',
  red: '#C84B3A',
  tab: '#101712',
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

export function findOpportunity(id?: string | string[]) {
  const normalizedId = Array.isArray(id) ? id[0] : id;
  return opportunities.find((opportunity) => opportunity.id === normalizedId);
}

export function findMessage(id?: string | string[]) {
  const normalizedId = Array.isArray(id) ? id[0] : id;
  return messages.find((message) => message.id === normalizedId);
}
