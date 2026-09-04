"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseRankedQueue, prequeueKey, type ParsedPreQueue } from "@/lib/prequeue";
import type { Player } from "@/lib/types";

export function usePreQueue(leagueId: string, players: Player[]) {
  const [raw, setRaw] = useState("");
  const [loadedRaw, setLoadedRaw] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(prequeueKey(leagueId)) ?? "";
      setRaw(saved);
      setLoadedRaw(saved);
    } catch {
      setRaw("");
      setLoadedRaw("");
    }
    setHydrated(true);
  }, [leagueId]);

  const parsed: ParsedPreQueue = useMemo(
    () => parseRankedQueue(loadedRaw, players),
    [loadedRaw, players],
  );

  const load = useCallback(
    (text: string) => {
      const next = text.trim();
      setRaw(next);
      setLoadedRaw(next);
      try {
        if (next) window.localStorage.setItem(prequeueKey(leagueId), next);
        else window.localStorage.removeItem(prequeueKey(leagueId));
      } catch {
        /* ignore quota */
      }
    },
    [leagueId],
  );

  const clear = useCallback(() => load(""), [load]);

  return { raw, setRaw, loadedRaw, parsed, load, clear, hydrated, active: parsed.matched.length > 0 };
}
