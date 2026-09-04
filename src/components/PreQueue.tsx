"use client";

import type { ParsedPreQueue } from "@/lib/prequeue";

export function PreQueue({
  raw,
  setRaw,
  parsed,
  active,
  onLoad,
  onClear,
  clockSeconds,
}: {
  raw: string;
  setRaw: (v: string) => void;
  parsed: ParsedPreQueue;
  active: boolean;
  onLoad: (text: string) => void;
  onClear: () => void;
  clockSeconds: number;
}) {
  return (
    <section data-testid="prequeue" className="border border-[#2ef5ff]/30 bg-[#0c0c12] p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#2ef5ff]">
          ROBOT / PRELOAD QUEUE
        </p>
        <p className="text-[11px] text-[#8b8b9a]">
          {clockSeconds}s clock · ranked list before kickoff
        </p>
      </div>
      <p className="text-[12px] text-[#a8a4b0] mb-2">
        Paste a ranked list (one full name per line) for the CBS robot. Smash uses this order once
        a slot is drawn. Josh Jacobs and Kaleb Johnson are stripped even if pasted.
      </p>
      <textarea
        data-testid="prequeue-paste"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"Jahmyr Gibbs\nBijan Robinson\nJa'Marr Chase\nJonathan Taylor\nPuka Nacua"}
        className="w-full min-h-24 bg-[#12121a] border border-[#2a2a3a] px-2 py-1 text-[#f4f1ea] text-[12px] outline-none focus:border-[#c6ff00]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="prequeue-load"
          onClick={() => onLoad(raw)}
          className="px-2 py-0.5 bg-[#c6ff00] text-black font-[family-name:var(--font-label)] tracking-wider text-[11px]"
        >
          LOAD QUEUE
        </button>
        <button
          type="button"
          data-testid="prequeue-clear"
          onClick={onClear}
          className="px-2 py-0.5 border border-[#ff2a7a]/50 text-[#ff2a7a] font-[family-name:var(--font-label)] tracking-wider text-[11px]"
        >
          CLEAR
        </button>
        <span data-testid="prequeue-status" className="text-[11px] text-[#d8d4c8]">
          {active
            ? `${parsed.matched.length} ranked · ${parsed.unmatched.length} unmatched · ${parsed.faded.length} faded`
            : "empty — rec engine runs"}
        </span>
      </div>
      {parsed.faded.length > 0 ? (
        <p className="mt-1 text-[11px] text-[#ff2a7a]">
          Stripped: {parsed.faded.map((p) => p.name).join(", ")}
        </p>
      ) : null}
      {parsed.unmatched.length > 0 ? (
        <p className="mt-1 text-[11px] text-[#ffb703]">
          Unmatched: {parsed.unmatched.slice(0, 8).join(", ")}
        </p>
      ) : null}
      {active ? (
        <ol data-testid="prequeue-list" className="mt-2 space-y-0.5 max-h-40 overflow-auto text-[12px]">
          {parsed.matched.slice(0, 16).map((p, i) => (
            <li key={p.id} className="flex gap-2">
              <span className="font-[family-name:var(--font-mono)] text-[#8b8b9a] w-5">{i + 1}</span>
              <span>{p.name}</span>
              <span className="ml-auto text-[#8b8b9a]">{p.position}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
