import type { Player, Position } from "@/lib/types";
import { formatAdp, POS_CLASS } from "./pos";

const FILTERS: Array<Position | "ALL"> = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"];

export function PlayerPool({
  players,
  query,
  setQuery,
  posFilter,
  setPosFilter,
  highlight,
  setHighlight,
  onDraft,
  disabled,
}: {
  players: Player[];
  query: string;
  setQuery: (q: string) => void;
  posFilter: Position | "ALL";
  setPosFilter: (p: Position | "ALL") => void;
  highlight: number;
  setHighlight: (n: number) => void;
  onDraft: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <section data-testid="player-pool" className="border border-[#232333] bg-[#0c0c12] flex flex-col min-h-0">
      <div className="p-3 border-b border-[#232333] flex flex-wrap items-center gap-2">
        <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-xs text-[#8b8b9a] mr-2">
          POOL · CLICK = DRAFTED
        </p>
        <input
          data-testid="player-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          placeholder="/ search name, team, pos"
          className="flex-1 min-w-48 bg-[#12121a] border border-[#2a2a3a] px-2 py-1 text-sm outline-none focus:border-[#c6ff00]"
        />
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setPosFilter(f);
                setHighlight(0);
              }}
              className={`px-2 py-1 text-[11px] font-[family-name:var(--font-label)] tracking-wider ${
                posFilter === f ? "bg-[#c6ff00] text-black" : "bg-[#12121a] text-[#d8d4c8]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#12121a] text-[10px] text-[#8b8b9a] font-[family-name:var(--font-label)] tracking-wider">
            <tr>
              <th className="text-left px-2 py-1">ADP</th>
              <th className="text-left px-2 py-1">RK</th>
              <th className="text-left px-2 py-1">POS</th>
              <th className="text-left px-2 py-1">PLAYER</th>
              <th className="text-left px-2 py-1">NFL</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const active = i === highlight;
              return (
                <tr
                  key={p.id}
                  data-testid={`pool-${p.id}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    if (!disabled) onDraft(p.id);
                  }}
                  className={`cursor-pointer border-t border-[#1b1b24] ${
                    active ? "bg-[#1d220c]" : "hover:bg-[#14141c]"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <td className="px-2 py-1 font-[family-name:var(--font-mono)] text-[#c6ff00]">
                    {formatAdp(p.adp)}
                  </td>
                  <td className="px-2 py-1 font-[family-name:var(--font-mono)] text-[#8b8b9a]">
                    {p.overallRank}
                  </td>
                  <td className="px-2 py-1">
                    <span className={`${POS_CLASS[p.position]} text-[10px] font-bold px-1`}>
                      {p.position}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    {p.name}
                    {p.sleeper ? (
                      <span className="ml-2 text-[10px] text-[#c6ff00]">SLEEPER</span>
                    ) : null}
                    {p.fade ? <span className="ml-2 text-[10px] text-[#ff2a7a]">FADE</span> : null}
                    {p.trap ? <span className="ml-2 text-[10px] text-[#ff5c5c]">TRAP</span> : null}
                    {p.injury ? (
                      <span className="ml-2 text-[10px] text-[#ffb703]">{p.injury}</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1 text-[#8b8b9a]">{p.nflTeam}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
