"use client";

import { useMemo, useState } from "react";
import { nodeById, resolveScenario, type ScenarioTree } from "@/lib/scenarios";
import type { Player } from "@/lib/types";
import { formatAdp, POS_CLASS } from "./pos";

export function ScenariosOverlay({
  gable,
  cobra,
  players,
  defaultLeagueId,
  onClose,
}: {
  gable: ScenarioTree;
  cobra: ScenarioTree;
  players: Player[];
  defaultLeagueId: string;
  onClose: () => void;
}) {
  const initial = defaultLeagueId === "cobra" ? cobra : gable;
  const [treeId, setTreeId] = useState(initial.leagueId);
  const [nodeId, setNodeId] = useState(initial.rootId);

  const tree = treeId === "cobra" ? cobra : gable;
  const resolved = useMemo(() => resolveScenario(tree, nodeId, players), [tree, nodeId, players]);
  const { node, slots } = resolved;
  const isHub = node.id === tree.rootId || node.id === "cheat";

  return (
    <div
      data-testid="scenarios-overlay"
      className="fixed inset-0 z-50 bg-[#050508]/95 overflow-auto"
    >
      <div className="sticky top-0 z-10 border-b border-[#232333] bg-[#050508] px-3 py-2 flex flex-wrap items-center gap-2">
        <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-[#c6ff00] text-sm mr-2">
          SCENARIOS · PREP
        </p>
        <button
          type="button"
          data-testid="scenarios-gable"
          onClick={() => {
            setTreeId("gable");
            setNodeId(gable.rootId);
          }}
          className={`px-3 py-1.5 font-[family-name:var(--font-display)] text-2xl leading-none ${
            treeId === "gable" ? "bg-[#c6ff00] text-black" : "bg-[#12121a] text-[#d8d4c8]"
          }`}
        >
          GABLE
        </button>
        <button
          type="button"
          data-testid="scenarios-cobra"
          onClick={() => {
            setTreeId("cobra");
            setNodeId(cobra.rootId);
          }}
          className={`px-3 py-1.5 font-[family-name:var(--font-display)] text-2xl leading-none ${
            treeId === "cobra" ? "bg-[#c6ff00] text-black" : "bg-[#12121a] text-[#d8d4c8]"
          }`}
        >
          COBRA
        </button>
        <button
          type="button"
          data-testid="scenarios-close"
          onClick={onClose}
          className="ml-auto px-3 py-2 border border-[#c6ff00] text-[#c6ff00] font-[family-name:var(--font-label)] tracking-wider"
        >
          LIVE DRAFT
        </button>
      </div>

      <div className="p-3 max-w-[1400px] mx-auto space-y-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide">
            {tree.title}
          </h2>
          <p className="mt-1 text-sm text-[#8b8b9a]">{tree.subtitle}</p>
          {treeId === "cobra" ? (
            <p className="mt-1 text-xs text-[#ffb703]">
              Slot unknown until kickoff — tap 1–12. Never hardcoded pick 3. Gable tab is historical.
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#8b8b9a]">Gable historical — keepers locked. Cobra night is the other tab.</p>
          )}
        </div>

        <section className="border border-[#c6ff00]/40 bg-[#0c0c12] p-4" data-testid="scenario-page">
          <p className="font-[family-name:var(--font-label)] tracking-[0.35em] text-xs text-[#c6ff00]">
            TRIGGER
          </p>
          <h3
            data-testid="scenario-trigger"
            className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,48px)] leading-[0.9] mt-1"
          >
            {node.trigger.toUpperCase()}
          </h3>

          {slots.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="font-[family-name:var(--font-label)] tracking-[0.35em] text-xs text-[#8b8b9a]">
                PICK
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <div
                    key={slot.overall}
                    data-testid={`scenario-pick-${slot.overall}`}
                    className="border border-[#232333] bg-[#12121a] p-3"
                  >
                    <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#8b8b9a]">
                      {slot.label ?? `OVERALL ${slot.overall}`}
                    </p>
                    {slot.players.length === 0 ? (
                      <p className="text-[#8b8b9a]">Best remaining in the locked set.</p>
                    ) : (
                      slot.players.map((p) => <PickLine key={p.id} player={p} />)
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="font-[family-name:var(--font-label)] tracking-[0.35em] text-xs text-[#8b8b9a] mt-4">
            WHY
          </p>
          <p data-testid="scenario-why" className="mt-1 text-lg text-[#d8d4c8] max-w-4xl">
            {node.why}
          </p>
          {node.notes?.map((n) => (
            <p key={n} className="mt-1 text-sm text-[#8b8b9a]">
              {n}
            </p>
          ))}

          {node.forks.length > 0 ? (
            <div className="mt-5">
              <p className="font-[family-name:var(--font-label)] tracking-[0.35em] text-xs text-[#8b8b9a] mb-2">
                {isHub ? "TRIGGER CHIPS" : "NEXT FORK"}
              </p>
              <div className="flex flex-wrap gap-2">
                {node.forks.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    data-testid={`scenario-fork-${f.id}`}
                    onClick={() => {
                      if (nodeById(tree, f.id)) setNodeId(f.id);
                    }}
                    className="px-3 py-2 bg-[#12121a] border border-[#2a2a3a] hover:border-[#c6ff00] hover:text-[#c6ff00] font-[family-name:var(--font-label)] tracking-wider text-sm text-left"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {node.id !== tree.rootId ? (
            <button
              type="button"
              data-testid="scenario-back"
              onClick={() => setNodeId(tree.rootId)}
              className="mt-4 text-[12px] text-[#8b8b9a] hover:text-white"
            >
              ← opening chips
            </button>
          ) : null}
        </section>

        {tree.keeperSkips.length > 0 ? (
          <p className="text-[11px] text-[#5a5a6a]">
            Keeper skips:{" "}
            {tree.keeperSkips.map((k) => `${k.overall} ${k.note}`).join(" · ")} · Live picks{" "}
            {tree.livePicks.join(", ")}
          </p>
        ) : null}

      </div>
    </div>
  );
}

function PickLine({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 mt-1" data-testid={`scenario-player-${player.id}`}>
      <span className={`${POS_CLASS[player.position]} text-[10px] font-bold px-1`}>{player.position}</span>
      <span className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-wide">
        {player.name.toUpperCase()}
      </span>
      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#8b8b9a]">
        ADP {formatAdp(player.adp)}
      </span>
      {player.injury ? (
        <span className="border border-[#ffb703] text-[#ffb703] text-[10px] px-1">{player.injury}</span>
      ) : null}
    </div>
  );
}
