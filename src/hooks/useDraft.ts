"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepersFor, leagueById, playerById, recRules } from "@/lib/data";
import { firstLivePick, keeperPicks, nextLivePick } from "@/lib/keepers";
import { nextBenPick, recommendNext } from "@/lib/rec-engine";
import { assignRoster } from "@/lib/roster";
import {
  isBenTurn,
  overallPickToRound,
  slotForOverallPick,
  teamNameForPick,
  totalPicks,
  withBenInOrder,
} from "@/lib/snake";
import type { ApplyCbsPicksResult } from "@/lib/cbs-sync";
import { clearDraft, emptyDraft, loadDraft, saveDraft } from "@/lib/storage";
import type { DraftPick, League, Player, Position } from "@/lib/types";

export function useDraft(players: Player[], initialLeagueId: string) {
  const [leagueId, setLeagueIdState] = useState(initialLeagueId);
  const [cobraSlot, setCobraSlot] = useState<number | null>(null);
  const [userPicks, setUserPicks] = useState<DraftPick[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [highlight, setHighlight] = useState(0);

  const league: League = leagueById(leagueId);

  useEffect(() => {
    const saved = loadDraft(leagueId) ?? emptyDraft(leagueId);
    setCobraSlot(saved.cobraSlot);
    setUserPicks(saved.userPicks);
    setHydrated(true);
    setQuery("");
    setPosFilter("ALL");
    setHighlight(0);
  }, [leagueId]);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft({
      version: 1,
      leagueId,
      cobraSlot,
      userPicks,
      clockRunning: false,
      clockStartedAt: null,
      clockOffset: 0,
    });
  }, [hydrated, leagueId, cobraSlot, userPicks]);

  const benSlot = league.slotIsDrawn ? cobraSlot : league.benSlot;
  const draftOrder = useMemo(() => {
    if (league.slotIsDrawn && benSlot) {
      return withBenInOrder(league.draftOrder, benSlot, league.teamName);
    }
    return league.draftOrder;
  }, [league, benSlot]);

  const keepers = keepersFor(leagueId);
  const keeperList = useMemo(
    () => (benSlot || !league.slotIsDrawn ? keeperPicks(keepers, draftOrder, league.teams) : []),
    [keepers, draftOrder, league.teams, benSlot, league.slotIsDrawn],
  );
  const keeperNums = useMemo(
    () => new Set(keeperList.map((p) => p.overallPick)),
    [keeperList],
  );
  const keeperPlayerIds = useMemo(
    () => new Set(keeperList.map((p) => p.playerId)),
    [keeperList],
  );
  const lastPick = totalPicks(league.teams, league.rounds);
  const currentPick = useMemo(() => {
    const maxUser = userPicks.reduce((m, p) => Math.max(m, p.overallPick), 0);
    if (maxUser === 0) return firstLivePick(league.teams, league.rounds, keeperNums);
    return nextLivePick(maxUser + 1, league.teams, league.rounds, keeperNums);
  }, [userPicks, league.teams, league.rounds, keeperNums]);

  const takenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of keeperList) ids.add(p.playerId);
    for (const p of userPicks) ids.add(p.playerId);
    return ids;
  }, [keeperList, userPicks]);

  const pickByOverall = useMemo(() => {
    const map = new Map<number, DraftPick>();
    for (const p of keeperList) map.set(p.overallPick, p);
    for (const p of userPicks) map.set(p.overallPick, p);
    return map;
  }, [keeperList, userPicks]);

  const onClockTeam =
    currentPick <= lastPick ? teamNameForPick(currentPick, league.teams, draftOrder) : "DRAFT OVER";
  const onClockSlot =
    currentPick <= lastPick ? slotForOverallPick(currentPick, league.teams) : null;
  const round =
    currentPick <= lastPick ? overallPickToRound(currentPick, league.teams) : league.rounds;
  const benOnClock = Boolean(
    benSlot && currentPick <= lastPick && isBenTurn(currentPick, league.teams, benSlot),
  );
  const draftOver = currentPick > lastPick;

  const recPick = useMemo(() => {
    if (!benSlot) return currentPick;
    return (
      nextBenPick(currentPick, league.teams, league.rounds, benSlot, keeperNums) ?? currentPick
    );
  }, [benSlot, currentPick, league.teams, league.rounds, keeperNums]);

  const rec = useMemo(() => {
    if (!benSlot) {
      return { player: null, why: "Draw your slot. CBS does not lock this until kickoff.", queue: [], windowId: "need-slot" };
    }
    return recommendNext({
      league,
      gable: recRules.gable,
      cobra: recRules.cobra,
      players,
      takenIds,
      overallPick: recPick,
      benSlot,
    });
  }, [benSlot, league, players, takenIds, recPick]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => !takenIds.has(p.id))
      .filter((p) => posFilter === "ALL" || p.position === posFilter)
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.nflTeam.toLowerCase().includes(q) ||
          p.position.toLowerCase() === q ||
          String(p.adp).includes(q)
        );
      })
      .sort((a, b) => a.adp - b.adp);
  }, [players, takenIds, posFilter, query]);

  const benPlayers = useMemo(() => {
    if (!benSlot) return [];
    const ids: string[] = [];
    for (const [overall, pick] of pickByOverall) {
      if (slotForOverallPick(overall, league.teams) === benSlot) ids.push(pick.playerId);
    }
    return ids.map((id) => playerById(id)).filter((p): p is Player => Boolean(p));
  }, [benSlot, pickByOverall, league.teams]);

  const rosterSlots = useMemo(
    () => assignRoster(benPlayers, league.roster),
    [benPlayers, league.roster],
  );

  const faQueue = useMemo(() => {
    return players
      .filter((p) => !takenIds.has(p.id) && (p.sleeper || p.fade || p.trap))
      .sort((a, b) => a.adp - b.adp);
  }, [players, takenIds]);

  const markDrafted = useCallback(
    (playerId: string) => {
      if (!benSlot && league.slotIsDrawn) return;
      if (takenIds.has(playerId)) return;
      if (currentPick > lastPick) return;
      const player = playerById(playerId);
      if (!player) return;
      setUserPicks((prev) => [
        ...prev,
        { overallPick: currentPick, playerId, source: "user" },
      ]);
      setHighlight(0);
    },
    [benSlot, league.slotIsDrawn, takenIds, currentPick, lastPick],
  );

  const undo = useCallback(() => {
    setUserPicks((prev) => prev.slice(0, -1));
    setHighlight(0);
  }, []);

  const reset = useCallback(() => {
    setUserPicks([]);
    if (league.slotIsDrawn) setCobraSlot(null);
    clearDraft(leagueId);
    setHydrated(true);
    setHighlight(0);
  }, [league.slotIsDrawn, leagueId]);

  const setLeagueId = useCallback((id: string) => {
    setHydrated(false);
    setLeagueIdState(id);
  }, []);

  const chooseCobraSlot = useCallback((slot: number) => {
    setCobraSlot(slot);
  }, []);

  const applySyncPicks = useCallback((result: ApplyCbsPicksResult) => {
    setUserPicks(result.livePicks);
    setHighlight(0);
  }, []);

  return {
    league,
    leagueId,
    setLeagueId,
    cobraSlot,
    chooseCobraSlot,
    benSlot,
    draftOrder,
    keepers,
    keeperList,
    keeperNums,
    keeperPlayerIds,
    userPicks,
    pickByOverall,
    takenIds,
    currentPick,
    lastPick,
    round,
    onClockTeam,
    onClockSlot,
    benOnClock,
    draftOver,
    rec,
    recPick,
    available,
    query,
    setQuery,
    posFilter,
    setPosFilter,
    highlight,
    setHighlight,
    benPlayers,
    rosterSlots,
    faQueue,
    markDrafted,
    applySyncPicks,
    undo,
    reset,
    hydrated,
    canUndo: userPicks.length > 0,
    canDraft: Boolean(benSlot || !league.slotIsDrawn) && currentPick <= lastPick,
  };
}
