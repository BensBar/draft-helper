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

/** CBS 8/31 must-write ADP order among the locked 12/13 pile. */
const RB12_ADP = [
  "james-cook",
  "derrick-henry",
  "christian-mccaffrey",
  "saquon-barkley",
  "chase-brown",
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
    expect(new Set(rec12.queue.map((p) => p.id))).toEqual(new Set(RB12));
    expect(rec12.queue.map((p) => p.id)).toEqual(RB12_ADP);
    expect(rec12.queue.some((p) => p.id === "ashton-jeanty")).toBe(true);
    expect(rec12.queue.some((p) => p.id === "jonathan-taylor")).toBe(false);
    expect(rec12.queue.some((p) => p.id === "josh-jacobs")).toBe(false);
    expect(rec12.queue.some((p) => p.id === "kaleb-johnson")).toBe(false);
    expect(rec12.player!.id).toBe("james-cook");

    expect(rec13.player!.id).toBe("james-cook");
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
    expect(second.player!.id).toBe("derrick-henry");
  });

  it("doorstep after Cook/Henry/CMC are gone is Saquon then Chase Brown", () => {
    const taken = gableTaken();
    taken.add("james-cook");
    taken.add("derrick-henry");
    taken.add("christian-mccaffrey");
    const rec = recommendGable({
      rules: rules.gable,
      players,
      takenIds: taken,
      overallPick: 12,
      teams: 12,
    });
    expect(rec.player!.id).toBe("saquon-barkley");
    expect(rec.queue.map((p) => p.id).slice(0, 2)).toEqual(["saquon-barkley", "chase-brown"]);
  });

  it("reorders the locked pile by ADP without changing who is eligible", () => {
    const flipped = players.map((p) =>
      p.id === "ashton-jeanty" ? { ...p, adp: 0.5, overallRank: 1 } : p.id === "james-cook" ? { ...p, adp: 99 } : p,
    );
    const rec = recommendGable({
      rules: rules.gable,
      players: flipped,
      takenIds: gableTaken(),
      overallPick: 12,
      teams: 12,
    });
    expect(new Set(rec.queue.map((p) => p.id))).toEqual(new Set(RB12));
    expect(rec.player!.id).toBe("ashton-jeanty");
    expect(rec.queue.every((p) => p.id !== "josh-jacobs")).toBe(true);
    expect(rec.queue.every((p) => p.position !== "TE")).toBe(true);
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

  it("never recommends Kaleb Johnson", () => {
    const taken = new Set(players.filter((p) => p.id !== "kaleb-johnson").map((p) => p.id));
    for (const overall of [12, 13, 36, 60, 85, 192]) {
      const rec = recommendGable({
        rules: rules.gable,
        players,
        takenIds: taken,
        overallPick: overall,
        teams: 12,
      });
      expect(rec.player?.id).not.toBe("kaleb-johnson");
      expect(rec.queue.every((p) => p.id !== "kaleb-johnson")).toBe(true);
    }
  });

  it("fades Jacobs even if he is the only remaining early RB", () => {
    const taken = new Set(players.filter((p) => p.id !== "josh-jacobs").map((p) => p.id));
    for (const overall of [12, 13, 36, 60, 85, 192]) {
      const rec = recommendGable({
        rules: rules.gable,
        players,
        takenIds: taken,
        overallPick: overall,
        teams: 12,
      });
      expect(rec.player?.id).not.toBe("josh-jacobs");
      expect(rec.queue.every((p) => p.id !== "josh-jacobs")).toBe(true);
    }
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

  it("never recommends Kaleb Johnson even if he is the only RB left", () => {
    const taken = new Set(players.filter((p) => p.id !== "kaleb-johnson").map((p) => p.id));
    const rec = recommendCobra({
      rules: rules.cobra,
      players,
      takenIds: taken,
      overallPick: 22,
      teams: 12,
      rounds: 16,
      benSlot: 3,
    });
    expect(rec.player?.id).not.toBe("kaleb-johnson");
  });

  it("never recommends Jacobs even if he falls", () => {
    const taken = new Set(players.filter((p) => p.id !== "josh-jacobs").map((p) => p.id));
    for (const overall of [3, 22, 27, 50, 80, 180]) {
      const rec = recommendCobra({
        rules: rules.cobra,
        players,
        takenIds: taken,
        overallPick: overall,
        teams: 12,
        rounds: 16,
        benSlot: 3,
      });
      expect(rec.player?.id).not.toBe("josh-jacobs");
      expect(rec.queue.every((p) => p.id !== "josh-jacobs")).toBe(true);
    }
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

describe("Locked rec-rule from-lists", () => {
  it("does not change the 12/13 pile, 36/37 list, or 60/61 pair", () => {
    expect(rules.gable.windows.find((w) => w.id === "r1r2")?.from).toEqual(RB12);
    expect(rules.gable.windows.find((w) => w.id === "r3r4")?.from).toEqual([
      "amon-ra-st-brown",
      "ceedee-lamb",
      "justin-jefferson",
      "drake-london",
      "aj-brown",
      "rashee-rice",
      "nico-collins",
      "malik-nabers",
      "derrick-henry",
    ]);
    expect(rules.gable.windows.find((w) => w.id === "r5r6")?.from).toEqual([
      "bhayshul-tuten",
      "jadarian-price",
    ]);
    expect(rules.gable.windows.find((w) => w.id === "r8plus")?.from).toContain("marshawn-lloyd");
    expect(rules.gable.windows.find((w) => w.id === "r8plus")?.from).not.toContain("kaleb-johnson");
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
