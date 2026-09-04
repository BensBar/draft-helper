export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: string;
  name: string;
  position: Position;
  nflTeam: string;
  overallRank: number;
  adp: number;
  kept?: boolean;
  sleeper?: boolean;
  fade?: boolean;
  trap?: boolean;
  injury?: string;
  notes?: string;
}

export interface YardBonus {
  yards: number;
  bonus: number;
}

export interface DistanceTdBonus {
  min: number;
  max: number;
  bonus: number;
}

export interface LeagueScoring {
  reception: number;
  passTd: number;
  rushTd: number;
  recTd: number;
  passYds: number;
  rushYds: number;
  recYds: number;
  int: number;
  fumbleLost: number;
  distanceTd?: DistanceTdBonus[];
  anyTd50plus?: number;
  passBonuses: YardBonus[];
  rushBonuses: YardBonus[];
  recBonuses: YardBonus[];
}

export interface LeagueRoster {
  qb: number;
  rb: number;
  wr: number;
  te: number;
  flex: number;
  flexElig: Position[];
  k: number;
  dst: number;
  starters: number;
  benchMin: number;
  benchMax: number;
  ir: number;
  totalMin: number;
  totalMax: number;
  emptyStarterPenalty: number;
}

export interface League {
  id: string;
  name: string;
  shortName: string;
  teamName: string;
  url: string;
  teams: number;
  rounds: number;
  clockSeconds: number;
  draftStartsAt: string;
  draftType: "snake";
  format: "h2h" | "all-play";
  divisions: number;
  buyIn: number | null;
  benSlot: number | null;
  slotIsDrawn: boolean;
  robot: boolean;
  defaultAdpSourceId?: string;
  scoringLabel: string;
  scoring: LeagueScoring;
  scoringNotes: string[];
  roster: LeagueRoster;
  playoffs: { startWeek: number; teams: number; weeks: number } | null;
  waivers: { reset: boolean; benPosition: number; of: number } | null;
  draftOrder: string[];
}

export interface Keeper {
  team: string;
  round: number;
  playerId: string;
  note?: string;
}

export interface KeepersFile {
  gable: Keeper[];
  cobra: Keeper[];
}

export interface Meta {
  adpBanner: string;
  adpFetched: string;
  adpScoring: string;
  newsDate: string;
  updated: string;
  newsBanner: string;
  defaultLeagueId: string;
  gableDefaultUntil: string;
  author: string;
  disclaimer: string;
}

export interface DraftPick {
  overallPick: number;
  playerId: string;
  source: "user" | "keeper" | "sync";
}

export interface RecResult {
  player: Player | null;
  why: string;
  queue: Player[];
  windowId: string;
}

export interface RecWindow {
  id: string;
  rounds?: number[];
  picks?: number[];
  take?: number;
  positions?: Position[];
  from?: string[];
  preferThen?: Position[];
  neverPositions?: Position[];
  neverIds?: string[];
  why: string;
}

export interface GableRecRules {
  windows: RecWindow[];
  fadeIds: string[];
  trapIds: string[];
}

export interface CobraRecRules {
  fadeIds: string[];
  slot3Round1: { from: string[]; elseFrom: string[]; why: string };
  round2: { positions: Position[]; neverIds: string[]; why: string };
  mid: { positions: Position[]; why: string };
  waitOnQbUntilRound: number;
  kDstLastRounds: number;
  neverEarlyIds: string[];
}

export interface RecRulesFile {
  gable: GableRecRules;
  cobra: CobraRecRules;
}
