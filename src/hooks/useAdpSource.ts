"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADP_SOURCE_KEY,
  bannerForSource,
  rankedPlayersForSource,
  resolveAdpSourceId,
  type AdpBoard,
  type AdpSourcesFile,
} from "@/lib/adp";
import type { Player } from "@/lib/types";

export function useAdpSource(
  basePlayers: Player[],
  catalog: AdpSourcesFile,
  boards: Record<string, AdpBoard>,
  fallbackBanner: string,
) {
  const [sourceId, setSourceIdState] = useState(catalog.defaultSourceId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(ADP_SOURCE_KEY);
    setSourceIdState(resolveAdpSourceId(catalog, saved));
    setHydrated(true);
  }, [catalog]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ADP_SOURCE_KEY, sourceId);
  }, [hydrated, sourceId]);

  const setSourceId = useCallback(
    (id: string) => {
      setSourceIdState(resolveAdpSourceId(catalog, id));
    },
    [catalog],
  );

  const players = useMemo(
    () => rankedPlayersForSource(basePlayers, catalog, boards, sourceId),
    [basePlayers, catalog, boards, sourceId],
  );

  const banner = useMemo(
    () => bannerForSource(catalog, sourceId, fallbackBanner),
    [catalog, sourceId, fallbackBanner],
  );

  return { sourceId, setSourceId, players, banner, catalog };
}
