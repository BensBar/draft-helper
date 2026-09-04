import { describe, expect, it } from "vitest";
import recRules from "../../data/rec-rules.json";
import keepersFile from "../../data/keepers.json";
import playersFile from "../../data/players.json";
import scenariosGableFile from "../../data/scenarios-gable.json";
import scenariosCobraFile from "../../data/scenarios-cobra.json";
import { overallPickFor } from "./snake";
import { allResolvedPlayers, resolveScenario, type ScenarioTree } from "./scenarios";
import type { Player, RecRulesFile } from "./types";

const gable = scenariosGableFile as ScenarioTree;
const cobra = scenariosCobraFile as ScenarioTree;
const players = playersFile.players as Player[];
const rules = recRules as RecRulesFile;

const PILE = [
  "james-cook",
  "derrick-henry",
  "christian-mccaffrey",
  "saquon-barkley",
  "chase-brown",
  "omarion-hampton",
  "ashton-jeanty",
];
const NEVER_1213 = new Set(["josh-jacobs", "jonathan-taylor", "kaleb-johnson"]);

function idsAt(nodeId: string, overall: number): string[] {
  const r = resolveScenario(gable, nodeId, players);
  return r.slots.filter((s) => s.overall === overall).flatMap((s) => s.players.map((p) => p.id));
}

function playersAt(nodeId: string): Player[] {
  return allResolvedPlayers(resolveScenario(gable, nodeId, players));
}

describe("Gable live-pick map", () => {
  it("treats 36 as a single live pick and skips Bowers 37 + Burden 108", () => {
    expect(gable.livePicks).toEqual([12, 13, 36, 60, 61, 84, 85, 109, 132, 133, 156, 157, 180, 181, 204]);
    expect(gable.livePicks).not.toContain(37);
    expect(gable.livePicks).not.toContain(108);
    expect(gable.keeperSkips.map((k) => k.overall).sort((a, b) => a - b)).toEqual([37, 108]);
    expect(gable.keeperSkips.find((k) => k.overall === 37)?.playerId).toBe("brock-bowers");
    expect(gable.keeperSkips.find((k) => k.overall === 108)?.playerId).toBe("luther-burden");
    expect(overallPickFor(12, 4, 12)).toBe(37);
    expect(overallPickFor(12, 9, 12)).toBe(108);
    expect(keepersFile.gable.some((k) => k.playerId === "brock-bowers" && k.round === 4)).toBe(true);
    expect(keepersFile.gable.some((k) => k.playerId === "luther-burden" && k.round === 9)).toBe(true);
  });

  it("S-36 pages are a single pick at 36, never a 36/37 pair", () => {
    for (const id of ["s-36-default", "s-36-wr-fallers", "s-36-rb-run"]) {
      const node = gable.nodes.find((n) => n.id === id)!;
      expect(node.picks.map((p) => p.overall)).toEqual([36]);
      expect(node.picks.some((p) => p.overall === 37)).toBe(false);
    }
  });
});

describe("S1–S5 locked 12/13", () => {
  it("never picks Jacobs, Taylor, TE, or QB at 12/13", () => {
    for (const id of ["s1", "s2", "s3", "s4", "s5"]) {
      const r = resolveScenario(gable, id, players);
      const early = r.slots.filter((s) => s.overall === 12 || s.overall === 13).flatMap((s) => s.players);
      expect(early.length).toBeGreaterThan(0);
      for (const p of early) {
        expect(NEVER_1213.has(p.id), `${id} ${p.id}`).toBe(false);
        expect(["TE", "QB"]).not.toContain(p.position);
      }
    }
  });

  it("S1 takes Cook then next leftover Cook/Henry/CMC/Saquon/Chase Brown", () => {
    expect(idsAt("s1", 12)).toEqual(["james-cook"]);
    expect(idsAt("s1", 13)).toEqual(["derrick-henry"]);
    expect(playersAt("s1").every((p) => PILE.includes(p.id))).toBe(true);
  });

  it("S2 never takes ARSB over Saquon or Chase Brown", () => {
    expect(idsAt("s2", 12)).toEqual(["saquon-barkley"]);
    expect(idsAt("s2", 13)).toEqual(["chase-brown"]);
    expect(playersAt("s2").map((p) => p.id)).not.toContain("amon-ra-st-brown");
  });

  it("S3 still takes two pile RBs", () => {
    expect(idsAt("s3", 12)).toEqual(["james-cook"]);
    expect(idsAt("s3", 13)).toEqual(["derrick-henry"]);
    expect(playersAt("s3").every((p) => PILE.includes(p.id) && p.position === "RB")).toBe(true);
  });

  it("S4 is Hampton then Jeanty", () => {
    expect(idsAt("s4", 12)).toEqual(["omarion-hampton"]);
    expect(idsAt("s4", 13)).toEqual(["ashton-jeanty"]);
  });

  it("does not stash Kaleb Johnson anywhere in Gable scenarios", () => {
    for (const node of gable.nodes) {
      const ids = allResolvedPlayers(resolveScenario(gable, node.id, players)).map((p) => p.id);
      expect(ids, node.id).not.toContain("kaleb-johnson");
    }
  });
});

