import type { Player } from "@/lib/types";
import { formatAdp, POS_CLASS } from "./pos";

export function FAQueue({
  players,
  waiver,
}: {
  players: Player[];
  waiver: { benPosition: number; of: number } | null;
}) {
  return (
    <section data-testid="fa-queue" className="border border-[#c6ff00]/30 bg-[#0c0c12] p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#c6ff00]">
          POST-DRAFT FA QUEUE
        </p>
        {waiver ? (
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#c6ff00]">
            WAIVER {waiver.benPosition}/{waiver.of} · DOES NOT RESET
          </p>
        ) : (
          <p className="text-[11px] text-[#8b8b9a]">Recovery lever</p>
        )}
      </div>
      <ul className="space-y-1 max-h-48 overflow-auto">
        {players.length === 0 ? (
          <li className="text-xs text-[#8b8b9a]">Board is stripped. You already grabbed the sleepers.</li>
        ) : (
          players.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm" title={p.notes ?? undefined}>
              <span className={`${POS_CLASS[p.position]} text-[10px] font-bold px-1`}>{p.position}</span>
              <span className="truncate">{p.name}</span>
              {p.sleeper ? <span className="text-[#c6ff00] text-[10px]">SLEEPER</span> : null}
              {p.fade ? <span className="text-[#ff2a7a] text-[10px]">FADE leftover</span> : null}
              {p.trap ? <span className="text-[#ff5c5c] text-[10px]">TRAP</span> : null}
              <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[#8b8b9a]">
                {formatAdp(p.adp)}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
