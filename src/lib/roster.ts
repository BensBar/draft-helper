import type { LeagueRoster, Player, Position } from "./types";

export type NeedSlot = {
  key: string;
  label: string;
  position: Position | "FLEX";
  filled: Player | null;
  required: boolean;
};

const STARTER_ORDER: { position: Position | "FLEX"; countKey: keyof LeagueRoster }[] = [
  { position: "QB", countKey: "qb" },
  { position: "RB", countKey: "rb" },
  { position: "WR", countKey: "wr" },
  { position: "TE", countKey: "te" },
  { position: "FLEX", countKey: "flex" },
  { position: "K", countKey: "k" },
  { position: "DST", countKey: "dst" },
];

function canFill(slot: Position | "FLEX", player: Player, flexElig: Position[]): boolean {
  if (slot === "FLEX") return flexElig.includes(player.position);
  return player.position === slot;
}

export function assignRoster(players: Player[], roster: LeagueRoster): NeedSlot[] {
  const slots: NeedSlot[] = [];
  for (const spec of STARTER_ORDER) {
    const count = roster[spec.countKey];
    if (typeof count !== "number") continue;
    for (let i = 0; i < count; i++) {
      slots.push({
        key: `${spec.position}-${i + 1}`,
        label: spec.position === "FLEX" ? "FLEX" : `${spec.position}${count > 1 ? i + 1 : ""}`,
        position: spec.position,
        filled: null,
        required: true,
      });
    }
  }

  const used = new Set<string>();
  for (const slot of slots) {
    const match = players.find((p) => !used.has(p.id) && canFill(slot.position, p, roster.flexElig));
    if (match) {
      slot.filled = match;
      used.add(match.id);
    }
  }

  return slots;
}

export function holes(slots: NeedSlot[]): NeedSlot[] {
  return slots.filter((s) => !s.filled);
}

export function benStartersFilled(slots: NeedSlot[]): number {
  return slots.filter((s) => s.filled).length;
}
