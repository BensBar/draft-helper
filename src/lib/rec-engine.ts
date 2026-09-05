import type {
  CobraRecRules,
  GableRecRules,
  League,
  Player,
  Position,
  RecResult,
  RecWindow,
} from "./types";
import { isBenTurn, overallPickToRound } from "./snake";

const SKILL: Position[] = ["RB", "WR"];
const LATE: Position[] = ["K", "DST"];

function available(players: Player[], taken: Set<string>): Player[] {
  return players
    .filter((p) => !taken.has(p.id))
    .sort((a, b) => a.adp - b.adp || a.overallRank - b.overallRank);
}

/** Eligible set is locked; order follows current ADP (selected source). */
function byIds(pool: Player[], ids: string[]): Player[] {
  const want = new Set(ids);
  return pool.filter((p) => want.has(p.id));
}

function byPositions(pool: Player[], positions: Position[]): Player[] {
  const set = new Set(positions);
  return pool.filter((p) => set.has(p.position));
}

function reject(
  pool: Player[],
  neverIds: string[] = [],
  neverPositions: Position[] = [],
): Player[] {
  const banned = new Set(neverIds);
  const pos = new Set(neverPositions);
  return pool.filter((p) => !banned.has(p.id) && !pos.has(p.position));
}

function dropBanned(pool: Player[], ...idLists: Array<string[] | undefined>): Player[] {
  const banned = new Set(idLists.flatMap((ids) => ids ?? []));
  if (banned.size === 0) return pool;
  return pool.filter((p) => !banned.has(p.id));
}

function namedList(queue: Player[], n = 5): string {
  return queue
    .slice(0, n)
    .map((p) => p.name)
    .join(" / ");
}

function namedWhy(lead: string, queue: Player[], tail: string, n = 5): string {
  const names = namedList(queue, n);
  if (!names) return `${lead} ${tail}`.replace(/\s+/g, " ").trim();
  return `${lead} ${names}. ${tail}`.replace(/\s+/g, " ").trim();
}

function windowForGable(rules: GableRecRules, overallPick: number, teams: number): RecWindow {
  const round = overallPickToRound(overallPick, teams);
  const byPick = rules.windows.find((w) => w.picks?.includes(overallPick));
  if (byPick) return byPick;
  const byRound = rules.windows.find((w) => w.rounds?.includes(round));
  if (byRound) return byRound;
  return rules.windows[rules.windows.length - 1];
}

export function recommendGable(args: {
  rules: GableRecRules;
  players: Player[];
  takenIds: Set<string>;
  overallPick: number;
  teams: number;
}): RecResult {
  const { rules, players, takenIds, overallPick, teams } = args;
  const pool = dropBanned(available(players, takenIds), rules.fadeIds, rules.trapIds);
  const window = windowForGable(rules, overallPick, teams);
  const cleaned = reject(pool, window.neverIds, window.neverPositions);

  let queue: Player[] = [];
  if (window.from?.length) {
    queue = byIds(cleaned, window.from);
    if (window.preferThen?.length) {
      const extra = byPositions(cleaned, window.preferThen as Position[]).filter(
        (p) => !queue.some((q) => q.id === p.id),
      );
      queue = [...queue, ...extra];
    }
  }
  if (queue.length === 0 && window.positions?.length) {
    queue = byPositions(cleaned, window.positions);
  }
  if (queue.length === 0) {
    queue = cleaned.filter((p) => !LATE.includes(p.position));
  }

  queue = dropBanned(queue, rules.fadeIds, rules.trapIds);

  return {
    player: queue[0] ?? null,
    why: window.why,
    queue: queue.slice(0, 8),
    windowId: window.id,
  };
}

