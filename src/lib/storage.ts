import type { DraftPick } from "./types";

export const STORAGE_PREFIX = "draft-helper:v1:";

export interface PersistedDraft {
  version: 1;
  leagueId: string;
  cobraSlot: number | null;
  userPicks: DraftPick[];
  clockRunning: boolean;
  clockStartedAt: number | null;
  clockOffset: number;
}

export function storageKey(leagueId: string): string {
  return `${STORAGE_PREFIX}${leagueId}`;
}

export function loadDraft(leagueId: string): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(leagueId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (parsed.version !== 1 || parsed.leagueId !== leagueId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(state: PersistedDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(state.leagueId), JSON.stringify(state));
}

export function clearDraft(leagueId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(leagueId));
}

export function emptyDraft(leagueId: string): PersistedDraft {
  return {
    version: 1,
    leagueId,
    cobraSlot: null,
    userPicks: [],
    clockRunning: false,
    clockStartedAt: null,
    clockOffset: 0,
  };
}
