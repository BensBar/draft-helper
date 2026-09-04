import { matchPlayerName, parsePastedNames } from "./cbs-sync";
import type { Player } from "./types";

/** Hard fades — never smash these even if they were pasted into the robot queue. */
export const PREQUEUE_NEVER_IDS = ["josh-jacobs", "kaleb-johnson"] as const;

export const PREQUEUE_KEY_PREFIX = "draft-helper:prequeue:v1:";

export function prequeueKey(leagueId: string): string {
  return `${PREQUEUE_KEY_PREFIX}${leagueId}`;
}

export interface ParsedPreQueue {
  names: string[];
  matched: Player[];
  unmatched: string[];
  faded: Player[];
}

export function parseRankedQueue(text: string, players: Player[]): ParsedPreQueue {
  const names = parsePastedNames(text);
  const seen = new Set<string>();
  const matched: Player[] = [];
  const unmatched: string[] = [];
  const faded: Player[] = [];
  const never = new Set<string>(PREQUEUE_NEVER_IDS);

  for (const name of names) {
    const hit = matchPlayerName(name, players);
    if (!hit) {
      unmatched.push(name);
      continue;
    }
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    if (never.has(hit.id)) {
      faded.push(hit);
      continue;
    }
    matched.push(hit);
  }

  return { names, matched, unmatched, faded };
}

export function availableFromQueue(queue: Player[], takenIds: Set<string>): Player[] {
  const never = new Set<string>(PREQUEUE_NEVER_IDS);
  return queue.filter((p) => !takenIds.has(p.id) && !never.has(p.id));
}

export function prequeueWhy(queue: Player[]): string {
  if (queue.length === 0) return "Preloaded robot queue is empty. Use the rec engine.";
  const next = queue.slice(0, 4).map((p) => p.name);
  const rest = next.slice(1).join(" / ");
  return rest
    ? `Preloaded robot queue — smash ${next[0]}. Next: ${rest}. Never Josh Jacobs. MarShawn Lloyd not Kaleb Johnson.`
    : `Preloaded robot queue — smash ${next[0]}. Never Josh Jacobs. MarShawn Lloyd not Kaleb Johnson.`;
}
