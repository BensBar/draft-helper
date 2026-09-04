export function SlotPicker({
  slot,
  onPick,
}: {
  slot: number | null;
  onPick: (n: number) => void;
}) {
  return (
    <section
      data-testid="cobra-slot-picker"
      className="mx-3 mt-3 border border-[#2ef5ff]/40 bg-[#0c0c12] p-4"
    >
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="shrink-0">
          <p className="font-[family-name:var(--font-label)] text-[#2ef5ff] tracking-[0.3em] text-xs">
            COBRA CRAIG · SLOT DRAWN AT KICKOFF · THU 9/10 5:00PM ET
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl leading-none mt-1 whitespace-nowrap">
            {slot ? `YOU ARE PICK ${slot}` : "DRAW YOUR SLOT — 1 TO 12"}
          </h2>
        </div>
        <p className="text-xs text-[#8b8b9a] max-w-sm text-right shrink">
          Never hardcoded pick 3. NEXT PICK + queue recompute for any slot 1–12. 16 rounds · no
          keepers · $165 · half-PPR · pass TD 6.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-1.5">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const active = slot === n;
          return (
            <button
              key={n}
              type="button"
              data-testid={`slot-${n}`}
              onClick={() => onPick(n)}
              className={`h-14 font-[family-name:var(--font-display)] text-3xl leading-none border ${
                active
                  ? "bg-[#c6ff00] text-black border-[#c6ff00]"
                  : "bg-[#12121a] border-[#2a2a3a] hover:border-[#2ef5ff] hover:text-[#2ef5ff]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </section>
  );
}
