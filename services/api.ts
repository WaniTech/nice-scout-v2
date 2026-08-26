import {
    Opportunity,
    OpportunityStage,
    PlayerClip,
    PlayerClipStatus,
    PlayerMessage,
} from '@/constants/playerPlatform';

const API_BASE_URL = 'http://localhost:5000/api';

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

export type SyncQueueStatus = 'idle' | 'replaying';

export type SyncQueueSnapshot = {
  queuedCount: number;
  status: SyncQueueStatus;
};

type SyncQueueListener = (snapshot: SyncQueueSnapshot) => void;

const syncQueueSnapshot: SyncQueueSnapshot = {
  queuedCount: 0,
  status: 'idle',
};

const syncQueueListeners = new Set<SyncQueueListener>();

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
  return request<PlayerApplication>(`/player/${playerId}/applications`, {
    method: 'POST',
    body: JSON.stringify({ opportunityId, stage }),
  });
}

export function updateApplicationStage(playerId: string, applicationId: string, stage: OpportunityStage) {
  return request<PlayerApplication>(`/player/${playerId}/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  });
}

export function deleteApplication(playerId: string, applicationId: string) {
  return request<void>(`/player/${playerId}/applications/${applicationId}`, {
    method: 'DELETE',
  });
}

export function getSyncQueueSnapshot(): SyncQueueSnapshot {
  return { ...syncQueueSnapshot };
}

export function subscribeSyncQueue(listener: SyncQueueListener) {
  syncQueueListeners.add(listener);
  listener(getSyncQueueSnapshot());
  return () => {
    syncQueueListeners.delete(listener);
  };
}

export async function syncQueuedMutationsNow(): Promise<SyncQueueSnapshot> {
  return getSyncQueueSnapshot();
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
