import { describe, expect, it } from "vitest";
import playersFile from "../../data/players.json";
import { availableFromQueue, parseRankedQueue, prequeueWhy } from "./prequeue";
import type { Player } from "./types";

const players = playersFile.players as Player[];

describe("ranked pre-queue", () => {
  it("loads a pasted ranked list and strips Jacobs / Kaleb Johnson", () => {
    const parsed = parseRankedQueue(
      "Jahmyr Gibbs\nJosh Jacobs\nBijan Robinson\nKaleb Johnson\nPuka Nacua\nNobody McGhost",
      players,
    );
    expect(parsed.matched.map((p) => p.id)).toEqual([
      "jahmyr-gibbs",
      "bijan-robinson",
      "puka-nacua",
    ]);
    expect(parsed.faded.map((p) => p.id)).toEqual(["josh-jacobs", "kaleb-johnson"]);
    expect(parsed.unmatched).toContain("Nobody McGhost");
    const why = prequeueWhy(parsed.matched);
    expect(why).toMatch(/Jahmyr Gibbs/);
    expect(why).toMatch(/Bijan Robinson/);
    expect(why).not.toMatch(/\ba WR\b/);
  });

  it("skips taken names so the robot queue advances", () => {
    const parsed = parseRankedQueue("Jahmyr Gibbs\nBijan Robinson\nJa'Marr Chase", players);
    const next = availableFromQueue(parsed.matched, new Set(["jahmyr-gibbs"]));
    expect(next[0]?.id).toBe("bijan-robinson");
    expect(next.every((p) => p.id !== "josh-jacobs")).toBe(true);
  });
});