export function recommendCobra(args: {
  rules: CobraRecRules;
  players: Player[];
  takenIds: Set<string>;
  overallPick: number;
  teams: number;
  rounds: number;
  benSlot: number;
}): RecResult {
  const { rules, players, takenIds, overallPick, teams, rounds, benSlot } = args;
  const pool = dropBanned(available(players, takenIds), rules.fadeIds);
  const round = overallPickToRound(overallPick, teams);
  const lastRounds = rules.kDstLastRounds;

  if (round > rounds - lastRounds) {
    const kd = byPositions(pool, LATE);
    const queue = (kd.length ? kd : pool).slice(0, 8);
    return {
      player: kd[0] ?? pool[0] ?? null,
      why: namedWhy(
        "K/DST last two —",
        queue,
        "Do not spend an earlier pick here. Fade Josh Jacobs (CEL).",
      ),
      queue,
      windowId: "cobra-late",
    };
  }

  if (benSlot === 3 && round === 1) {
    const leftovers = byIds(pool, rules.slot3Round1.from);
    const fallback = byIds(pool, rules.slot3Round1.elseFrom);
    const queue = leftovers.length ? leftovers : fallback;
    const shown = (queue.length ? queue : byPositions(pool, SKILL)).slice(0, 8);
    return {
      player: queue[0] ?? byPositions(pool, SKILL)[0] ?? null,
      why: namedWhy(rules.slot3Round1.why + " On the board:", shown, "Fade Josh Jacobs (CEL)."),
      queue: shown,
      windowId: "cobra-slot3-r1",
    };
  }

  if (round === 1) {
    const skill = reject(byPositions(pool, SKILL), rules.neverEarlyIds);
    return {
      player: skill[0] ?? null,
      why: namedWhy(
        "Smash leftover",
        skill,
        "Wait on Josh Allen until ~R7. Fade Josh Jacobs (CEL). MarShawn Lloyd is climbing but still a reach — never confuse with Kaleb Johnson.",
      ),
      queue: skill.slice(0, 8),
      windowId: "cobra-r1",
    };
  }

  if (round === 2) {
    const skill = reject(byPositions(pool, rules.round2.positions), rules.round2.neverIds);
    return {
      player: skill[0] ?? null,
      why: namedWhy(
        "Round 2 leftover",
        skill,
        "Do not take Josh Allen. Fade Josh Jacobs (CEL). MarShawn Lloyd is climbing but still a reach — never confuse with Kaleb Johnson.",
      ),
      queue: skill.slice(0, 8),
      windowId: "cobra-r2",
    };
  }

  if (round < rules.waitOnQbUntilRound) {
    const skill = reject(byPositions(pool, rules.mid.positions), ["josh-allen"]);
    return {
      player: skill[0] ?? null,
      why: namedWhy(
        "All-play leftover",
        skill,
        "Wait on Josh Allen until ~R7. Fade Josh Jacobs (CEL). MarShawn Lloyd is climbing but still a reach — never confuse with Kaleb Johnson.",
      ),
      queue: skill.slice(0, 8),
      windowId: "cobra-mid",
    };
  }

  const skillFirst = pool.filter((p) => !LATE.includes(p.position));
  return {
    player: skillFirst[0] ?? pool[0] ?? null,
    why: namedWhy(
      "Best remaining",
      skillFirst,
      "Josh Allen is allowed now if you still need a QB. Still wait on K/DST. Fade Josh Jacobs (CEL). MarShawn Lloyd is climbing but still a reach — never confuse with Kaleb Johnson.",
    ),
    queue: skillFirst.slice(0, 8),
    windowId: "cobra-late-mid",
  };
}

export function recommendNext(args: {
  league: League;
  gable: GableRecRules;
  cobra: CobraRecRules;
  players: Player[];
  takenIds: Set<string>;
  overallPick: number;
  benSlot: number;
}): RecResult {
  const { league, gable, cobra, players, takenIds, overallPick, benSlot } = args;
  if (league.id === "gable") {
    return recommendGable({
      rules: gable,
      players,
      takenIds,
      overallPick,
      teams: league.teams,
    });
  }
  return recommendCobra({
    rules: cobra,
    players,
    takenIds,
    overallPick,
    teams: league.teams,
    rounds: league.rounds,
    benSlot,
  });
}

/** Next live (non-keeper) pick that belongs to Ben, at or after currentOverall. */
export function nextBenPick(
  currentOverall: number,
  teams: number,
  rounds: number,
  benSlot: number,
  keeperPicks: Set<number>,
): number | null {
  const last = teams * rounds;
  for (let pick = currentOverall; pick <= last; pick++) {
    if (keeperPicks.has(pick)) continue;
    if (isBenTurn(pick, teams, benSlot)) return pick;
  }
  return null;
}
