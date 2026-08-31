import type { AdpSourceInfo } from "@/lib/adp";

export function AdpSourceBar({
  sources,
  selectedId,
  onSelect,
}: {
  sources: AdpSourceInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      data-testid="adp-source-bar"
      className="bg-[#0c0c12] border-b border-[#232333] px-3 py-1.5 flex flex-wrap items-center gap-1.5"
    >
      <span className="font-[family-name:var(--font-label)] text-[10px] tracking-[0.25em] text-[#8b8b9a] mr-1">
        ADP SOURCE
      </span>
      {sources.map((s) => {
        const active = s.id === selectedId;
        const skipped = s.status !== "ok";
        return (
          <button
            key={s.id}
            type="button"
            data-testid={`adp-source-${s.id}`}
            disabled={skipped}
            title={skipped ? (s.skipReason ?? s.banner) : s.banner}
            onClick={() => onSelect(s.id)}
            className={`px-2 py-1 font-[family-name:var(--font-label)] text-[11px] tracking-wider ${
              skipped
                ? "bg-[#12121a] text-[#5a5a6a] line-through cursor-not-allowed"
                : active
                  ? "bg-[#c6ff00] text-black"
                  : "bg-[#12121a] text-[#d8d4c8] hover:text-white border border-[#2a2a3a]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
