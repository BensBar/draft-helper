import keepersFile from "../../data/keepers.json";
import leaguesFile from "../../data/leagues.json";
import metaFile from "../../data/meta.json";
import playersFile from "../../data/players.json";
import { DraftApp } from "@/components/DraftApp";
import { defaultLeagueId } from "@/lib/data";
import type { KeepersFile, League, Meta, Player } from "@/lib/types";

export default function Home() {
  return (
    <DraftApp
      leagues={leaguesFile.leagues as League[]}
      players={playersFile.players as Player[]}
      keepers={keepersFile as KeepersFile}
      meta={metaFile as Meta}
      initialLeagueId={defaultLeagueId()}
    />
  );
}
