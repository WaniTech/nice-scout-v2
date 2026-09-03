import {
    BenchmarkReport,
    ContractDeal,
    GpsReport,
    GpsSession,
    Opportunity,
    OpportunityStage,
    PassportMetrics,
    PillarScores,
    PlayerClip,
    PlayerClipStatus,
    PlayerMessage,
    PlayerPassport,
    ScoutActivityReport,
    TelestrationType,
    TrialBooking,
    TrialStatus,
    VideoAnnotationReport,
    VideoTelestration,
    WatchlistEntry,
    WatchlistReport,
    WatchlistTier,
} from '@/constants/playerPlatform';

const API_BASE_URL = 'http://localhost:5000/api';

export type SyncQueueStatus = 'idle' | 'syncing' | 'queued' | 'replaying' | 'error';

export type SyncQueueSnapshot = {
  status: SyncQueueStatus;
  queuedCount: number;
  lastError?: string;
};

type QueueEntry = {
  id: string;
  execute: () => Promise<void>;
  retries: number;
};

const queueListeners = new Set<(snapshot: SyncQueueSnapshot) => void>();
const mutationQueue: QueueEntry[] = [];
let queueProcessing = false;
let queueIdCounter = 0;

let queueSnapshot: SyncQueueSnapshot = {
  status: 'idle',
  queuedCount: 0,
};

function emitQueueSnapshot(next: Partial<SyncQueueSnapshot>) {
  queueSnapshot = {
    ...queueSnapshot,
    ...next,
    queuedCount: mutationQueue.length,
  };

  for (const listener of queueListeners) {
    listener(queueSnapshot);
  }
}

export function getSyncQueueSnapshot(): SyncQueueSnapshot {
  return queueSnapshot;
}

export function subscribeSyncQueue(listener: (snapshot: SyncQueueSnapshot) => void) {
  queueListeners.add(listener);
  listener(queueSnapshot);

  return () => {
    queueListeners.delete(listener);
  };
}

function isNetworkError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timed out')
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry<T>(
  path: string,
  options: RequestInit,
  retries = 2,
  baseDelayMs = 250,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await request<T>(path, options);
    } catch (error) {
      if (!isNetworkError(error) || attempt >= retries) {
        throw error;
      }

      const waitMs = baseDelayMs * 2 ** attempt;
      attempt += 1;
      await delay(waitMs);
    }
  }
}

function enqueueMutation(path: string, options: RequestInit) {
  const normalizedOptions: RequestInit = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  queueIdCounter += 1;
  mutationQueue.push({
    id: `queued-${queueIdCounter}`,
    retries: 0,
    execute: () => requestWithRetry<void>(path, normalizedOptions, 2, 350),
  });

  emitQueueSnapshot({
    status: 'queued',
    lastError: undefined,
  });

  void flushSyncQueue();
}

export async function flushSyncQueue() {
  if (queueProcessing || mutationQueue.length === 0) {
    return;
  }

  queueProcessing = true;

  try {
    emitQueueSnapshot({ status: 'replaying', lastError: undefined });

    while (mutationQueue.length > 0) {
      const current = mutationQueue[0];

      try {
        await current.execute();
        mutationQueue.shift();
        emitQueueSnapshot({
          status: mutationQueue.length > 0 ? 'replaying' : 'idle',
          lastError: undefined,
        });
      } catch (error) {
        if (isNetworkError(error) && current.retries < 3) {
          current.retries += 1;
          await delay(300 * 2 ** current.retries);
          continue;
        }

        emitQueueSnapshot({
          status: 'error',
          lastError: error instanceof Error ? error.message : 'Queue replay failed',
        });
        break;
      }
    }
  } finally {
    queueProcessing = false;
  }
}

async function mutationRequestOrQueue<T>(
  path: string,
  options: RequestInit,
  fallbackFactory: () => T,
): Promise<T> {
  emitQueueSnapshot({ status: 'syncing', lastError: undefined });

  try {
    const result = await requestWithRetry<T>(path, options, 1, 250);
    emitQueueSnapshot({ status: mutationQueue.length > 0 ? 'queued' : 'idle' });
    return result;
  } catch (error) {
    if (!isNetworkError(error)) {
      emitQueueSnapshot({ status: 'error', lastError: error instanceof Error ? error.message : 'Sync failed' });
      throw error;
    }

    enqueueMutation(path, options);
    return fallbackFactory();
  }
}

export type PlayerApplication = {
  id: string;
  playerId: string;
  opportunityId: string;
  stage: OpportunityStage;
  notes: string;
  createdAt: string;
  updatedAt: string;
  opportunity?: Opportunity | null;
};

export type PlayerProfilePayload = {
  name?: string;
  email?: string;
  position?: string;
  secondaryPositions?: string[];
  location?: string;
  clubStatus?: string;
  headline?: string;
  strengths?: string[];
  achievements?: string;
  clips?: string;
};

