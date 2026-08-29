/** 1-indexed snake draft math. Round 1 goes 1→N, round 2 goes N→1, etc. */

export function overallPickToRound(overallPick: number, teams: number): number {
  if (overallPick < 1 || teams < 1) {
    throw new Error("overallPick and teams must be >= 1");
  }
  return Math.ceil(overallPick / teams);
}

export function positionInRound(overallPick: number, teams: number): number {
  return ((overallPick - 1) % teams) + 1;
}

/** Draft slot (1-indexed) that owns this overall pick. */
export function slotForOverallPick(overallPick: number, teams: number): number {
  const round = overallPickToRound(overallPick, teams);
  const pos = positionInRound(overallPick, teams);
  if (round % 2 === 1) return pos;
  return teams - pos + 1;
}

/** Overall pick number for a given slot in a given round. */
export function overallPickFor(slot: number, round: number, teams: number): number {
  if (slot < 1 || slot > teams) {
    throw new Error(`slot ${slot} out of range for ${teams} teams`);
  }
  if (round < 1) throw new Error("round must be >= 1");
  if (round % 2 === 1) return (round - 1) * teams + slot;
  return (round - 1) * teams + (teams - slot + 1);
}

export function picksForSlot(slot: number, teams: number, rounds: number): number[] {
  const picks: number[] = [];
  for (let round = 1; round <= rounds; round++) {
    picks.push(overallPickFor(slot, round, teams));
  }
  return picks;
}

export function isBenTurn(overallPick: number, teams: number, benSlot: number): boolean {
  return slotForOverallPick(overallPick, teams) === benSlot;
}

export function teamNameForPick(
  overallPick: number,
  teams: number,
  draftOrder: string[],
): string {
  const slot = slotForOverallPick(overallPick, teams);
  return draftOrder[slot - 1] ?? `Slot ${slot}`;
}

export function totalPicks(teams: number, rounds: number): number {
  return teams * rounds;
}

export function withBenInOrder(
  draftOrder: string[],
  benSlot: number,
  teamName: string,
): string[] {
  return draftOrder.map((name, i) => (i === benSlot - 1 ? teamName : name));
}
