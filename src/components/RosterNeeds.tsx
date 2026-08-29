import type { NeedSlot } from "@/lib/roster";
import type { Player } from "@/lib/types";
import { POS_CLASS } from "./pos";

export function RosterNeeds({
  slots,
  roster,
}: {
  slots: NeedSlot[];
  roster: Player[];
}) {
  return (
    <section data-testid="roster-needs" className="border border-[#232333] bg-[#0c0c12] p-3">
      <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#8b8b9a] mb-2">
        ROSTER NEEDS
      </p>
      <ul className="space-y-1">
        {slots.map((slot) => (
          <li
            key={slot.key}
            data-testid={`need-${slot.key}`}
            className={`flex items-center gap-2 px-2 py-1.5 border ${
              slot.filled ? "border-[#1d3a24] bg-[#0b1610]" : "border-[#3a2210] bg-[#160e08]"
            }`}
          >
            <span
              className={`${
                slot.position === "FLEX" ? "bg-white text-black" : POS_CLASS[slot.position]
              } text-[10px] font-bold px-1.5 min-w-10 text-center`}
            >
              {slot.label}
            </span>
            {slot.filled ? (
              <span className="text-sm">
                {slot.filled.name}
                {slot.filled.injury ? (
                  <span className="ml-2 text-[#ffb703] text-xs">{slot.filled.injury}</span>
                ) : null}
              </span>
            ) : (
              <span className="text-[#ff8a3d] font-[family-name:var(--font-label)] tracking-widest text-xs">
                HOLE
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[#8b8b9a]">
        On roster {roster.length} · start {slots.filter((s) => s.filled).length}/{slots.length}
      </p>
    </section>
  );
}
