import { describe, expect, it } from "vitest";
import leaguesFile from "../../data/leagues.json";
import metaFile from "../../data/meta.json";
import adpSourcesFile from "../../data/adp-sources.json";
import { defaultAdpSourceForLeague, type AdpSourcesFile } from "./adp";
import { defaultLeagueId } from "./data";
import type { League, Meta } from "./types";

const leagues = leaguesFile.leagues as League[];
const meta = metaFile as Meta;
const catalog = adpSourcesFile as AdpSourcesFile;
const cobra = leagues.find((l) => l.id === "cobra")!;
const gable = leagues.find((l) => l.id === "gable")!;

describe("league defaults after Gable night", () => {
  it("switches the landing league to Cobra after 9/3/2026", () => {
    expect(meta.gableDefaultUntil).toBe("2026-09-03");
    expect(meta.defaultLeagueId).toBe("cobra");
    expect(defaultLeagueId(new Date("2026-09-03T23:00:00-04:00"))).toBe("gable");
    expect(defaultLeagueId(new Date("2026-09-04T00:00:00-04:00"))).toBe("cobra");
    expect(defaultLeagueId(new Date("2026-09-10T17:00:00-04:00"))).toBe("cobra");
  });

  it("keeps Cobra slot unknown and never hardcodes pick 3", () => {
    expect(cobra.benSlot).toBeNull();
    expect(cobra.slotIsDrawn).toBe(true);
    expect(cobra.rounds).toBe(16);
    expect(cobra.buyIn).toBe(165);
    expect(cobra.scoring.passTd).toBe(6);
    expect(cobra.scoring.reception).toBe(0.5);
    expect(gable.benSlot).toBe(12);
    expect(gable.rounds).toBe(17);
  });

  it("defaults Cobra ADP to CBS Non-PPR and Gable to Gil 8/31", () => {
    expect(catalog.leagueDefaults?.cobra).toBe("cbs-public");
    expect(catalog.leagueDefaults?.gable).toBe("gil");
    expect(defaultAdpSourceForLeague(catalog, "cobra")).toBe("cbs-public");
    expect(defaultAdpSourceForLeague(catalog, "gable")).toBe("gil");
    const cbs = catalog.sources.find((s) => s.id === "cbs-public")!;
    expect(cbs.scoring).toBe("Non-PPR");
    expect(cbs.fetched).toBe("2026-09-04");
    expect(cbs.label).toMatch(/Non-PPR/);
    const ppr = catalog.sources.find((s) => s.id === "cbs-ppr")!;
    expect(ppr.status).toBe("ok");
    expect(ppr.scoring).toBe("PPR");
  });
});
