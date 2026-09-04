import { playerById } from "@/lib/data";
import { overallPickFor } from "@/lib/snake";
import type { DraftPick, League } from "@/lib/types";
import { POS_TEXT, shortTeam } from "./pos";

export function DraftBoard({
  league,
  draftOrder,
  pickByOverall,
  currentPick,
  benSlot,
}: {
  league: League;
  draftOrder: string[];
  pickByOverall: Map<number, DraftPick>;
  currentPick: number;
  benSlot: number | null;
}) {
  return (
    <section data-testid="draft-board" className="border border-[#232333] bg-[#0c0c12] p-2 overflow-auto">
      <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#8b8b9a] px-1 mb-2">
        {league.id === "cobra"
          ? "BOARD · NO KEEPERS · 16 ROUNDS"
          : "BOARD · KEEPERS LOCKED"}
      </p>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="w-6 text-[#8b8b9a] font-normal">R</th>
            {draftOrder.map((name, i) => {
              const ben = benSlot === i + 1;
              return (
                <th
                  key={name + i}
                  className={`px-0.5 py-1 font-[family-name:var(--font-label)] tracking-wider ${
                    ben ? "text-[#c6ff00]" : "text-[#d8d4c8]"
                  }`}
                >
                  {shortTeam(name)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: league.rounds }, (_, r) => r + 1).map((round) => (
            <tr key={round}>
              <td className="text-[#8b8b9a] font-[family-name:var(--font-mono)] pr-1">{round}</td>
              {draftOrder.map((_, i) => {
                const slot = i + 1;
                const overall = overallPickFor(slot, round, league.teams);
                const pick = pickByOverall.get(overall);
                const player = pick ? playerById(pick.playerId) : undefined;
                const isCurrent = overall === currentPick;
                const isBen = benSlot === slot;
                return (
                  <td
                    key={`${round}-${slot}`}
                    data-testid={`cell-${overall}`}
                    className={`border px-1 py-0.5 align-top ${
                      isCurrent
                        ? "border-[#c6ff00] bg-[#1a2208]"
                        : pick?.source === "keeper"
                          ? "border-[#3a2a10] bg-[#161208]"
                          : isBen
                            ? "border-[#1a2a14] bg-[#0a120c]"
                            : "border-[#1b1b24]"
                    }`}
                  >
                    {player ? (
                      <div>
                        <div className={`truncate ${POS_TEXT[player.position]}`}>{player.name}</div>
                        <div className="flex items-center gap-1 text-[9px] text-[#8b8b9a]">
                          <span>{player.position}</span>
                          {pick?.source === "keeper" ? (
                            <span className="text-[#ffb703] tracking-widest">KEPT</span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#3a3a4a] font-[family-name:var(--font-mono)]">{overall}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
