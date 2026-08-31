import { matchPlayerName } from "./cbs-sync";
import type { Player } from "./types";

export type AdpStatus = "ok" | "skipped";

export interface AdpEntry {
  name: string;
  position?: string;
  nflTeam?: string;
  adp: number;
  overallRank: number;
  sources?: number;
}

export interface AdpBoard {
  id: string;
  source: string;
  url?: string | null;
  fetched: string;
  scoring: string;
  status: AdpStatus;
  skipReason?: string | null;
  notes?: string | null;
  playerCount: number;
  players: AdpEntry[];
}

export interface AdpSourceInfo {
  id: string;
  label: string;
  banner: string;
  fetched: string;
  scoring: string;
  status: AdpStatus;
  skipReason?: string | null;
  file: string;
  blend?: boolean;
}

export interface AdpSourcesFile {
  defaultSourceId: string;
  fetched: string;
  scoring: string;
  notes?: string;
  sources: AdpSourceInfo[];
}

export const ADP_SOURCE_KEY = "draft-helper:adp-source";

export function sourceById(catalog: AdpSourcesFile, id: string): AdpSourceInfo | undefined {
  return catalog.sources.find((s) => s.id === id);
}

export function resolveAdpSourceId(catalog: AdpSourcesFile, requested: string | null): string {
  if (requested) {
    const hit = sourceById(catalog, requested);
    if (hit?.status === "ok") return hit.id;
  }
  const fallback = sourceById(catalog, catalog.defaultSourceId);
  if (fallback?.status === "ok") return fallback.id;
  return catalog.sources.find((s) => s.status === "ok")?.id ?? catalog.defaultSourceId;
}

/** Overlay ADP / overallRank from a public board. Unmatched names keep the default (Gil/CBS) numbers. */
export function applyAdpSource(players: Player[], board: AdpBoard | null | undefined): Player[] {
  if (!board || board.status !== "ok" || board.players.length === 0) return players;
  const overlay = new Map<string, { adp: number; overallRank: number }>();
  for (const row of board.players) {
    const hit = matchPlayerName(row.name, players);
    if (hit && !overlay.has(hit.id)) {
      overlay.set(hit.id, { adp: row.adp, overallRank: row.overallRank });
    }
  }
  return players.map((p) => {
    const next = overlay.get(p.id);
    if (!next) return p;
    return { ...p, adp: next.adp, overallRank: next.overallRank };
  });
}

export function rankedPlayersForSource(
  players: Player[],
  catalog: AdpSourcesFile,
  boards: Record<string, AdpBoard>,
  sourceId: string,
): Player[] {
  const id = resolveAdpSourceId(catalog, sourceId);
  if (id === "gil") return players;
  return applyAdpSource(players, boards[id]);
}

export function bannerForSource(catalog: AdpSourcesFile, sourceId: string, fallback: string): string {
  return sourceById(catalog, resolveAdpSourceId(catalog, sourceId))?.banner ?? fallback;
}
