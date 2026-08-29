import { describe, expect, it } from "vitest";
import keepersFile from "../../data/keepers.json";
import leaguesFile from "../../data/leagues.json";
import { firstLivePick, keeperOverallPick, keeperPicks } from "./keepers";
import type { League } from "./types";

const gable = (leaguesFile.leagues as League[]).find((l) => l.id === "gable")!;

describe("keeper placement", () => {
  it("places Big Weiner Gibbs+Bijan on R1 and R2", () => {
    const gibbs = keepersFile.gable.find((k) => k.playerId === "jahmyr-gibbs")!;
    const bijan = keepersFile.gable.find((k) => k.playerId === "bijan-robinson")!;
    expect(keeperOverallPick(gibbs, gable.draftOrder, 12)).toBe(1);
    expect(keeperOverallPick(bijan, gable.draftOrder, 12)).toBe(24);
  });

  it("places GirthQuake Chase+Taylor on R1 and R2", () => {
    const chase = keepersFile.gable.find((k) => k.playerId === "jamarr-chase")!;
    const taylor = keepersFile.gable.find((k) => k.playerId === "jonathan-taylor")!;
    expect(keeperOverallPick(chase, gable.draftOrder, 12)).toBe(2);
    expect(keeperOverallPick(taylor, gable.draftOrder, 12)).toBe(23);
  });

  it("starts the live board at pick 3 after two R1 keepers", () => {
    const picks = keeperPicks(keepersFile.gable, gable.draftOrder, 12);
    const nums = new Set(picks.map((p) => p.overallPick));
    expect(firstLivePick(12, 17, nums)).toBe(3);
  });

  it("Ben's R4 Bowers and R9 Burden are keeper cells", () => {
    const bowers = keepersFile.gable.find((k) => k.playerId === "brock-bowers")!;
    const burden = keepersFile.gable.find((k) => k.playerId === "luther-burden")!;
    expect(keeperOverallPick(bowers, gable.draftOrder, 12)).toBe(37);
    expect(keeperOverallPick(burden, gable.draftOrder, 12)).toBe(108);
  });
});
