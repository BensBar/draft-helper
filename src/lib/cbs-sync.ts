import { firstLivePick, nextLivePick } from "./keepers";
import type { DraftPick, Player } from "./types";

export const CBS_SYNC_TYPE = "bensbar-draft-sync";
export const CBS_SYNC_CHANNEL = "bensbar-draft-sync";
export const CBS_SYNC_STORAGE_KEY = "bensbar-draft-sync:last";

export type CbsSyncSource = "cbs-bookmarklet" | "paste" | "extension";

export type CbsSyncPayload = {
  type: typeof CBS_SYNC_TYPE;
  version: 1;
  source: CbsSyncSource;
  names: string[];
  picks?: Array<{ name: string; overallPick?: number }>;
  href?: string;
};

export type ApplyCbsPicksResult = {
  livePicks: DraftPick[];
  unmatched: string[];
  skippedKeepers: string[];
  matched: Array<{ name: string; playerId: string; overallPick: number }>;
};

const SUFFIX = /\b(jr|sr|iii|ii|iv)\b/g;

const MANUAL_ALIASES: Record<string, string> = {
  cmc: "christian-mccaffrey",
  jsn: "jaxon-smith-njigba",
  "j smith njigba": "jaxon-smith-njigba",
  "amon ra st brown": "amon-ra-st-brown",
  "amonra st brown": "amon-ra-st-brown",
  "st brown": "amon-ra-st-brown",
  arsb: "amon-ra-st-brown",
  "aj brown": "aj-brown",
  "a j brown": "aj-brown",
  "jamarr chase": "jamarr-chase",
  "devon achane": "devon-achane",
  "de von achane": "devon-achane",
  "kenneth walker": "kenneth-walker",
  "ken walker": "kenneth-walker",
  "brian thomas": "brian-thomas",
  "marvin harrison": "marvin-harrison",
  "michael pittman": "michael-pittman",
  "luther burden": "luther-burden",
  "mike washington": "mike-washington-jr",
  "patrick mahomes": "patrick-mahomes",
  "josh jacobs": "josh-jacobs",
};

const DST_CITIES: Record<string, string> = {
  denver: "den-dst",
  broncos: "den-dst",
  baltimore: "bal-dst",
  ravens: "bal-dst",
  philadelphia: "phi-dst",
  eagles: "phi-dst",
  pittsburgh: "pit-dst",
  steelers: "pit-dst",
  minnesota: "min-dst",
  vikings: "min-dst",
  "green bay": "gb-dst",
  packers: "gb-dst",
  houston: "hou-dst",
  texans: "hou-dst",
  "san francisco": "sf-dst",
  "49ers": "sf-dst",
  niners: "sf-dst",
  dallas: "dal-dst",
  cowboys: "dal-dst",
  "kansas city": "kc-dst",
  chiefs: "kc-dst",
  buffalo: "buf-dst",
  bills: "buf-dst",
  jets: "nyj-dst",
  "new york jets": "nyj-dst",
  detroit: "det-dst",
  lions: "det-dst",
  cleveland: "cle-dst",
  browns: "cle-dst",
  seattle: "sea-dst",
  seahawks: "sea-dst",
  rams: "lar-dst",
  "los angeles rams": "lar-dst",
  miami: "mia-dst",
  dolphins: "mia-dst",
  chicago: "chi-dst",
  bears: "chi-dst",
  "new orleans": "no-dst",
  saints: "no-dst",
};

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(SUFFIX, " ")
    .replace(/\b(dst|d st|def|defense|team)\b/g, " ")
    .replace(/\b(qb|rb|wr|te|k|flex)\b/g, " ")
    .replace(/\s+[a-z]{2,3}$/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function parsePastedNames(text: string): string[] {
  return text
    .split(/[\n|;]+/)
    .flatMap((line) => (line.includes(",") && /,.*,/.test(line) ? line.split(",") : [line]))
    .map((line) =>
      line
        .replace(/^\s*(pick\s*)?\d+\s*[\.\:\-\)]\s*/i, "")
        .replace(/\s+[A-Z]{2,3}\s*$/, "")
        .trim(),
    )
    .filter((line) => line.length >= 3 && !/^(round|pick|overall|empty|kept)$/i.test(line));
}

export function isCbsSyncPayload(data: unknown): data is CbsSyncPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.type === CBS_SYNC_TYPE &&
    d.version === 1 &&
    Array.isArray(d.names) &&
    d.names.every((n) => typeof n === "string")
  );
}

export function allowedSyncOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith(".football.cbssports.com")) return true;
    if (u.hostname === "football.cbssports.com") return true;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (u.origin === "https://bensbar.github.io") return true;
    return false;
  } catch {
    return false;
  }
}

type MatchIndex = {
  byNorm: Map<string, Player[]>;
  byLast: Map<string, Player[]>;
  byId: Map<string, Player>;
};

export function buildMatchIndex(players: Player[]): MatchIndex {
  const byNorm = new Map<string, Player[]>();
  const byLast = new Map<string, Player[]>();
  const byId = new Map<string, Player>();
  for (const p of players) {
    byId.set(p.id, p);
    const norm = normalizeName(p.name);
    const list = byNorm.get(norm) ?? [];
    list.push(p);
    byNorm.set(norm, list);
    const parts = norm.split(" ");
    const last = parts[parts.length - 1] ?? "";
    if (last.length >= 4) {
      const lastList = byLast.get(last) ?? [];
      lastList.push(p);
      byLast.set(last, lastList);
    }
  }
  return { byNorm, byLast, byId };
}

