import { describe, expect, it } from "vitest";
import playersFile from "../../data/players.json";
import adpSourcesFile from "../../data/adp-sources.json";
import adpGil from "../../data/adp-gil.json";
import adpEspn from "../../data/adp-espn.json";
import adpYahoo from "../../data/adp-yahoo.json";
import adpFantasypros from "../../data/adp-fantasypros.json";
import adpSleeper from "../../data/adp-sleeper.json";
import adpCbsPublic from "../../data/adp-cbs-public.json";
import {
  applyAdpSource,
  defaultAdpSourceForLeague,
  rankedPlayersForSource,
  resolveAdpSourceId,
  type AdpBoard,
  type AdpSourcesFile,
} from "./adp";
import type { Player } from "./types";

const players = playersFile.players as Player[];
const catalog = adpSourcesFile as AdpSourcesFile;
const boards: Record<string, AdpBoard> = {
  gil: adpGil as AdpBoard,
  espn: adpEspn as AdpBoard,
  yahoo: adpYahoo as AdpBoard,
  fantasypros: adpFantasypros as AdpBoard,
  sleeper: adpSleeper as AdpBoard,
};

const MUST: Record<string, number> = {
  "james-cook": 7.3,
  "derrick-henry": 7.77,
  "christian-mccaffrey": 8.03,
  "amon-ra-st-brown": 11.86,
  "saquon-barkley": 11.95,
  "chase-brown": 12.81,
  "omarion-hampton": 19.17,
  "ashton-jeanty": 21.93,
  "josh-jacobs": 37.84,
  "drake-london": 24.22,
  "aj-brown": 23.72,
  "ceedee-lamb": 18.19,
  "justin-jefferson": 19.86,
  "rashee-rice": 27.34,
  "malik-nabers": 35.66,
  "bhayshul-tuten": 51.05,
  "jadarian-price": 52.7,
  "jk-dobbins": 74.12,
  "marshawn-lloyd": 106.57,
  "carnell-tate": 100.79,
  "mike-washington-jr": 122.97,
  "kaleb-johnson": 213,
};

describe("default Gil / CBS 8/31 board", () => {
  it("stores Gil's must-write CBS ADP and fades Kaleb", () => {
    expect(playersFile.fetched).toBe("2026-08-31");
    expect(catalog.defaultSourceId).toBe("gil");
    for (const [id, adp] of Object.entries(MUST)) {
      const p = players.find((x) => x.id === id);
      expect(p, id).toBeTruthy();
      expect(p!.adp).toBe(adp);
    }
    expect(players.find((p) => p.id === "kaleb-johnson")?.fade).toBe(true);
    expect(players.find((p) => p.id === "josh-jacobs")?.fade).toBe(true);
    expect(players.find((p) => p.id === "jadarian-price")?.nflTeam).toBe("SEA");
    expect(players.find((p) => p.id === "ashton-jeanty")?.injury).toMatch(/ankle/i);
    expect(players.find((p) => p.id === "malik-nabers")?.injury).toMatch(/ACL/i);
  });

  it("gil source leaves the default board untouched", () => {
    const ranked = rankedPlayersForSource(players, catalog, boards, "gil");
    expect(ranked).toBe(players);
    expect(ranked.find((p) => p.id === "james-cook")?.adp).toBe(7.3);
  });
});

describe("source overlay", () => {
  it("changes ADP of matched names and keeps Gil numbers for misses", () => {
    const board: AdpBoard = {
      id: "test",
      source: "test",
      fetched: "2026-08-31",
      scoring: "PPR",
      status: "ok",
      playerCount: 2,
      players: [
        { name: "Ashton Jeanty", adp: 1.1, overallRank: 1 },
        { name: "Nobody McGhost", adp: 2, overallRank: 2 },
      ],
    };
    const ranked = applyAdpSource(players, board);
    expect(ranked.find((p) => p.id === "ashton-jeanty")?.adp).toBe(1.1);
    expect(ranked.find((p) => p.id === "james-cook")?.adp).toBe(7.3);
  });

  it("does not apply skipped boards or invent numbers", () => {
    expect(adpFantasypros.status).toBe("skipped");
    expect(adpSleeper.status).toBe("skipped");
    expect((adpFantasypros as AdpBoard).players).toHaveLength(0);
    expect((adpSleeper as AdpBoard).players).toHaveLength(0);
    expect(resolveAdpSourceId(catalog, "fantasypros")).toBe("gil");
    expect(resolveAdpSourceId(catalog, "sleeper")).toBe("gil");
    expect(resolveAdpSourceId(catalog, "fantasypros", "cobra")).toBe("cbs-public");
    expect(defaultAdpSourceForLeague(catalog, "cobra")).toBe("cbs-public");
    expect((adpCbsPublic as AdpBoard).scoring).toBe("Non-PPR");
    expect((adpCbsPublic as AdpBoard).fetched).toBe("2026-09-05");
    expect((adpCbsPublic as AdpBoard).url).toBe(
      "https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/",
    );
    const ranked = rankedPlayersForSource(players, catalog, boards, "fantasypros");
    expect(ranked.find((p) => p.id === "james-cook")?.adp).toBe(7.3);
  });

  it("consensus blends only ok unique publishers", () => {
    const blended = catalog.sources.filter((s) => s.status === "ok" && s.blend).map((s) => s.id);
    expect(blended).toEqual(["gil", "espn", "yahoo"]);
    expect(blended).not.toContain("fantasypros");
    expect(blended).not.toContain("sleeper");
    expect(blended).not.toContain("cbs-public");
  });
});