describe("S60 / S180", () => {
  it("S60 prefers Price over Tuten when both are available", () => {
    const tuten = players.find((p) => p.id === "bhayshul-tuten")!;
    const price = players.find((p) => p.id === "jadarian-price")!;
    expect(tuten.adp).toBeLessThan(price.adp);
    expect(idsAt("s-60-default", 60)).toEqual(["jadarian-price"]);
    expect(idsAt("s-60-default", 61)).toEqual(["bhayshul-tuten"]);
  });

  it("S60-jeanty never spends 60/61 on Washington Jr", () => {
    expect(playersAt("s-60-jeanty-owner").map((p) => p.id)).not.toContain("mike-washington-jr");
    const node = gable.nodes.find((n) => n.id === "s-60-jeanty-owner")!;
    expect(node.picks.every((p) => p.never?.includes("mike-washington-jr"))).toBe(true);
  });

  it("S180 never takes DEN DST", () => {
    const ids = playersAt("s-180").map((p) => p.id);
    expect(ids).not.toContain("den-dst");
    const node = gable.nodes.find((n) => n.id === "s-180")!;
    expect(node.picks.every((p) => p.never?.includes("den-dst"))).toBe(true);
  });
});

describe("Rec-engine from-lists stay locked", () => {
  it("does not change the 12/13 pile or 60/61 pair", () => {
    expect(rules.gable.windows.find((w) => w.id === "r1r2")?.from).toEqual([
      "christian-mccaffrey",
      "james-cook",
      "chase-brown",
      "derrick-henry",
      "saquon-barkley",
      "omarion-hampton",
      "ashton-jeanty",
    ]);
    expect(rules.gable.windows.find((w) => w.id === "r5r6")?.from).toEqual([
      "bhayshul-tuten",
      "jadarian-price",
    ]);
  });
});

describe("Cobra slot tree", () => {
  it("does not hardcode pick 3 as the default path", () => {
    expect(cobra.rootId).toBe("cobra-0");
    expect(cobra.nodes.find((n) => n.id === cobra.rootId)?.trigger).toMatch(/drawn at kickoff/i);
    expect(cobra.subtitle).toMatch(/never hardcode pick 3/i);
    expect(cobra.nodes.find((n) => n.id === "cobra-slot-3")).toBeTruthy();
    const r2 = resolveScenario(cobra, "cobra-r2", players);
    expect(r2.slots.flatMap((s) => s.players).every((p) => p.id !== "josh-allen")).toBe(true);
    expect(r2.slots.flatMap((s) => s.players).every((p) => p.id !== "josh-jacobs")).toBe(true);
    expect(r2.slots.flatMap((s) => s.players).every((p) => p.id !== "kaleb-johnson")).toBe(true);
    expect(r2.node.picks[0]?.label).toMatch(/not pick 3/i);
  });

  it("has a 1–12 slot page with snake overalls and named piles", () => {
    for (let slot = 1; slot <= 12; slot++) {
      const node = cobra.nodes.find((n) => n.id === `cobra-slot-${slot}`);
      expect(node, `slot ${slot}`).toBeTruthy();
      expect(node!.picks[0]?.overall).toBe(slot);
      const r2 = slot === 12 ? 13 : 25 - slot;
      expect(node!.picks[1]?.overall).toBe(r2);
      expect(node!.why).toMatch(/Jahmyr Gibbs|Bijan Robinson|Ja'Marr Chase|Jonathan Taylor|Puka Nacua|James Cook|Saquon Barkley/);
      expect(node!.why).not.toMatch(/\ba WR\b/);
    }
    const slot1 = resolveScenario(cobra, "cobra-slot-1", players);
    expect(slot1.slots[0]?.players[0]?.id).toBe("jahmyr-gibbs");
    const slot12 = resolveScenario(cobra, "cobra-slot-12", players);
    expect(slot12.slots[0]?.overall).toBe(12);
    expect(slot12.slots[1]?.overall).toBe(13);
  });

  it("never recommends Jacobs, Allen in R2, or Kaleb anywhere", () => {
    for (const node of cobra.nodes) {
      const resolved = resolveScenario(cobra, node.id, players);
      const ids = allResolvedPlayers(resolved).map((p) => p.id);
      expect(ids, node.id).not.toContain("josh-jacobs");
      expect(ids, node.id).not.toContain("kaleb-johnson");
    }
    const r2 = allResolvedPlayers(resolveScenario(cobra, "cobra-r2", players)).map((p) => p.id);
    expect(r2).not.toContain("josh-allen");
    for (let slot = 1; slot <= 12; slot++) {
      const second = resolveScenario(cobra, `cobra-slot-${slot}`, players).slots[1];
      expect(second.players.every((p) => p.id !== "josh-allen"), `slot ${slot} R2`).toBe(true);
    }
  });
});
