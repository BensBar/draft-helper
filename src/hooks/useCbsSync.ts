"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyCbsPicks,
  allowedSyncOrigin,
  CBS_SYNC_CHANNEL,
  CBS_SYNC_STORAGE_KEY,
  isCbsSyncPayload,
  namesFromPayload,
  parsePastedNames,
  type ApplyCbsPicksResult,
  type CbsSyncPayload,
  type CbsSyncSource,
} from "@/lib/cbs-sync";
import type { Player } from "@/lib/types";

export type CbsSyncUi = {
  state: "idle" | "listening" | "applied";
  source: CbsSyncSource | null;
  lastAt: number | null;
  lastName: string | null;
  liveCount: number;
  unmatched: string[];
};

const IDLE: CbsSyncUi = {
  state: "idle",
  source: null,
  lastAt: null,
  lastName: null,
  liveCount: 0,
  unmatched: [],
};

export function useCbsSync({
  players,
  keeperPlayerIds,
  keeperPickNums,
  teams,
  rounds,
  onApply,
}: {
  players: Player[];
  keeperPlayerIds: Set<string>;
  keeperPickNums: Set<number>;
  teams: number;
  rounds: number;
  onApply: (result: ApplyCbsPicksResult) => void;
}) {
  const [status, setStatus] = useState<CbsSyncUi>(IDLE);

  const ingest = useCallback(
    (payload: CbsSyncPayload) => {
      const { names, overalls } = namesFromPayload(payload);
      const result = applyCbsPicks({
        names,
        overalls,
        players,
        keeperPlayerIds,
        keeperPickNums,
        teams,
        rounds,
      });
      onApply(result);
      const last = result.matched[result.matched.length - 1];
      setStatus({
        state: "applied",
        source: payload.source,
        lastAt: Date.now(),
        lastName: last?.name ?? null,
        liveCount: result.livePicks.length,
        unmatched: result.unmatched,
      });
    },
    [players, keeperPlayerIds, keeperPickNums, teams, rounds, onApply],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!allowedSyncOrigin(event.origin)) return;
      if (!isCbsSyncPayload(event.data)) return;
      ingest(event.data);
      try {
        new BroadcastChannel(CBS_SYNC_CHANNEL).postMessage(event.data);
      } catch {
        /* companion-to-companion relay */
      }
    };
    const channel = new BroadcastChannel(CBS_SYNC_CHANNEL);
    const onChannel = (event: MessageEvent) => {
      if (!isCbsSyncPayload(event.data)) return;
      ingest(event.data);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CBS_SYNC_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as unknown;
        if (isCbsSyncPayload(parsed)) ingest(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    channel.addEventListener("message", onChannel);
    window.addEventListener("storage", onStorage);
    setStatus((s) => (s.state === "idle" ? { ...s, state: "listening" } : s));
    return () => {
      window.removeEventListener("message", onMessage);
      channel.removeEventListener("message", onChannel);
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [ingest]);

  const applyPaste = useCallback(
    (text: string) => {
      const names = parsePastedNames(text);
      ingest({
        type: "bensbar-draft-sync",
        version: 1,
        source: "paste",
        names,
      });
    },
    [ingest],
  );

  return { status, applyPaste };
}
