import type { Player } from "@/lib/types";
import { formatAdp, POS_CLASS } from "./pos";

export function GiantRec({
  player,
  why,
  onClock,
  pickLabel,
}: {
  player: Player | null;
  why: string;
  onClock: boolean;
  pickLabel: string;
}) {
  return (
    <section
      data-testid="giant-rec"
      className={`relative overflow-hidden border p-5 ${
        onClock ? "border-[#ff2a7a] bg-[#160810] on-clock-pulse" : "border-[#232333] bg-[#0c0c12]"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-[family-name:var(--font-label)] tracking-[0.35em] text-xs text-[#c6ff00]">
          {onClock ? "SMASH THIS PICK" : "NEXT PICK"}
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8b8b9a]">{pickLabel}</p>
      </div>
      {player ? (
        <>
          <h1
            data-testid="rec-name"
            className="glow-name font-[family-name:var(--font-display)] text-[clamp(48px,7vw,92px)] leading-[0.82] tracking-wide"
          >
            {player.name.toUpperCase()}
          </h1>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span
              data-testid="rec-pos"
              className={`${POS_CLASS[player.position]} font-[family-name:var(--font-label)] font-bold px-2 py-0.5 text-lg tracking-widest`}
            >
              {player.position}
            </span>
            <span className="font-[family-name:var(--font-label)] text-2xl tracking-wider">
              {player.nflTeam}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-sm text-[#8b8b9a]">
              ADP {formatAdp(player.adp)} · RK {player.overallRank}
            </span>
            {player.sleeper ? (
              <span className="bg-[#c6ff00] text-black font-[family-name:var(--font-label)] text-xs px-1.5 py-0.5 tracking-widest">
                SLEEPER
              </span>
            ) : null}
            {player.fade ? (
              <span className="bg-[#ff2a7a] text-black font-[family-name:var(--font-label)] text-xs px-1.5 py-0.5 tracking-widest">
                FADE
              </span>
            ) : null}
            {player.injury ? (
              <span className="border border-[#ffb703] text-[#ffb703] font-[family-name:var(--font-label)] text-xs px-1.5 py-0.5 tracking-widest">
                {player.injury.toUpperCase()}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none text-[#8b8b9a]">
          WAIT
        </h1>
      )}
      <p data-testid="rec-why" className="mt-4 text-lg leading-snug text-[#d8d4c8] max-w-3xl">
        {why}
      </p>
    </section>
  );
}
