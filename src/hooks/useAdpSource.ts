"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adpSourceKey,
  bannerForSource,
  defaultAdpSourceForLeague,
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
  leagueId?: string,
) {
  const leagueDefault = defaultAdpSourceForLeague(catalog, leagueId);
  const [sourceId, setSourceIdState] = useState(leagueDefault);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(adpSourceKey(leagueId));
    setSourceIdState(resolveAdpSourceId(catalog, saved, leagueId));
    setHydrated(true);
  }, [catalog, leagueId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(adpSourceKey(leagueId), sourceId);
  }, [hydrated, sourceId, leagueId]);

  const setSourceId = useCallback(
    (id: string) => {
      setSourceIdState(resolveAdpSourceId(catalog, id, leagueId));
    },
    [catalog, leagueId],
  );

  const players = useMemo(
    () => rankedPlayersForSource(basePlayers, catalog, boards, sourceId),
    [basePlayers, catalog, boards, sourceId],
  );

  const banner = useMemo(
    () => bannerForSource(catalog, sourceId, fallbackBanner),
    [catalog, sourceId, fallbackBanner],
  );

  return { sourceId, setSourceId, players, banner, catalog, leagueDefault };
}
