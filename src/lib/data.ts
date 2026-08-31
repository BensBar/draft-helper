import leaguesFile from "../../data/leagues.json";
import playersFile from "../../data/players.json";
import keepersFile from "../../data/keepers.json";
import metaFile from "../../data/meta.json";
import recRulesFile from "../../data/rec-rules.json";
import adpSourcesFile from "../../data/adp-sources.json";
import adpGil from "../../data/adp-gil.json";
import adpCbsPublic from "../../data/adp-cbs-public.json";
import adpFantasypros from "../../data/adp-fantasypros.json";
import adpEspn from "../../data/adp-espn.json";
import adpSleeper from "../../data/adp-sleeper.json";
import adpYahoo from "../../data/adp-yahoo.json";
import adpConsensus from "../../data/adp-consensus.json";
import scenariosGableFile from "../../data/scenarios-gable.json";
import scenariosCobraFile from "../../data/scenarios-cobra.json";
import type { AdpBoard, AdpSourcesFile } from "./adp";
import type { ScenarioTree } from "./scenarios";
import type { KeepersFile, League, Meta, Player, RecRulesFile } from "./types";

export const leagues = leaguesFile.leagues as League[];
export const players = playersFile.players as Player[];
export const keepers = keepersFile as KeepersFile;
export const meta = metaFile as Meta;
export const recRules = recRulesFile as RecRulesFile;
export const adpSources = adpSourcesFile as AdpSourcesFile;
export const adpBoards: Record<string, AdpBoard> = {
  gil: adpGil as AdpBoard,
  "cbs-public": adpCbsPublic as AdpBoard,
  fantasypros: adpFantasypros as AdpBoard,
  espn: adpEspn as AdpBoard,
  sleeper: adpSleeper as AdpBoard,
  yahoo: adpYahoo as AdpBoard,
  consensus: adpConsensus as AdpBoard,
};
export const scenariosGable = scenariosGableFile as ScenarioTree;
export const scenariosCobra = scenariosCobraFile as ScenarioTree;

export function leagueById(id: string): League {
  const league = leagues.find((l) => l.id === id);
  if (!league) throw new Error(`Unknown league ${id}`);
  return league;
}

export function playerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function keepersFor(leagueId: string) {
  if (leagueId === "gable") return keepers.gable;
  return keepers.cobra;
}

/** Gable is default through the Gable draft date; Cobra after that. */
export function defaultLeagueId(now: Date = new Date()): string {
  const cutoff = new Date(`${meta.gableDefaultUntil}T23:59:59-04:00`);
  return now.getTime() <= cutoff.getTime() ? "gable" : "cobra";
}

export function playersById(): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}
