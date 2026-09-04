"use client";

import { useState } from "react";
import { bookmarkletHowTo, buildBookmarkletHref } from "@/lib/cbs-bookmarklet";
import type { CbsSyncUi } from "@/hooks/useCbsSync";
import type { League } from "@/lib/types";

function statusLine(status: CbsSyncUi, league: League): string {
  const last = status.lastName ? `last ${status.lastName}` : "no pick yet";
  const unmatched = status.unmatched.length;
  const host = league.id === "cobra" ? "ck22.football.cbssports.com" : "gable.football.cbssports.com";
  if (status.state === "idle") {
    return `idle · waiting — open HOW-TO, click the bookmarklet on ${host}`;
  }
  if (status.state === "listening") {
    return `listening · bookmarklet not seen yet · paste names if CBS blocks it · ${host}`;
  }
  const via = status.source === "paste" ? "paste" : status.source === "extension" ? "extension" : "bookmarklet";
  return `synced via ${via} · ${last} · ${status.liveCount} live · ${unmatched} unmatched`;
}

export function CbsSyncBar({
  status,
  onPaste,
  league,
}: {
  status: CbsSyncUi;
  onPaste: (text: string) => void;
  league: League;
}) {
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);

  const copyBookmarklet = async () => {
    const href = buildBookmarkletHref();
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this bookmarklet URL, then paste it as a bookmark:", href);
    }
  };

  const unmatched = status.unmatched.length;
  const cobra = league.id === "cobra";

  return (
    <section
      data-testid="cbs-sync"
      className="border-b border-[#232333] bg-[#0c0c12] px-3 py-1.5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="font-[family-name:var(--font-label)] tracking-[0.28em] text-[#2ef5ff]">
          CBS SYNC
        </span>
        <span data-testid="cbs-sync-status" className="text-[#d8d4c8]">
          {statusLine(status, league)}
        </span>
        <button
          type="button"
          data-testid="copy-bookmarklet"
          onClick={copyBookmarklet}
          className="px-2 py-0.5 bg-[#c6ff00] text-black font-[family-name:var(--font-label)] tracking-wider text-[11px]"
        >
          {copied ? "COPIED" : "COPY BOOKMARKLET"}
        </button>
        <button
          type="button"
          data-testid="cbs-sync-toggle"
          onClick={() => setOpen((v) => !v)}
          className="text-[#8b8b9a] hover:text-white text-[11px]"
        >
          {open ? "HIDE" : "HOW-TO / PASTE"}
        </button>
        {unmatched > 0 ? (
          <span className="text-[#ffb703]">Map unmatched in the list below, then click them in the pool.</span>
        ) : null}
      </div>
      {open ? (
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr] text-[12px] text-[#a8a4b0]">
          <div className="space-y-1">
            <p>{bookmarkletHowTo(league)}</p>
            {cobra ? (
              <p className="text-[#ffb703]">
                Paste fallback: one full name per line (Jahmyr Gibbs, not “a WR”). CBS is source of
                truth. No scrape/CORS backend — bookmarklet only.
              </p>
            ) : (
              <p>
                Works on <code>*.football.cbssports.com</code>. Bookmarklet polls every 2s. Keepers
                stay locked from JSON. ADP banner is not a live CBS feed.
              </p>
            )}
          </div>
          <div>
            <textarea
              data-testid="cbs-paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste taken names, one per line, if the bookmarklet can't run"
              className="w-full min-h-16 bg-[#12121a] border border-[#2a2a3a] px-2 py-1 text-[#f4f1ea] outline-none focus:border-[#c6ff00]"
            />
            <button
              type="button"
              data-testid="cbs-paste-apply"
              onClick={() => {
                if (paste.trim()) onPaste(paste);
              }}
              className="mt-1 px-2 py-0.5 border border-[#2ef5ff] text-[#2ef5ff] font-[family-name:var(--font-label)] tracking-wider"
            >
              APPLY PASTE
            </button>
          </div>
          {unmatched > 0 ? (
            <ul data-testid="cbs-unmatched" className="md:col-span-2 text-[#ffb703]">
              {status.unmatched.map((n) => (
                <li key={n}>unmatched: {n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : unmatched > 0 ? (
        <ul data-testid="cbs-unmatched" className="mt-1 text-[11px] text-[#ffb703]">
          {status.unmatched.slice(0, 6).map((n) => (
            <li key={n}>unmatched: {n}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
