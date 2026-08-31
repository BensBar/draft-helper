import { describe, expect, it } from "vitest";
import keepersFile from "../../data/keepers.json";
import leaguesFile from "../../data/leagues.json";
import playersFile from "../../data/players.json";
import { buildBookmarkletHref } from "./cbs-bookmarklet";
import {
  allowedSyncOrigin,
  applyCbsPicks,
  isCbsSyncPayload,
  matchPlayerName,
  normalizeName,
  parsePastedNames,
} from "./cbs-sync";
import { keeperPickNumbers, keeperPicks } from "./keepers";
import type { League, Player } from "./types";

const players = playersFile.players as Player[];
const gable = (leaguesFile.leagues as League[]).find((l) => l.id === "gable")!;
const keeperIds = new Set(keepersFile.gable.map((k) => k.playerId));
const keeperNums = keeperPickNumbers(keepersFile.gable, gable.draftOrder, gable.teams);

describe("name matching", () => {
  it("normalizes punctuation, suffixes, and positions", () => {
    expect(normalizeName("Ja'Marr Chase")).toBe("jamarr chase");
    expect(normalizeName("A.J. Brown WR PHI")).toBe("a j brown");
    expect(normalizeName("Kenneth Walker III")).toBe("kenneth walker");
    expect(normalizeName("Broncos D/ST")).toBe("broncos");
  });

  it("matches CBS-style variants to players.json", () => {
    expect(matchPlayerName("Christian McCaffrey", players)?.id).toBe("christian-mccaffrey");
    expect(matchPlayerName("CMC", players)?.id).toBe("christian-mccaffrey");
    expect(matchPlayerName("Ja'Marr Chase", players)?.id).toBe("jamarr-chase");
    expect(matchPlayerName("A.J. Brown", players)?.id).toBe("aj-brown");
    expect(matchPlayerName("Amon-Ra St. Brown", players)?.id).toBe("amon-ra-st-brown");
    expect(matchPlayerName("De'Von Achane", players)?.id).toBe("devon-achane");
    expect(matchPlayerName("Kenneth Walker III RB", players)?.id).toBe("kenneth-walker");
    expect(matchPlayerName("Jaxon Smith-Njigba", players)?.id).toBe("jaxon-smith-njigba");
    expect(matchPlayerName("Josh Jacobs", players)?.id).toBe("josh-jacobs");
    expect(matchPlayerName("Broncos", players)?.id).toBe("den-dst");
    expect(matchPlayerName("DEN DST", players)?.id).toBe("den-dst");
    expect(matchPlayerName("Denver", players)?.id).toBe("den-dst");
  });

  it("does not invent a match for garbage", () => {
    expect(matchPlayerName("Totally Fake Guy", players)).toBeNull();
    expect(matchPlayerName("Brown", players)).toBeNull();
  });
});

describe("parsePastedNames", () => {
  it("accepts numbered lines and comma lists", () => {
    const names = parsePastedNames(`1. Christian McCaffrey
2) James Cook
Chase Brown
`);
    expect(names).toEqual(["Christian McCaffrey", "James Cook", "Chase Brown"]);
  });
});

