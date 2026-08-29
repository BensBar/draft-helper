import { describe, expect, it } from "vitest";
import recRules from "../../data/rec-rules.json";
import keepersFile from "../../data/keepers.json";
import leaguesFile from "../../data/leagues.json";
import playersFile from "../../data/players.json";
import { keeperPickNumbers } from "./keepers";
import { recommendCobra, recommendGable, recommendNext } from "./rec-engine";
import { isBenTurn, overallPickFor } from "./snake";
import type { League, Player, RecRulesFile } from "./types";

const rules = recRules as RecRulesFile;
const players = playersFile.players as Player[];
const gable = (leaguesFile.leagues as League[]).find((l) => l.id === "gable")!;
const cobra = (leaguesFile.leagues as League[]).find((l) => l.id === "cobra")!;

const RB12 = [
  "christian-mccaffrey",
  "james-cook",
  "chase-brown",
  "derrick-henry",
  "saquon-barkley",
  "omarion-hampton",
  "ashton-jeanty",
];

function gableTaken(): Set<string> {
  return new Set(keepersFile.gable.map((k) => k.playerId));
}

describe("Gable rec engine — picks 12/13", () => {
  it("recommends an RB from the 7-man pile and never TE/QB", () => {
    const taken = gableTaken();
    const rec12 = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 12,
      teams: 12,
    });
    const rec13 = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 13,
      teams: 12,
    });

    expect(rec12.player).not.toBeNull();
    expect(rec12.player!.position).toBe("RB");
    expect(RB12).toContain(rec12.player!.id);
    expect(rec12.player!.position).not.toBe("TE");
    expect(rec12.player!.position).not.toBe("QB");
    expect(rec12.queue.every((p) => p.position === "RB")).toBe(true);
    expect(rec12.queue.every((p) => RB12.includes(p.id))).toBe(true);
    expect(rec12.queue.some((p) => p.id === "brock-bowers")).toBe(false);
    expect(rec12.queue.some((p) => p.id === "josh-allen")).toBe(false);
    expect(rec12.queue.some((p) => p.id === "josh-jacobs")).toBe(false);
    expect(rec12.player!.id).toBe("christian-mccaffrey");

    expect(rec13.player!.id).toBe("christian-mccaffrey");
    expect(rec13.windowId).toBe("r1r2");
  });

  it("takes TWO remaining RBs from the pile across 12 then 13", () => {
    const taken = gableTaken();
    const first = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 12,
      teams: 12,
    });
    taken.add(first.player!.id);
    const second = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 13,
      teams: 12,
    });

    expect(RB12).toContain(first.player!.id);
    expect(RB12).toContain(second.player!.id);
    expect(first.player!.id).not.toBe(second.player!.id);
    expect(second.player!.position).toBe("RB");
    expect(["TE", "QB"]).not.toContain(second.player!.position);
    expect(second.player!.id).toBe("james-cook");
  });

  it("never recommends TE at 36/37", () => {
    const taken = gableTaken();
    const rec = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 36,
      teams: 12,
    });
    expect(rec.player).not.toBeNull();
    expect(rec.player!.position).not.toBe("TE");
    expect(rec.queue.every((p) => p.position !== "TE")).toBe(true);
  });

  it("fades Jacobs even if he is the only remaining early RB", () => {
    const taken = new Set(players.filter((p) => p.id !== "josh-jacobs").map((p) => p.id));
    const rec = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 12,
      teams: 12,
    });
    expect(rec.player?.id).not.toBe("josh-jacobs");
  });
});

describe("Cobra rec engine — slot is drawn, never assumed 3", () => {
  it("slot 3 R1 prefers leftover Gibbs/Bijan/Chase", () => {
    const rec = recommendCobra({
      rules: rules.cobra,
      players,
      takenIds: new Set(),
      overallPick: 3,
      teams: 12,
      rounds: 16,
      benSlot: 3,
    });
    expect(["jahmyr-gibbs", "bijan-robinson", "jamarr-chase"]).toContain(rec.player!.id);
    expect(rec.windowId).toBe("cobra-slot3-r1");
  });

  it("slot 3 R1 falls to Taylor/Nacua when the top 3 are gone", () => {
    const rec = recommendCobra({
      rules: rules.cobra,
      players,
      takenIds: new Set(["jahmyr-gibbs", "bijan-robinson", "jamarr-chase"]),
      overallPick: 3,
      teams: 12,
      rounds: 16,
      benSlot: 3,
    });
    expect(["jonathan-taylor", "puka-nacua"]).toContain(rec.player!.id);
  });

  it("does not recommend Josh Allen in round 2", () => {
    const rec = recommendCobra({
      rules: rules.cobra,
      players,
      takenIds: new Set(),
      overallPick: 22,
      teams: 12,
      rounds: 16,
      benSlot: 3,
    });
    expect(rec.player!.id).not.toBe("josh-allen");
    expect(rec.queue.every((p) => p.id !== "josh-allen")).toBe(true);
    expect(["RB", "WR"]).toContain(rec.player!.position);
  });

  it("recommendNext uses the drawn slot, not a hardcoded 3", () => {
    const slot12Pick = recommendNext({
      league: cobra,
      gable: rules.gable,
      cobra: rules.cobra,
      players,
      takenIds: new Set(),
      overallPick: 12,
      benSlot: 12,
    });
    const slot1Pick = recommendNext({
      league: cobra,
      gable: rules.gable,
      cobra: rules.cobra,
      players,
      takenIds: new Set(),
      overallPick: 1,
      benSlot: 1,
    });
    expect(slot12Pick.windowId).not.toBe("cobra-slot3-r1");
    expect(slot1Pick.windowId).not.toBe("cobra-slot3-r1");
    expect(isBenTurn(12, 12, 12)).toBe(true);
    expect(isBenTurn(1, 12, 1)).toBe(true);
    expect(isBenTurn(3, 12, 12)).toBe(false);
  });
});

describe("Gable keepers occupy board cells", () => {
  it("locks all 24 keepers at their round cost", () => {
    const nums = keeperPickNumbers(keepersFile.gable, gable.draftOrder, gable.teams);
    expect(keepersFile.gable).toHaveLength(24);
    expect(nums.size).toBe(24);
    expect(nums.has(overallPickFor(1, 1, 12))).toBe(true); // Big Weiner Gibbs R1
    expect(nums.has(overallPickFor(2, 1, 12))).toBe(true); // GirthQuake Chase R1
    expect(nums.has(overallPickFor(12, 4, 12))).toBe(true); // Ben Bowers R4 = 37
    expect(overallPickFor(12, 4, 12)).toBe(37);
    expect(overallPickFor(12, 9, 12)).toBe(108);
  });
});
