"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdpSource } from "@/hooks/useAdpSource";
import { useCbsSync } from "@/hooks/useCbsSync";
import { useClock } from "@/hooks/useClock";
import { useDraft } from "@/hooks/useDraft";
import { usePreQueue } from "@/hooks/usePreQueue";
import type { AdpBoard, AdpSourcesFile } from "@/lib/adp";
import { availableFromQueue, prequeueWhy } from "@/lib/prequeue";
import type { ScenarioTree } from "@/lib/scenarios";
import type { KeepersFile, League, Meta, Player } from "@/lib/types";
import { AdpSourceBar } from "./AdpSourceBar";
import { CbsSyncBar } from "./CbsSyncBar";
import { DraftBoard } from "./DraftBoard";
import { FAQueue } from "./FAQueue";
import { GiantRec } from "./GiantRec";
import { NextEight } from "./NextEight";
import { OnTheClock } from "./OnTheClock";
import { PlayerPool } from "./PlayerPool";
import { PreQueue } from "./PreQueue";
import { RosterNeeds } from "./RosterNeeds";
import { SampleBanner } from "./SampleBanner";
import { ScenariosOverlay } from "./ScenariosOverlay";
import { SlotPicker } from "./SlotPicker";
import { StickyHeader } from "./StickyHeader";

export function DraftApp({
  leagues,
  players,
  keepers: _keepers,
  meta,
  adpSources,
  adpBoards,
  scenariosGable,
  scenariosCobra,
  initialLeagueId,
}: {
  leagues: League[];
  players: Player[];
  keepers: KeepersFile;
  meta: Meta;
  adpSources: AdpSourcesFile;
  adpBoards: Record<string, AdpBoard>;
  scenariosGable: ScenarioTree;
  scenariosCobra: ScenarioTree;
  initialLeagueId: string;
}) {
  void _keepers;
  const [leagueId, setLeagueId] = useState(initialLeagueId);
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const adp = useAdpSource(players, adpSources, adpBoards, meta.adpBanner, leagueId);
  const draft = useDraft(adp.players, initialLeagueId);
  const prequeue = usePreQueue(draft.leagueId, adp.players);
  const cbs = useCbsSync({
    players,
    keeperPlayerIds: draft.keeperPlayerIds,
    keeperPickNums: draft.keeperNums,
    teams: draft.league.teams,
    rounds: draft.league.rounds,
    onApply: draft.applySyncPicks,
  });
  const clock = useClock(
    draft.league.clockSeconds,
    draft.currentPick,
    draft.benOnClock && draft.canDraft,
  );

  useEffect(() => {
    if (draft.leagueId !== leagueId) setLeagueId(draft.leagueId);
  }, [draft.leagueId, leagueId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-testid=player-search]")?.focus();
        return;
      }
      if (e.key === "Escape" && typing) {
        (target as HTMLInputElement).blur();
        draft.setQuery("");
        return;
      }
      if (typing) return;
      if (e.key === "Enter" || e.key.toLowerCase() === "d") {
        const player = draft.available[draft.highlight];
        if (player) draft.markDrafted(player.id);
      } else if (e.key.toLowerCase() === "u" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        draft.undo();
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        draft.setHighlight(Math.min(draft.available.length - 1, draft.highlight + 1));
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        draft.setHighlight(Math.max(0, draft.highlight - 1));
      } else if (e.key.toLowerCase() === "c") {
        clock.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, clock]);

  const pickLabel = draft.benSlot
    ? `Your next live pick ${draft.recPick} · R${Math.ceil(draft.recPick / draft.league.teams)} · slot ${draft.benSlot}`
    : "Draw slot first — picker 1–12, never pick 3";

  const rec = useMemo(() => {
    if (!draft.benSlot) return draft.rec;
    if (!prequeue.active) return draft.rec;
    const queue = availableFromQueue(prequeue.parsed.matched, draft.takenIds);
    if (queue.length === 0) return draft.rec;
    return {
      player: queue[0] ?? null,
      why: prequeueWhy(queue),
      queue: queue.slice(0, 8),
      windowId: "prequeue",
    };
  }, [draft.benSlot, draft.rec, draft.takenIds, prequeue.active, prequeue.parsed.matched]);

  const adpHint =
    draft.league.id === "cobra"
      ? "Cobra default: CBS Non-PPR 9/4"
      : "Gable default: Gil / CBS 8/31";

  return (
    <div className="min-h-screen">
      <SampleBanner text={adp.banner} news={meta.newsBanner} />
      <AdpSourceBar
        sources={adp.catalog.sources}
        selectedId={adp.sourceId}
        onSelect={adp.setSourceId}
        leagueHint={adpHint}
      />
      <CbsSyncBar status={cbs.status} onPaste={cbs.applyPaste} league={draft.league} />
      <StickyHeader
        leagues={leagues}
        league={draft.league}
        currentPick={draft.currentPick}
        lastPick={draft.lastPick}
        round={draft.round}
        onClockTeam={draft.onClockTeam}
        remaining={clock.remaining}
        running={clock.running}
        expired={clock.expired}
        robot={draft.league.robot}
        onToggleClock={clock.toggle}
        onResetClock={clock.reset}
        onUndo={draft.undo}
        onReset={() => {
          if (window.confirm("Reset this league's draft board? Keepers stay locked.")) {
            draft.reset();
            clock.reset();
          }
        }}
        canUndo={draft.canUndo}
        onLeague={draft.setLeagueId}
        onScenarios={() => setScenariosOpen(true)}
      />

      {draft.league.slotIsDrawn ? (
        <SlotPicker slot={draft.cobraSlot} onPick={draft.chooseCobraSlot} />
      ) : null}

      {draft.benOnClock ? (
        <OnTheClock
          team={draft.league.teamName}
          pick={draft.currentPick}
          seconds={clock.remaining}
        />
      ) : null}

      {clock.expired && draft.league.robot ? (
        <div
          data-testid="robot-banner"
          className="mx-3 mt-3 bg-[#ffb703] text-black px-4 py-2 font-[family-name:var(--font-label)] tracking-[0.25em]"
        >
          75s GONE — GABLE ROBOT AUTODRAFTS IF HE MISSES. Click whoever CBS just took.
        </div>
      ) : null}

      {clock.expired && !draft.league.robot && draft.benOnClock ? (
        <div
          data-testid="clock-gone-banner"
          className="mx-3 mt-3 bg-[#ffb703] text-black px-4 py-2 font-[family-name:var(--font-label)] tracking-[0.25em]"
        >
          {draft.league.clockSeconds}s GONE — smash the named NEXT PICK / preloaded queue. Confirm
          whether CBS autodrafts.
        </div>
      ) : null}

      <main className="p-3 grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)] gap-3">
        <div className="space-y-3 min-w-0">
          <GiantRec
            player={rec.player}
            why={rec.why}
            onClock={draft.benOnClock}
            pickLabel={pickLabel}
            waitLabel={draft.league.slotIsDrawn && !draft.benSlot ? "DRAW SLOT 1–12" : "WAIT"}
          />
          <NextEight queue={rec.queue} />
          <PlayerPool
            players={draft.available}
            query={draft.query}
            setQuery={draft.setQuery}
            posFilter={draft.posFilter}
            setPosFilter={draft.setPosFilter}
            highlight={draft.highlight}
            setHighlight={draft.setHighlight}
            onDraft={draft.markDrafted}
            disabled={!draft.canDraft}
          />
        </div>
        <div className="space-y-3 min-w-0">
          <PreQueue
            raw={prequeue.raw}
            setRaw={prequeue.setRaw}
            parsed={prequeue.parsed}
            active={prequeue.active}
            onLoad={prequeue.load}
            onClear={prequeue.clear}
            clockSeconds={draft.league.clockSeconds}
          />
          <RosterNeeds slots={draft.rosterSlots} roster={draft.benPlayers} />
          <FAQueue players={draft.faQueue} waiver={draft.league.waivers} />
          <LeagueSettings league={draft.league} />
          <DraftBoard
            league={draft.league}
            draftOrder={draft.draftOrder}
            pickByOverall={draft.pickByOverall}
            currentPick={draft.currentPick}
            benSlot={draft.benSlot}
          />
        </div>
      </main>

      {scenariosOpen ? (
        <ScenariosOverlay
          gable={scenariosGable}
          cobra={scenariosCobra}
          players={adp.players}
          defaultLeagueId={draft.leagueId}
          onClose={() => setScenariosOpen(false)}
        />
      ) : null}
    </div>
  );
}

