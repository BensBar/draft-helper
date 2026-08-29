import type { Player } from "@/lib/types";
import { formatAdp, POS_CLASS } from "./pos";

export function NextEight({ queue }: { queue: Player[] }) {
  return (
    <section data-testid="next-eight" className="border border-[#232333] bg-[#0c0c12] p-3">
      <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#8b8b9a] mb-2">
        NEXT-8 QUEUE
      </p>
      <ol className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
        {queue.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center gap-2 border border-[#232333] bg-[#12121a] px-2 py-1.5"
          >
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8b8b9a] w-4">
              {i + 1}
            </span>
            <span className={`${POS_CLASS[p.position]} text-[10px] font-bold px-1`}>{p.position}</span>
            <span className="truncate text-sm">{p.name}</span>
            <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[#8b8b9a]">
              {formatAdp(p.adp)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
