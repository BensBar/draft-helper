import type { Position } from "@/lib/types";

export const POS_CLASS: Record<Position, string> = {
  QB: "bg-[#ffb703] text-black",
  RB: "bg-[#3dff8a] text-black",
  WR: "bg-[#4db3ff] text-black",
  TE: "bg-[#ff8a3d] text-black",
  K: "bg-[#c084fc] text-black",
  DST: "bg-[#ff5c5c] text-black",
};

export const POS_TEXT: Record<Position, string> = {
  QB: "text-[#ffb703]",
  RB: "text-[#3dff8a]",
  WR: "text-[#4db3ff]",
  TE: "text-[#ff8a3d]",
  K: "text-[#c084fc]",
  DST: "text-[#ff5c5c]",
};

export function shortTeam(name: string): string {
  const map: Record<string, string> = {
    "Big Weiner": "WEINER",
    GirthQuake: "GIRTH",
    Smoochy: "SMOOCH",
    "Gitty Up": "GITTY",
    "Dickless Cunts": "DLESS",
    Ballock: "BALLOK",
    "Haywood D'Jablome": "HAYWD",
    "Hurts So Good": "HURTS",
    "#Goofballs": "GOOF",
    Natrix: "NATRX",
    JDK: "JDK",
    "Ben's Bar Bruskis": "BEN",
    "Ben's Bar": "BEN",
  };
  return map[name] ?? name.replace(/^Slot /, "S").slice(0, 6).toUpperCase();
}

export function formatAdp(adp: number): string {
  return adp.toFixed(adp % 1 === 0 ? 0 : 2);
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
