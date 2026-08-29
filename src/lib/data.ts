import leaguesFile from "../../data/leagues.json";
import playersFile from "../../data/players.json";
import keepersFile from "../../data/keepers.json";
import metaFile from "../../data/meta.json";
import recRulesFile from "../../data/rec-rules.json";
import type { KeepersFile, League, Meta, Player, RecRulesFile } from "./types";

export const leagues = leaguesFile.leagues as League[];
export const players = playersFile.players as Player[];
export const keepers = keepersFile as KeepersFile;
export const meta = metaFile as Meta;
export const recRules = recRulesFile as RecRulesFile;

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