export type PlayerPreferencesPayload = {
  markets?: string[];
  contractType?: string;
  travelWindow?: string;
  minimumPackage?: string;
  openToLoan?: boolean;
  hiddenRules?: {
    locations?: string;
    formats?: string;
    clubs?: string;
  };
};

export type PlayerAvailabilityPayload = {
  ready?: boolean;
  travelDate?: string;
  trainingLoad?: string;
  contactWindow?: string;
};

export type PlayerClipPayload = {
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
  attachedToOpportunityId?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getOpportunities() {
  return request<Opportunity[]>('/opportunities');
}

export function getPlayerApplications(playerId: string) {
  return request<PlayerApplication[]>(`/player/${playerId}/applications`);
}

export function saveApplication(playerId: string, opportunityId: string, stage: OpportunityStage) {
  return mutationRequestOrQueue<PlayerApplication>(`/player/${playerId}/applications`, {
    method: 'POST',
    body: JSON.stringify({ opportunityId, stage }),
  }, () => {
    const now = new Date().toISOString();
    return {
      id: `queued-${playerId}-${opportunityId}-${Date.now()}`,
      playerId,
      opportunityId,
      stage,
      notes: '[queued] pending sync',
      createdAt: now,
      updatedAt: now,
      opportunity: null,
    };
  });
}

export function updateApplicationStage(playerId: string, applicationId: string, stage: OpportunityStage) {
  return mutationRequestOrQueue<PlayerApplication>(`/player/${playerId}/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  }, () => {
    const now = new Date().toISOString();
    return {
      id: applicationId,
      playerId,
      opportunityId: '',
      stage,
      notes: '[queued] pending sync',
      createdAt: now,
      updatedAt: now,
      opportunity: null,
    };
  });
}

export function deleteApplication(playerId: string, applicationId: string) {
  return mutationRequestOrQueue<void>(`/player/${playerId}/applications/${applicationId}`, {
    method: 'DELETE',
  }, () => undefined);
}

export function syncQueuedMutationsNow() {
  return flushSyncQueue();
}

export function updatePlayerProfile(playerId: string, payload: PlayerProfilePayload) {
  return request(`/player/${playerId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updatePlayerPreferences(playerId: string, payload: PlayerPreferencesPayload) {
  return request(`/player/${playerId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updatePlayerAvailability(playerId: string, payload: PlayerAvailabilityPayload) {
  return request(`/player/${playerId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function archiveMessage(playerId: string, messageId: string) {
  return request<PlayerMessage & { archived: boolean }>(`/player/${playerId}/messages/${messageId}/archive`, {
    method: 'PATCH',
  });
}

export function createMessageReply(
  playerId: string,
  messageId: string,
  body: string,
  attachments: string[] = [],
) {
  return request<{ id: string; body: string; attachments: string[]; createdAt: string }>(
    `/player/${playerId}/messages/${messageId}/replies`,
    {
      method: 'POST',
      body: JSON.stringify({ body, attachments }),
    },
  );
}

export function getPlayerClips(playerId: string) {
  return request<PlayerClip[]>(`/player/${playerId}/clips`);
}

export function createPlayerClip(playerId: string, payload: PlayerClipPayload) {
  return request<PlayerClip>(`/player/${playerId}/clips`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePlayerClip(
  playerId: string,
  clipId: string,
  payload: Partial<PlayerClipPayload>,
) {
  return request<PlayerClip>(`/player/${playerId}/clips/${clipId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deletePlayerClip(playerId: string, clipId: string) {
  return request<void>(`/player/${playerId}/clips/${clipId}`, {
    method: 'DELETE',
  });
}

export type MatchFilterWeights = {
  positionWeight?: number;
  tacticalWeight?: number;
  locationWeight?: number;
  financialWeight?: number;
};

export type PlayerMatchOpportunity = Opportunity & {
  compatibilityScore: number;
  fitBreakdown: {
    positionalFit: number;
    tacticalFit: number;
    locationFit: number;
    financialFit: number;
    overallCompatibility: number;
  };
  reasons: string[];
  isHighMatch: boolean;
};

export function fetchPlayerMatches(
  profile: Partial<PlayerProfilePayload & { preferences?: PlayerPreferencesPayload }>,
  options: {
    minCompatibility?: number;
    limit?: number;
    weights?: MatchFilterWeights;
  } = {}
) {
  return request<PlayerMatchOpportunity[]>('/player-match/match', {
    method: 'POST',
    body: JSON.stringify({
      profile,
      ...options,
    }),
  });
}

export function evaluateOpportunityCompatibility(
  opportunityId: string,
  profile: Partial<PlayerProfilePayload & { preferences?: PlayerPreferencesPayload }>,
  weights?: MatchFilterWeights
) {
  return request<PlayerMatchOpportunity>(`/player-match/evaluate/${opportunityId}`, {
    method: 'POST',
    body: JSON.stringify({
      profile,
      weights,
    }),
  });
}

export function getPlayerAnalytics(playerId: string) {
  return request<{ playerId: string; pillars: PillarScores; timestamp: string }>(
    `/player/${playerId}/analytics`
  );
}

export function getPlayerBenchmarks(
  playerId: string,
  position?: string,
  baseline?: string
) {
  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (baseline) params.append('baseline', baseline);
  const query = params.toString() ? `?${params.toString()}` : '';

  return request<BenchmarkReport>(`/player/${playerId}/benchmarks${query}`);
}

export function getPlayerScoutActivity(playerId: string) {
  return request<ScoutActivityReport>(`/player/${playerId}/scout-activity`);
}

export function getPlayerTrials(playerId: string) {
  return request<TrialBooking[]>(`/trials/${playerId}`);
}

export function scheduleTrialBooking(
  playerId: string,
  payload: {
    opportunityId: string;
    club?: string;
    trialDate: string;
    timeSlot?: string;
    location?: string;
    scoutContact?: string;
    notes?: string;
  }
) {
  return request<TrialBooking>(`/trials/${playerId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function rsvpTrialBooking(
  playerId: string,
  trialId: string,
  payload: {
    status: TrialStatus;
    reason?: string;
    requestedDate?: string;
    requestedTimeSlot?: string;
  }
) {
  return request<TrialBooking>(`/trials/${playerId}/${trialId}/rsvp`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function toggleTrialChecklistItem(
  playerId: string,
  trialId: string,
  itemId: string,
  completed?: boolean
) {
  return request<TrialBooking>(`/trials/${playerId}/${trialId}/checklist/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export function getPlayerPassport(playerId: string) {
  return request<PlayerPassport>(`/passport/${playerId}`);
}

export function addCareerMilestone(
  playerId: string,
  payload: {
    club: string;
    role: string;
    period: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    category?: string;
  }
) {
  return request<PlayerPassport>(`/passport/${playerId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePassportMetrics(
  playerId: string,
  payload: Partial<PassportMetrics>
) {
  return request<PlayerPassport>(`/passport/${playerId}/metrics`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getPlayerDeals(playerId: string) {
  return request<ContractDeal[]>(`/deals/${playerId}`);
}

export function getDealDetails(playerId: string, dealId: string) {
  return request<ContractDeal>(`/deals/${playerId}/${dealId}`);
}

export function submitDealCounter(
  playerId: string,
  dealId: string,
  payload: {
    counterSalaryMonthly: number;
    counterSigningBonus?: number;
    counterDurationYears?: number;
    notes?: string;
  }
) {
  return request<ContractDeal>(`/deals/${playerId}/${dealId}/counter`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function signContractDeal(
  playerId: string,
  dealId: string,
  payload: {
    signature?: string;
    confirmationNotes?: string;
  } = {}
) {
  return request<ContractDeal>(`/deals/${playerId}/${dealId}/sign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getPlayerWatchlistReport(playerId: string) {
  return request<WatchlistReport>(`/watchlist/${playerId}`);
}

export function addScoutToWatchlist(
  playerId: string,
  payload: {
    scoutName: string;
    club: string;
    league?: string;
    role?: string;
    tier?: WatchlistTier;
    notes?: string;
    tags?: string[];
  }
) {
  return request<WatchlistEntry>(`/watchlist/${playerId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWatchlistEntry(
  playerId: string,
  entryId: string,
  payload: {
    tier?: WatchlistTier;
    notes?: string;
    inquiryStatus?: string;
  }
) {
  return request<WatchlistEntry>(`/watchlist/${playerId}/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getVideoAnnotations(playerId: string, clipId?: string) {
  const query = clipId ? `?clipId=${encodeURIComponent(clipId)}` : '';
  return request<VideoAnnotationReport>(`/annotations/${playerId}${query}`);
}

export function addVideoTelestration(
  playerId: string,
  payload: {
    clipId: string;
    title: string;
    timestampSeconds?: number;
    timestampFormatted?: string;
    type?: TelestrationType;
    drawingData?: Record<string, unknown>;
    tacticalCategory?: string;
    coachingNote?: string;
    verifiedByScout?: string;
  }
) {
  return request<VideoTelestration>(`/annotations/${playerId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteVideoAnnotation(playerId: string, annotationId: string) {
  return request<void>(`/annotations/${playerId}/${annotationId}`, {
    method: 'DELETE',
  });
}

export function getPlayerGpsReport(playerId: string) {
  return request<GpsReport>(`/gps/${playerId}`);
}

export function logGpsSession(
  playerId: string,
  payload: Partial<GpsSession>
) {
  return request<GpsSession>(`/gps/${playerId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
