import type { League } from "@/lib/types";
import { formatClock } from "./pos";

export function StickyHeader({
  leagues,
  league,
  currentPick,
  lastPick,
  round,
  onClockTeam,
  remaining,
  running,
  expired,
  robot,
  onToggleClock,
  onResetClock,
  onUndo,
  onReset,
  canUndo,
  onLeague,
  onScenarios,
}: {
  leagues: League[];
  league: League;
  currentPick: number;
  lastPick: number;
  round: number;
  onClockTeam: string;
  remaining: number;
  running: boolean;
  expired: boolean;
  robot: boolean;
  onToggleClock: () => void;
  onResetClock: () => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
  onLeague: (id: string) => void;
  onScenarios?: () => void;
}) {
  const urgent = remaining <= 15;
  return (
    <header className="sticky top-0 z-40 border-b border-[#232333] bg-[#050508]/95 backdrop-blur-md">
      <div className="px-3 py-2 flex flex-wrap items-center gap-3">
        <div className="flex">
          {leagues.map((l) => {
            const active = l.id === league.id;
            return (
              <button
                key={l.id}
                type="button"
                data-testid={`league-${l.id}`}
                onClick={() => onLeague(l.id)}
                className={`px-3 py-2 font-[family-name:var(--font-display)] text-2xl leading-none tracking-wide ${
                  active ? "bg-[#c6ff00] text-black" : "bg-[#12121a] text-[#d8d4c8] hover:text-white"
                }`}
              >
                {l.shortName}
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="font-[family-name:var(--font-label)] tracking-[0.25em] text-[10px] text-[#8b8b9a]">
            {league.name.toUpperCase()}
          </p>
          <p className="font-[family-name:var(--font-display)] text-2xl leading-none">
            {league.teamName}
          </p>
          <a
            href={league.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#2ef5ff] hover:underline"
          >
            {league.url}
          </a>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Stat k="OVERALL" v={`${Math.min(currentPick, lastPick)} / ${lastPick}`} />
          <Stat k="ROUND" v={String(round)} />
          <Stat k="ON CLOCK" v={onClockTeam} accent />
          <button
            type="button"
            data-testid="clock"
            onClick={onToggleClock}
            className={`min-w-28 text-center border px-3 py-1 ${
              expired
                ? "border-[#ff2a7a] bg-[#ff2a7a] text-black"
                : urgent
                  ? "border-[#ff2a7a] text-[#ff2a7a] tick-urgent"
                  : "border-[#c6ff00] text-[#c6ff00]"
            }`}
          >
            <div className="font-[family-name:var(--font-label)] text-[10px] tracking-[0.3em]">
              {expired && robot ? "ROBOT" : running ? "LIVE" : "CLOCK"}
            </div>
            <div className="font-[family-name:var(--font-mono)] text-4xl leading-none font-extrabold">
              {expired ? "0:00" : formatClock(remaining)}
            </div>
          </button>
          <button
            type="button"
            onClick={onResetClock}
            className="text-[11px] text-[#8b8b9a] hover:text-white"
          >
            RESET 75
          </button>
          {onScenarios ? (
            <button
              type="button"
              data-testid="scenarios-open"
              onClick={onScenarios}
              className="px-3 py-2 bg-[#c6ff00] text-black font-[family-name:var(--font-label)] tracking-wider"
            >
              SCENARIOS
            </button>
          ) : null}
          <button
            type="button"
            data-testid="undo"
            onClick={onUndo}
            disabled={!canUndo}
            className="px-3 py-2 bg-[#12121a] border border-[#2a2a3a] disabled:opacity-30 font-[family-name:var(--font-label)] tracking-wider"
          >
            UNDO
          </button>
          <button
            type="button"
            data-testid="reset-draft"
            onClick={onReset}
            className="px-3 py-2 text-[#ff2a7a] border border-[#ff2a7a]/40 font-[family-name:var(--font-label)] tracking-wider"
          >
            RESET
          </button>
        </div>
      </div>
      <p className="px-3 pb-2 text-[11px] text-[#8b8b9a]">
        {league.scoringLabel} · {league.format.toUpperCase()} · {league.teams} tm · {league.rounds} rd
        {league.robot ? " · ROBOT ON · 75s" : ""} · Companion only — not CBS.
        <span className="ml-3 text-[#5a5a6a]">
          Keys: Enter/D draft · U undo · ↑↓ pool · / search · C clock
        </span>
      </p>
    </header>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-label)] text-[10px] tracking-[0.3em] text-[#8b8b9a]">
        {k}
      </div>
      <div
        className={`font-[family-name:var(--font-display)] text-2xl leading-none ${
          accent ? "text-[#ff2a7a]" : ""
        }`}
      >
        {v}
      </div>
    </div>
  );
}
