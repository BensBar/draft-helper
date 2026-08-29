import { describe, expect, it } from "vitest";
import {
  isBenTurn,
  overallPickFor,
  overallPickToRound,
  picksForSlot,
  slotForOverallPick,
  teamNameForPick,
} from "./snake";

const TEAMS = 12;

describe("snake math — Gable pick 12 double-ups", () => {
  it("maps slot 12 to overall 12, 13, 36, 37, 60, 61", () => {
    expect(picksForSlot(12, TEAMS, 6)).toEqual([12, 13, 36, 37, 60, 61]);
  });

  it("continues the double-up pattern through later rounds", () => {
    expect(overallPickFor(12, 7, TEAMS)).toBe(84);
    expect(overallPickFor(12, 8, TEAMS)).toBe(85);
    expect(overallPickFor(12, 9, TEAMS)).toBe(108);
    expect(overallPickFor(12, 10, TEAMS)).toBe(109);
  });

  it("round-trips overall pick → slot → overall pick for pick 12 turns", () => {
    for (const overall of [12, 13, 36, 37, 60, 61]) {
      expect(slotForOverallPick(overall, TEAMS)).toBe(12);
      const round = overallPickToRound(overall, TEAMS);
      expect(overallPickFor(12, round, TEAMS)).toBe(overall);
    }
  });

  it("marks Ben on the clock only at his snake picks", () => {
    expect(isBenTurn(12, TEAMS, 12)).toBe(true);
    expect(isBenTurn(13, TEAMS, 12)).toBe(true);
    expect(isBenTurn(11, TEAMS, 12)).toBe(false);
    expect(isBenTurn(14, TEAMS, 12)).toBe(false);
    expect(isBenTurn(36, TEAMS, 12)).toBe(true);
    expect(isBenTurn(37, TEAMS, 12)).toBe(true);
  });
});

describe("snake math — Cobra slot picker changes whose-turn", () => {
  it("does not hardcode pick 3 as Ben's slot", () => {
    expect(isBenTurn(3, TEAMS, 1)).toBe(false);
    expect(isBenTurn(3, TEAMS, 12)).toBe(false);
    expect(isBenTurn(3, TEAMS, 3)).toBe(true);
  });

  it("recomputes turn ownership when the drawn slot changes", () => {
    // R2 even: overall 22 is slot 3 (13=slot12 … 22=slot3)
    expect(slotForOverallPick(22, TEAMS)).toBe(3);
    expect(isBenTurn(22, TEAMS, 3)).toBe(true);
    expect(isBenTurn(22, TEAMS, 7)).toBe(false);
    expect(isBenTurn(22, TEAMS, 12)).toBe(false);

    expect(picksForSlot(3, TEAMS, 2)).toEqual([3, 22]);
    expect(picksForSlot(1, TEAMS, 2)).toEqual([1, 24]);
    expect(picksForSlot(12, TEAMS, 2)).toEqual([12, 13]);
    expect(picksForSlot(3, TEAMS, 4)).not.toEqual(picksForSlot(12, TEAMS, 4));
  });

  it("names the on-clock team from the live order", () => {
    const order = Array.from({ length: 12 }, (_, i) => `Slot ${i + 1}`);
    order[2] = "Ben's Bar";
    expect(teamNameForPick(3, TEAMS, order)).toBe("Ben's Bar");
    expect(teamNameForPick(1, TEAMS, order)).toBe("Slot 1");
  });
});