function LeagueSettings({ league }: { league: League }) {
  const cobra = league.id === "cobra";
  const draftWhen = cobra ? "Thu 9/10/2026 5:00pm ET" : "Thu 9/3/2026 8:00pm ET";
  return (
    <section
      data-testid="league-settings"
      className="border border-[#232333] bg-[#0c0c12] p-3 text-xs text-[#a8a4b0] space-y-1"
    >
      <p className="font-[family-name:var(--font-label)] tracking-[0.3em] text-[#8b8b9a]">
        LEAGUE SETTINGS · {league.shortName}
      </p>
      <p>
        · {league.name} · {league.teamName}
      </p>
      <p>
        · {draftWhen} · {league.draftType} · {league.teams} teams · {league.rounds} rounds
      </p>
      {cobra ? (
        <p data-testid="cobra-settings-keepers">· NO KEEPERS · slot drawn at kickoff (picker 1–12, never pick 3)</p>
      ) : (
        <p>· Keepers locked from JSON · Ben slot {league.benSlot}</p>
      )}
      <p>
        · {league.scoringLabel}
        {league.buyIn ? ` · $${league.buyIn}` : ""}
        {league.format === "all-play" ? " · all-play (do not punt weeks)" : " · h2h"}
      </p>
      <p>
        · Scoring: rec {league.scoring.reception} · pass TD {league.scoring.passTd} · rush/rec TD{" "}
        {league.scoring.rushTd}/{league.scoring.recTd}
      </p>
      {league.scoringNotes.map((n) => (
        <p key={n}>· {n}</p>
      ))}
      {league.playoffs ? (
        <p>
          · Playoffs week {league.playoffs.startWeek}, {league.playoffs.teams} teams,{" "}
          {league.playoffs.weeks} weeks
        </p>
      ) : (
        <p>· No playoff bye format — all-play season</p>
      )}
      {cobra ? (
        <p>
          · ADP default: CBS Non-PPR Sep 4 2026 (closest CBS; no public half-PPR). Switch sources
          above.
        </p>
      ) : null}
      <p>
        · Start {league.roster.starters}: QB{league.roster.qb} RB{league.roster.rb} WR
        {league.roster.wr} TE{league.roster.te} FLEX K DST
      </p>
    </section>
  );
}
