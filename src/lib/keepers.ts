import type { DraftPick, Keeper } from "./types";
import { overallPickFor } from "./snake";

export function keeperOverallPick(
  keeper: Keeper,
  draftOrder: string[],
  teams: number,
): number {
  const slot = draftOrder.indexOf(keeper.team) + 1;
  if (slot < 1) {
    throw new Error(`Keeper team not in draft order: ${keeper.team}`);
  }
  return overallPickFor(slot, keeper.round, teams);
}

export function keeperPicks(
  keepers: Keeper[],
  draftOrder: string[],
  teams: number,
): DraftPick[] {
  return keepers.map((k) => ({
    overallPick: keeperOverallPick(k, draftOrder, teams),
    playerId: k.playerId,
    source: "keeper" as const,
  }));
}

export function keeperPickNumbers(
  keepers: Keeper[],
  draftOrder: string[],
  teams: number,
): Set<number> {
  return new Set(keeperPicks(keepers, draftOrder, teams).map((p) => p.overallPick));
}

export function firstLivePick(
  teams: number,
  rounds: number,
  keeperNums: Set<number>,
): number {
  const last = teams * rounds;
  for (let pick = 1; pick <= last; pick++) {
    if (!keeperNums.has(pick)) return pick;
  }
  return last + 1;
}

export function nextLivePick(
  afterOverall: number,
  teams: number,
  rounds: number,
  keeperNums: Set<number>,
): number {
  const last = teams * rounds;
  for (let pick = afterOverall; pick <= last; pick++) {
    if (!keeperNums.has(pick)) return pick;
  }
  return last + 1;
}