describe("applyCbsPicks — idempotent live ingest", () => {
  const keepersOnBoard = keeperPicks(keepersFile.gable, gable.draftOrder, 12);
  const firstKeepers = keepersOnBoard
    .filter((p) => p.overallPick <= 2)
    .sort((a, b) => a.overallPick - b.overallPick)
    .map((p) => players.find((pl) => pl.id === p.playerId)!.name);

  it("skips keepers and fills live slots in order", () => {
    const names = [...firstKeepers, "Nico Collins", "A.J. Brown"];
    const once = applyCbsPicks({
      names,
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(once.skippedKeepers.length).toBeGreaterThanOrEqual(2);
    expect(once.livePicks.map((p) => p.playerId)).toEqual(["nico-collins", "aj-brown"]);
    expect(once.livePicks[0]!.overallPick).toBe(3);
    expect(once.livePicks[1]!.overallPick).toBe(4);
    expect(once.livePicks.every((p) => p.source === "sync")).toBe(true);
    expect(once.livePicks.every((p) => !keeperIds.has(p.playerId))).toBe(true);
    expect(once.livePicks.every((p) => !keeperNums.has(p.overallPick))).toBe(true);
  });

  it("replay of the same CBS board replaces live picks identically", () => {
    const names = ["Christian McCaffrey", "James Cook", "Chase Brown"];
    const a = applyCbsPicks({
      names,
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    const b = applyCbsPicks({
      names,
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(a.livePicks).toEqual(b.livePicks);
    expect(a.unmatched).toEqual([]);
  });

  it("a longer replay grows the live list; a shorter replay is the new truth", () => {
    const short = applyCbsPicks({
      names: ["Christian McCaffrey"],
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    const longer = applyCbsPicks({
      names: ["Christian McCaffrey", "James Cook"],
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(short.livePicks).toHaveLength(1);
    expect(longer.livePicks).toHaveLength(2);
    expect(longer.livePicks[0]!.playerId).toBe("christian-mccaffrey");
    expect(longer.livePicks[1]!.playerId).toBe("james-cook");
  });

  it("flags unmatched names and does not invent player ids", () => {
    const result = applyCbsPicks({
      names: ["Christian McCaffrey", "Not A Real Player", "James Cook"],
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(result.unmatched).toEqual(["Not A Real Player"]);
    expect(result.livePicks.map((p) => p.playerId)).toEqual([
      "christian-mccaffrey",
      "james-cook",
    ]);
    expect(result.livePicks[1]!.overallPick).toBe(4);
  });

  it("honors overall pick numbers and never writes keepers", () => {
    const result = applyCbsPicks({
      names: ["Jahmyr Gibbs", "Nico Collins"],
      overalls: [1, 3],
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(result.livePicks).toHaveLength(1);
    expect(result.livePicks[0]).toEqual({
      overallPick: 3,
      playerId: "nico-collins",
      source: "sync",
    });
    expect(result.skippedKeepers).toContain("Jahmyr Gibbs");
  });

  it("does not re-ingest a keeper as a live pick even if CBS lists them later", () => {
    const result = applyCbsPicks({
      names: ["Brock Bowers", "Luther Burden III"],
      players,
      keeperPlayerIds: keeperIds,
      keeperPickNums: keeperNums,
      teams: 12,
      rounds: 17,
    });
    expect(result.livePicks).toEqual([]);
    expect(result.skippedKeepers.length).toBe(2);
  });
});

describe("payload guard", () => {
  it("accepts only the typed sync message", () => {
    expect(isCbsSyncPayload({ type: "bensbar-draft-sync", version: 1, names: ["x"], source: "paste" })).toBe(
      true,
    );
    expect(isCbsSyncPayload({ type: "nope", version: 1, names: ["x"] })).toBe(false);
    expect(isCbsSyncPayload(null)).toBe(false);
  });

  it("allows CBS draft hosts, Pages, and localhost — not random sites", () => {
    expect(allowedSyncOrigin("https://gable.football.cbssports.com")).toBe(true);
    expect(allowedSyncOrigin("https://ck22.football.cbssports.com")).toBe(true);
    expect(allowedSyncOrigin("https://bensbar.github.io")).toBe(true);
    expect(allowedSyncOrigin("http://localhost:3000")).toBe(true);
    expect(allowedSyncOrigin("https://evil.example")).toBe(false);
  });

  it("bookmarklet is a javascript: URL aimed at the companion origin", () => {
    const href = buildBookmarkletHref({
      companionUrl: "https://bensbar.github.io/draft-helper/",
      origin: "https://bensbar.github.io",
      relay: "https://bensbar.github.io/draft-helper/sync-relay.html",
    });
    expect(href.startsWith("javascript:")).toBe(true);
    expect(decodeURIComponent(href)).toContain("bensbar-draft-sync");
    expect(decodeURIComponent(href)).toContain("bensbar.github.io");
  });
});