export function matchPlayerName(raw: string, players: Player[] | MatchIndex): Player | null {
  const index = Array.isArray(players) ? buildMatchIndex(players) : players;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (trimmed.length < 2) return null;
  const norm = normalizeName(trimmed);
  if (!norm) return null;

  const aliasId = MANUAL_ALIASES[norm];
  if (aliasId && index.byId.get(aliasId)) return index.byId.get(aliasId)!;

  const dstId = DST_CITIES[norm] ?? DST_CITIES[norm.replace(/\s+dst$/, "")];
  if (dstId && index.byId.get(dstId)) return index.byId.get(dstId)!;

  const exact = index.byNorm.get(norm);
  if (exact?.length === 1) return exact[0];
  if (exact && exact.length > 1) return exact[0];

  const noPos = normalizeName(trimmed.replace(/\s+(QB|RB|WR|TE|K|DST|DEF)\b.*$/i, ""));
  if (noPos && noPos !== norm) {
    const hit = index.byNorm.get(noPos);
    if (hit?.[0]) return hit[0];
    const alias2 = MANUAL_ALIASES[noPos];
    if (alias2 && index.byId.get(alias2)) return index.byId.get(alias2)!;
  }

  const parts = norm.split(" ");
  if (parts.length >= 2) {
    const firstLast = `${parts[0]} ${parts[parts.length - 1]}`;
    const fl = index.byNorm.get(firstLast);
    if (fl?.length === 1) return fl[0];
    const first = parts[0];
    const last = parts[parts.length - 1];
    const lastHits = (index.byLast.get(last) ?? []).filter(
      (p) => normalizeName(p.name).startsWith(first),
    );
    if (lastHits.length === 1) return lastHits[0];
  }

  if (parts.length === 1 && parts[0].length >= 4) {
    const lastHits = index.byLast.get(parts[0]) ?? [];
    if (lastHits.length === 1) return lastHits[0];
  }

  if (/^[a-z]{2,3}$/.test(norm)) {
    const dst = index.byId.get(`${norm}-dst`);
    if (dst) return dst;
  }

  return null;
}

export function applyCbsPicks(args: {
  names: string[];
  overalls?: Array<number | undefined>;
  players: Player[];
  keeperPlayerIds: Set<string>;
  keeperPickNums: Set<number>;
  teams: number;
  rounds: number;
}): ApplyCbsPicksResult {
  const index = buildMatchIndex(args.players);
  const usedIds = new Set<string>(args.keeperPlayerIds);
  const livePicks: DraftPick[] = [];
  const unmatched: string[] = [];
  const skippedKeepers: string[] = [];
  const matched: ApplyCbsPicksResult["matched"] = [];
  const usedOverall = new Set<number>(args.keeperPickNums);

  const assignLive = (player: Player, preferred?: number): number => {
    let overall = preferred;
    if (
      overall == null ||
      overall < 1 ||
      usedOverall.has(overall) ||
      args.keeperPickNums.has(overall)
    ) {
      overall = firstLivePick(args.teams, args.rounds, usedOverall);
    }
    usedOverall.add(overall);
    usedIds.add(player.id);
    livePicks.push({ overallPick: overall, playerId: player.id, source: "sync" });
    return overall;
  };

  for (let i = 0; i < args.names.length; i++) {
    const name = args.names[i]?.trim();
    if (!name) continue;
    const overall = args.overalls?.[i];
    const player = matchPlayerName(name, index);
    if (!player) {
      unmatched.push(name);
      continue;
    }
    if (args.keeperPlayerIds.has(player.id)) {
      skippedKeepers.push(name);
      continue;
    }
    if (usedIds.has(player.id)) {
      continue;
    }
    if (typeof overall === "number" && args.keeperPickNums.has(overall)) {
      skippedKeepers.push(name);
      continue;
    }
    const slot = assignLive(player, typeof overall === "number" ? overall : undefined);
    matched.push({ name, playerId: player.id, overallPick: slot });
  }

  livePicks.sort((a, b) => a.overallPick - b.overallPick);
  return { livePicks, unmatched, skippedKeepers, matched };
}

export function namesFromPayload(payload: CbsSyncPayload): {
  names: string[];
  overalls: Array<number | undefined>;
} {
  if (payload.picks?.length) {
    return {
      names: payload.picks.map((p) => p.name),
      overalls: payload.picks.map((p) => p.overallPick),
    };
  }
  return { names: payload.names, overalls: payload.names.map(() => undefined) };
}

/** Next live overall after the highest assigned live pick (keepers stay skipped). */
export function nextPickAfterSync(
  livePicks: DraftPick[],
  teams: number,
  rounds: number,
  keeperNums: Set<number>,
): number {
  const max = livePicks.reduce((m, p) => Math.max(m, p.overallPick), 0);
  if (max === 0) return firstLivePick(teams, rounds, keeperNums);
  return nextLivePick(max + 1, teams, rounds, keeperNums);
}
