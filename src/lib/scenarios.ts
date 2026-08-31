import type { Player, Position } from "./types";

export type ScenarioPickMode = "listed" | "best-adp" | "listed-then-adp" | "prefer-listed";

export interface ScenarioPickRule {
  overall: number;
  mode: ScenarioPickMode;
  from?: string[];
  prefer?: string[];
  thenPositions?: Position[];
  take?: number;
  excludePriorPicks?: boolean;
  never?: string[];
  neverPositions?: Position[];
  skipIfInjured?: Array<{ id: string; match: string }>;
  gone?: string[];
}

export interface ScenarioFork {
  id: string;
  label: string;
}

export interface ScenarioNode {
  id: string;
  section?: string;
  window?: string;
  trigger: string;
  why: string;
  picks: ScenarioPickRule[];
  notes?: string[];
  forks: ScenarioFork[];
}

export interface KeeperSkip {
  overall: number;
  playerId: string;
  note: string;
}

export interface ScenarioTree {
  leagueId: string;
  title: string;
  subtitle: string;
  rootId: string;
  livePicks: number[];
  keeperSkips: KeeperSkip[];
  pile: string[];
  neverAt1213: { ids: string[]; positions: Position[] };
  nodes: ScenarioNode[];
}

export interface ResolvedSlot {
  overall: number;
  players: Player[];
}

export interface ResolvedScenario {
  node: ScenarioNode;
  slots: ResolvedSlot[];
}

function byId(players: Player[]): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}

function adpSort(a: Player, b: Player): number {
  return a.adp - b.adp || a.overallRank - b.overallRank || a.name.localeCompare(b.name);
}

function isSkippedInjury(p: Player, rules: ScenarioPickRule["skipIfInjured"]): boolean {
  if (!rules?.length) return false;
  return rules.some((r) => r.id === p.id && (p.injury ?? "").toUpperCase().includes(r.match.toUpperCase()));
}

function reject(
  pool: Player[],
  never: string[] = [],
  neverPositions: Position[] = [],
  skipIfInjured?: ScenarioPickRule["skipIfInjured"],
): Player[] {
  const banned = new Set(never);
  const pos = new Set(neverPositions);
  return pool.filter(
    (p) => !banned.has(p.id) && !pos.has(p.position) && !isSkippedInjury(p, skipIfInjured),
  );
}

function fromListed(ids: string[], index: Map<string, Player>): Player[] {
  return ids.map((id) => index.get(id)).filter((p): p is Player => Boolean(p));
}

function byPositions(pool: Player[], positions: Position[]): Player[] {
  const set = new Set(positions);
  return pool.filter((p) => set.has(p.position)).sort(adpSort);
}

function takeFrom(rule: ScenarioPickRule, players: Player[], taken: Set<string>): Player[] {
  const index = byId(players);
  const n = rule.take ?? 1;
  const gone = new Set(rule.gone ?? []);
  const cleaned = reject(
    players.filter((p) => !taken.has(p.id) && !gone.has(p.id)),
    rule.never,
    rule.neverPositions,
    rule.skipIfInjured,
  );
  const want = new Set(rule.from ?? []);

  let ordered: Player[] = [];
  if (rule.mode === "listed") {
    ordered = reject(fromListed(rule.from ?? [], index), rule.never, rule.neverPositions, rule.skipIfInjured).filter(
      (p) => !taken.has(p.id) && !gone.has(p.id),
    );
  } else if (rule.mode === "prefer-listed") {
    const prefer = reject(fromListed(rule.prefer ?? rule.from ?? [], index), rule.never, rule.neverPositions).filter(
      (p) => !taken.has(p.id) && !gone.has(p.id),
    );
    const rest = reject(fromListed(rule.from ?? [], index), rule.never, rule.neverPositions).filter(
      (p) => !taken.has(p.id) && !gone.has(p.id) && !prefer.some((x) => x.id === p.id),
    );
    ordered = [...prefer, ...rest];
  } else if (rule.mode === "listed-then-adp") {
    ordered = reject(fromListed(rule.from ?? [], index), rule.never, rule.neverPositions, rule.skipIfInjured).filter(
      (p) => !taken.has(p.id) && !gone.has(p.id),
    );
  } else if (rule.mode === "best-adp") {
    ordered = (rule.from?.length ? cleaned.filter((p) => want.has(p.id)) : cleaned).sort(adpSort);
  }

  if (ordered.length < n && rule.thenPositions?.length) {
    const extra = byPositions(cleaned, rule.thenPositions).filter((p) => !ordered.some((q) => q.id === p.id));
    ordered = [...ordered, ...extra];
  }

  if (ordered.length < n && rule.mode === "best-adp" && !rule.from?.length && !rule.thenPositions?.length) {
    ordered = cleaned.sort(adpSort);
  }

  return ordered.slice(0, n);
}

export function nodeById(tree: ScenarioTree, id: string): ScenarioNode | undefined {
  return tree.nodes.find((n) => n.id === id);
}

export function resolveScenario(tree: ScenarioTree, nodeId: string, players: Player[]): ResolvedScenario {
  const node = nodeById(tree, nodeId);
  if (!node) throw new Error(`Unknown scenario ${nodeId}`);
  const taken = new Set<string>();
  const slots: ResolvedSlot[] = [];
  for (const rule of node.picks) {
    if (!rule.excludePriorPicks) {
      /* keep taken only when this slot says so; first slot always empty */
    }
    const chosen = takeFrom(rule, players, rule.excludePriorPicks ? taken : new Set());
    for (const p of chosen) taken.add(p.id);
    slots.push({ overall: rule.overall, players: chosen });
  }
  return { node, slots };
}

export function scenarioPicksAt(resolved: ResolvedScenario, overall: number): Player[] {
  return resolved.slots.filter((s) => s.overall === overall).flatMap((s) => s.players);
}

export function allResolvedPlayers(resolved: ResolvedScenario): Player[] {
  return resolved.slots.flatMap((s) => s.players);
}

export function isR12R13Node(node: ScenarioNode): boolean {
  return node.window === "r12r13" || node.picks.some((p) => p.overall === 12 || p.overall === 13);
}

export function isR36Node(node: ScenarioNode): boolean {
  return node.window === "r36" || (node.section === "36" && node.picks.every((p) => p.overall === 36));
}
