#!/usr/bin/env node
/**
 * Fetch public ADP boards into /data. No logins. No CBS password.
 *
 *   npm run refresh-adp
 *
 * Gil's must-write CBS 8/31 numbers always win on data/players.json
 * (Gable historical board). Cobra default is raw CBS Non-PPR in
 * data/adp-cbs-public.json (no Gil overlay). CBS PPR is an extra toggle.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const CACHE = join(ROOT, ".adp-cache");
const FETCHED = "2026-08-31";
const UA = "draft-helper-adp-refresh/1.0 (+https://github.com/BensBar/draft-helper)";

const MUST_WRITE = {
  "james cook": 7.3,
  "derrick henry": 7.77,
  "christian mccaffrey": 8.03,
  "amon ra st brown": 11.86,
  "saquon barkley": 11.95,
  "chase brown": 12.81,
  "omarion hampton": 19.17,
  "ashton jeanty": 21.93,
  "josh jacobs": 37.84,
  "drake london": 24.22,
  "a j brown": 23.72,
  "aj brown": 23.72,
  "ceedee lamb": 18.19,
  "justin jefferson": 19.86,
  "rashee rice": 27.34,
  "malik nabers": 35.66,
  "bhayshul tuten": 51.05,
  "jadarian price": 52.7,
  "j k dobbins": 74.12,
  "jk dobbins": 74.12,
  "marshawn lloyd": 106.57,
  "carnell tate": 100.79,
  "mike washington jr": 122.97,
  "mike washington": 122.97,
  "kaleb johnson": 213,
};

function norm(raw) {
  return String(raw)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´.]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(jr|sr|iii|ii|iv)\b/g, " ")
    .replace(/\b(dst|d st|def|defense|team)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function writeJson(path, obj) {
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`);
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers: { "user-agent": UA, ...headers }, redirect: "follow" });
  const text = await res.text();
  return { ok: res.ok, status: res.status, url: res.url, text };
}

function extractJsonObject(src, startIdx) {
  let i = startIdx;
  while (i < src.length && src[i] !== "{" && src[i] !== "[") i += 1;
  const open = src[i];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = i; j < src.length; j += 1) {
    const ch = src[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  throw new Error("unbalanced JSON");
}

function parseFpTable(html) {
  const marker = '"table":{"fields":';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error("FantasyPros table JSON not found");
  return JSON.parse(extractJsonObject(html, i + '"table":'.length));
}

function parseCbsAverages(html) {
  const rows = [];
  const re = /<tr class="TableBase-bodyTr">([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const block = m[1];
    const long = block.match(
      /CellPlayerName--long[\s\S]*?<a href="[^"]+"[^>]*>([^<]+)<\/a>[\s\S]*?CellPlayerName-position">\s*([^<]+?)\s*<\/span>[\s\S]*?CellPlayerName-team">\s*([^<]+?)\s*<\/span>/,
    );
    if (!long) continue;
    const tds = [...block.matchAll(/<td class="TableBase-bodyTd[\s\S]*?<\/td>/g)].map((x) =>
      x[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );
    const rank = Number(tds[0]);
    const adp = Number(tds[3]);
    if (!Number.isFinite(rank) || !Number.isFinite(adp)) continue;
    rows.push({
      name: long[1].trim(),
      position: long[2].trim(),
      nflTeam: long[3].trim(),
      overallRank: rank,
      adp,
    });
  }
  return rows;
}

function yahooPlayers(doc) {
  const bag = doc?.fantasy_content?.game?.[1]?.players;
  if (!bag) return [];
  const out = [];
  for (const [k, block] of Object.entries(bag)) {
    if (k === "count" || !block?.player) continue;
    const [meta, extra] = block.player;
    let name;
    let pos;
    let team;
    for (const item of meta) {
      if (item?.name?.full) name = item.name.full;
      if (item?.display_position) pos = item.display_position;
      if (item?.editorial_team_abbr) team = String(item.editorial_team_abbr).toUpperCase();
    }
    const da = extra?.draft_analysis ?? [];
    const pick = da.find((x) => x.average_pick != null)?.average_pick;
    const adp = Number(pick);
    if (!name || !Number.isFinite(adp) || adp <= 0) continue;
    out.push({ name, position: pos, nflTeam: team, adp });
  }
  out.sort((a, b) => a.adp - b.adp);
  return out.map((p, i) => ({ ...p, overallRank: i + 1 }));
}

const ESPN_POS = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "DST" };

function espnPlayers(doc) {
  const out = [];
  for (const row of doc.players ?? []) {
    const p = row.player;
    if (!p) continue;
    const adp = Number(p.ownership?.averageDraftPosition);
    const rank = Number(p.draftRanksByRankType?.PPR?.rank);
    if (!Number.isFinite(adp) || adp <= 0) continue;
    let name = p.fullName;
    const pos = ESPN_POS[p.defaultPositionId] ?? "";
    if (pos === "DST" && p.proTeamId) name = name.replace(/\s*D\/ST\s*$/i, "").trim();
    out.push({
      name,
      position: pos,
      nflTeam: "",
      adp,
      overallRank: Number.isFinite(rank) ? rank : 0,
    });
  }
  out.sort((a, b) => a.adp - b.adp);
  return out.map((p, i) => ({ ...p, overallRank: p.overallRank || i + 1 }));
}

function boardFile({ id, source, url, fetched, scoring, status, skipReason, notes, players }) {
  return {
    id,
    source,
    url: url ?? null,
    fetched,
    scoring,
    status,
    skipReason: skipReason ?? null,
    notes: notes ?? null,
    playerCount: players?.length ?? 0,
    players: players ?? [],
  };
}

function applyMustWrite(rows) {
  return rows.map((r) => {
    const adp = MUST_WRITE[norm(r.name)];
    return adp != null ? { ...r, adp } : r;
  });
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const catalog = [];
  const boards = {};

  const playersDoc = JSON.parse(readFileSync(join(DATA, "players.json"), "utf8"));

  // --- CBS public draft averages ---
  // Default /averages/ page is Non-PPR. PPR lives at /ppr/both/h2h/all/.
  // CBS has no public half-PPR board (404). Cobra default = raw Non-PPR, no Gil overlay.
  const CBS_TODAY = "2026-09-04";
  let cbsRows = [];
  let cbsSkip = null;
  try {
    const cbs = await fetchText("https://www.cbssports.com/fantasy/football/draft/averages/");
    writeFileSync(join(CACHE, "cbs-averages.html"), cbs.text);
    if (!cbs.ok) cbsSkip = `HTTP ${cbs.status}`;
    else {
      cbsRows = parseCbsAverages(cbs.text);
      if (cbsRows.length < 50) cbsSkip = `parsed only ${cbsRows.length} rows`;
    }
  } catch (err) {
    cbsSkip = String(err);
  }

  let cbsPprRows = [];
  let cbsPprSkip = null;
  try {
    const cbsPpr = await fetchText("https://www.cbssports.com/fantasy/football/draft/averages/ppr/both/h2h/all/");
    writeFileSync(join(CACHE, "cbs-averages-ppr.html"), cbsPpr.text);
    if (!cbsPpr.ok) cbsPprSkip = `HTTP ${cbsPpr.status}`;
    else {
      cbsPprRows = parseCbsAverages(cbsPpr.text);
      if (cbsPprRows.length < 50) cbsPprSkip = `parsed only ${cbsPprRows.length} rows`;
    }
  } catch (err) {
    cbsPprSkip = String(err);
  }

  if (cbsSkip) {
    boards["cbs-public"] = boardFile({
      id: "cbs-public",
      source: "CBS Sports public draft averages — Non-PPR",
      url: "https://www.cbssports.com/fantasy/football/draft/averages/",
      fetched: CBS_TODAY,
      scoring: "Non-PPR",
      status: "skipped",
      skipReason: cbsSkip,
      players: [],
    });
    catalog.push({
      id: "cbs-public",
      label: "CBS Non-PPR 9/4",
      banner: `CBS Non-PPR ADP skipped — ${cbsSkip}`,
      fetched: CBS_TODAY,
      scoring: "Non-PPR",
      status: "skipped",
      skipReason: cbsSkip,
      file: "adp-cbs-public.json",
      blend: false,
    });
  } else {
    const ranked = cbsRows.sort((a, b) => a.adp - b.adp).map((p, i) => ({ ...p, overallRank: i + 1 }));
    boards["cbs-public"] = boardFile({
      id: "cbs-public",
      source: "CBS Sports public draft averages — Non-PPR",
      url: "https://www.cbssports.com/fantasy/football/draft/averages/",
      fetched: CBS_TODAY,
      scoring: "Non-PPR",
      status: "ok",
      notes:
        "Public CBS Non-PPR averages (default /averages/ page). No login. No Gil overlay. Closest CBS board to Cobra half-PPR / pass TD 6 — CBS has no public half-PPR ADP.",
      players: ranked,
    });
    catalog.push({
      id: "cbs-public",
      label: "CBS Non-PPR 9/4",
      banner: "CBS Non-PPR ADP Sep 4 2026 — Cobra default. Closest CBS (no public half-PPR). Not a live draft feed.",
      fetched: CBS_TODAY,
      scoring: "Non-PPR",
      status: "ok",
      file: "adp-cbs-public.json",
      blend: false,
    });
  }

  boards["cbs-ppr"] = boardFile({
    id: "cbs-ppr",
    source: "CBS Sports public draft averages — PPR",
    url: "https://www.cbssports.com/fantasy/football/draft/averages/ppr/both/h2h/all/",
    fetched: CBS_TODAY,
    scoring: "PPR",
    status: cbsPprSkip ? "skipped" : "ok",
    skipReason: cbsPprSkip,
    notes: cbsPprSkip
      ? null
      : "Public CBS PPR averages. Extra toggle — Cobra default is Non-PPR.",
    players: cbsPprSkip
      ? []
      : cbsPprRows.sort((a, b) => a.adp - b.adp).map((p, i) => ({ ...p, overallRank: i + 1 })),
  });
  catalog.push({
    id: "cbs-ppr",
    label: "CBS PPR 9/4",
    banner: cbsPprSkip
      ? `CBS PPR ADP skipped — ${cbsPprSkip}`
      : "CBS PPR ADP Sep 4 2026 — extra toggle. Cobra scoring is half-PPR / pass TD 6.",
    fetched: CBS_TODAY,
    scoring: "PPR",
    status: cbsPprSkip ? "skipped" : "ok",
    skipReason: cbsPprSkip,
    file: "adp-cbs-ppr.json",
    blend: false,
  });

  // --- FantasyPros public PPR ADP HTML ---
  let fpRows = [];
  let fpSkip = null;
  let fpSleeper = [];
  try {
    const fp = await fetchText("https://www.fantasypros.com/nfl/adp/ppr-overall.php");
    writeFileSync(join(CACHE, "fp-ppr.html"), fp.text);
    if (!fp.ok) fpSkip = `HTTP ${fp.status}`;
    else {
      const table = parseFpTable(fp.text);
      fpRows = table.rows.map((r) => ({
        name: r.player.name,
        position: String(r.pos).replace(/\d+/g, ""),
        nflTeam: String(r.player.team).replace(/\s*\(\d+\)\s*$/, ""),
        adp: Number(r.avg),
        overallRank: Number(r.rank),
        sleeperAdp: Number(r.src_4350),
      }));
      fpSleeper = fpRows
        .filter((r) => Number.isFinite(r.sleeperAdp) && r.sleeperAdp > 0)
        .map((r) => ({
          name: r.name,
          position: r.position,
          nflTeam: r.nflTeam,
          adp: r.sleeperAdp,
          overallRank: r.sleeperAdp,
        }))
        .sort((a, b) => a.adp - b.adp)
        .map((p, i) => ({ ...p, overallRank: i + 1 }));
      if (fpRows.length < 50) {
        fpSkip =
          fpRows.length <= 5
            ? "Public HTML only embeds a 5-row preview; full table is client-loaded. Official JSON API returned 403 without x-api-key. CSV export is not a public file."
            : `parsed only ${fpRows.length} rows`;
      }
    }
  } catch (err) {
    fpSkip = String(err);
  }

  boards.fantasypros = boardFile({
    id: "fantasypros",
    source: "FantasyPros consensus PPR ADP",
    url: "https://www.fantasypros.com/nfl/adp/ppr-overall.php",
    fetched: FETCHED,
    scoring: "PPR",
    status: fpSkip ? "skipped" : "ok",
    skipReason: fpSkip,
    notes: fpSkip
      ? null
      : "Public HTML table (AVG of ESPN/Sleeper/CBS/RTSports/Fantrax). Official JSON API needs an x-api-key — not used.",
    players: fpSkip ? [] : fpRows.map(({ sleeperAdp: _s, ...r }) => r),
  });
  catalog.push({
    id: "fantasypros",
    label: "FantasyPros",
    banner: fpSkip
      ? `FantasyPros ADP skipped — ${fpSkip}`
      : "FantasyPros consensus PPR ADP Aug 31 2026",
    fetched: FETCHED,
    scoring: "PPR",
    status: fpSkip ? "skipped" : "ok",
    skipReason: fpSkip,
    file: "adp-fantasypros.json",
    blend: !fpSkip,
  });

  // Sleeper first-party /v1/players/nfl has no ADP field (checked 8/31).
  // Use Sleeper column published on the public FantasyPros PPR ADP page.
  const sleeperSkip =
    fpSleeper.length < 50
      ? "api.sleeper.app/v1/players/nfl is public but has no ADP field in 2026. FantasyPros' Sleeper column is not fully public (HTML preview only). Not faking numbers."
      : null;
  boards.sleeper = boardFile({
    id: "sleeper",
    source: "Sleeper ADP as published on FantasyPros",
    url: "https://www.fantasypros.com/nfl/adp/ppr-overall.php",
    fetched: FETCHED,
    scoring: "PPR",
    status: sleeperSkip ? "skipped" : "ok",
    skipReason: sleeperSkip,
    notes:
      "api.sleeper.app/v1/players/nfl is public but has no adp_ppr in 2026. Numbers here are the Sleeper column on FantasyPros' public PPR ADP page (source dated Aug 30 2026). Not a Sleeper login scrape.",
    players: sleeperSkip ? [] : fpSleeper,
  });
  catalog.push({
    id: "sleeper",
    label: "Sleeper",
    banner: sleeperSkip
      ? `Sleeper ADP skipped — ${sleeperSkip}`
      : "Sleeper ADP via FantasyPros public composite (source dated Aug 30), fetched Aug 31 2026",
    fetched: FETCHED,
    scoring: "PPR",
    status: sleeperSkip ? "skipped" : "ok",
    skipReason: sleeperSkip,
    file: "adp-sleeper.json",
    blend: !sleeperSkip,
  });

  // --- ESPN public league-defaults API ---
  let espnRows = [];
  let espnSkip = null;
  try {
    const espn = await fetchText(
      "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/3?view=kona_player_info",
      {
        "X-Fantasy-Filter": JSON.stringify({
          players: { limit: 400, sortPercOwned: { sortPriority: 4, sortAsc: false } },
        }),
      },
    );
    writeFileSync(join(CACHE, "espn.json"), espn.text);
    if (!espn.ok) espnSkip = `HTTP ${espn.status}`;
    else {
      espnRows = espnPlayers(JSON.parse(espn.text));
      if (espnRows.length < 50) espnSkip = `parsed only ${espnRows.length} rows`;
    }
  } catch (err) {
    espnSkip = String(err);
  }
  boards.espn = boardFile({
    id: "espn",
    source: "ESPN public PPR ADP",
    url: "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leaguedefaults/3?view=kona_player_info",
    fetched: FETCHED,
    scoring: "PPR",
    status: espnSkip ? "skipped" : "ok",
    skipReason: espnSkip,
    notes: espnSkip ? null : "Public ESPN fantasy API (PPR league default 3). No league login.",
    players: espnSkip ? [] : espnRows,
  });
  catalog.push({
    id: "espn",
    label: "ESPN",
    banner: espnSkip ? `ESPN ADP skipped — ${espnSkip}` : "ESPN PPR ADP Aug 31 2026",
    fetched: FETCHED,
    scoring: "PPR",
    status: espnSkip ? "skipped" : "ok",
    skipReason: espnSkip,
    file: "adp-espn.json",
    blend: !espnSkip,
  });

  // --- Yahoo public draft_analysis ---
  let yahooRows = [];
  let yahooSkip = null;
  try {
    const yahoo = await fetchText(
      "https://pub-api-ro.fantasysports.yahoo.com/fantasy/v2/game/nfl/players;sort=OR;out=draft_analysis;count=400;start=0?format=json",
    );
    writeFileSync(join(CACHE, "yahoo.json"), yahoo.text);
    if (!yahoo.ok) yahooSkip = `HTTP ${yahoo.status}`;
    else {
      yahooRows = yahooPlayers(JSON.parse(yahoo.text));
      if (yahooRows.length < 50) yahooSkip = `parsed only ${yahooRows.length} rows`;
    }
  } catch (err) {
    yahooSkip = String(err);
  }
  boards.yahoo = boardFile({
    id: "yahoo",
    source: "Yahoo public draft analysis ADP",
    url: "https://pub-api-ro.fantasysports.yahoo.com/fantasy/v2/game/nfl/players;out=draft_analysis;count=400?format=json",
    fetched: FETCHED,
    scoring: "Yahoo (half-PPR typical)",
    status: yahooSkip ? "skipped" : "ok",
    skipReason: yahooSkip,
    notes: yahooSkip
      ? null
      : "Public Yahoo Fantasy read API (no login). Scoring is Yahoo default, usually half-PPR.",
    players: yahooSkip ? [] : yahooRows,
  });
  catalog.push({
    id: "yahoo",
    label: "Yahoo",
    banner: yahooSkip
      ? `Yahoo ADP skipped — ${yahooSkip}`
      : "Yahoo public draft analysis ADP Aug 31 2026",
    fetched: FETCHED,
    scoring: "Yahoo",
    status: yahooSkip ? "skipped" : "ok",
    skipReason: yahooSkip,
    file: "adp-yahoo.json",
    blend: !yahooSkip,
  });

  // --- Update default board (players.json) from CBS + must-write ---
  const byNorm = new Map();
  for (const row of cbsRows) byNorm.set(norm(row.name), row);

  const updated = playersDoc.players.map((p) => {
    const key = norm(p.name);
    const cbs = byNorm.get(key);
    const must = MUST_WRITE[key];
    const next = { ...p };
    if (must != null) next.adp = must;
    else if (cbs) next.adp = cbs.adp;

    if (p.id === "ashton-jeanty") {
      next.injury = "ankle / Wk1 Q";
      next.notes =
        "Still ankle. Kubiak 8/28 counting on him Wk1, not guaranteed. Stays on the Gable 12/13 pile — not a fade.";
    }
    if (p.id === "malik-nabers") {
      next.injury = "ACL Q Wk1";
    }
    if (p.id === "josh-jacobs") {
      next.fade = true;
      next.injury = "Exempt 8/30 — OUT Wk1 / RESERVE-CEL";
      next.notes =
        "RESERVE-CEL. Exempt list 8/30 — OUT to open season, not a final suspension. CBS ADP 37.84. FADE everywhere — never draft. GB stash is MarShawn Lloyd, not Kaleb Johnson.";
    }
    if (p.id === "kaleb-johnson") {
      next.adp = 213;
      next.fade = true;
      delete next.sleeper;
      next.notes =
        "Not in CBS top 211 (ADP ~213). Not a 12-team pick. Do not stash — GB exposure is Lloyd. Fade.";
    }
    if (p.id === "jadarian-price") {
      next.nflTeam = "SEA";
      next.notes =
        "SEA lead — Charbonnet PUP ≥4 games. CBS ADP 52.70 is R5, not a sleeper. Prefer slightly over Tuten if both there.";
    }
    if (p.id === "bhayshul-tuten") {
      next.notes = "CBS ADP 51.05 is R5, not a sleeper.";
    }
    if (p.id === "marshawn-lloyd") {
      next.sleeper = true;
      next.notes =
        "GB stash — expected to lead with Chris Brooks. CBS ADP 106.57 is R9, not a R13 dart. Not Jacobs. Not Kaleb Johnson.";
    }
    if (p.id === "mike-washington-jr") {
      next.notes = "CBS ADP 122.97. Only if Jeanty already drafted (Gil 8/31).";
    }
    return next;
  });

  updated.sort((a, b) => a.adp - b.adp || a.name.localeCompare(b.name));
  updated.forEach((p, i) => {
    p.overallRank = i + 1;
  });

  const gilPlayers = updated.map((p) => ({
    name: p.name,
    position: p.position,
    nflTeam: p.nflTeam,
    adp: p.adp,
    overallRank: p.overallRank,
  }));

  boards.gil = boardFile({
    id: "gil",
    source: "CBS public ADP — Gil's board",
    url: "https://www.cbssports.com/fantasy/football/draft/averages/",
    fetched: FETCHED,
    scoring: "PPR",
    status: "ok",
    notes:
      "Default board. CBS public draft averages fetched Mon 8/31 evening, plus Gil must-write ADPs and flags. Not a live CBS draft-room feed.",
    players: gilPlayers,
  });
  catalog.unshift({
    id: "gil",
    label: "Gil / CBS 8/31",
    banner: "CBS public ADP Aug 31 2026 — Gil's board (not a live draft feed)",
    fetched: FETCHED,
    scoring: "PPR",
    status: "ok",
    file: "adp-gil.json",
    blend: true,
  });

  // Consensus of unique publishers (Gil/CBS is one vote; raw cbs-public is not a second vote)
  const blendIds = catalog.filter((s) => s.status === "ok" && s.blend).map((s) => s.id);
  const sums = new Map();
  for (const id of blendIds) {
    const board = boards[id];
    for (const row of board.players) {
      const key = norm(row.name);
      const rec = sums.get(key) ?? { name: row.name, position: row.position, nflTeam: row.nflTeam, sum: 0, n: 0 };
      rec.sum += row.adp;
      rec.n += 1;
      sums.set(key, rec);
    }
  }
  const consensusPlayers = [...sums.values()]
    .map((r) => ({
      name: r.name,
      position: r.position,
      nflTeam: r.nflTeam,
      adp: Math.round((r.sum / r.n) * 100) / 100,
      sources: r.n,
    }))
    .sort((a, b) => a.adp - b.adp)
    .map((p, i) => ({ ...p, overallRank: i + 1 }));

  const blendLabels = catalog.filter((s) => s.status === "ok" && s.blend).map((s) => s.label);
  boards.consensus = boardFile({
    id: "consensus",
    source: `Consensus of ${blendLabels.join(" + ")}`,
    url: null,
    fetched: FETCHED,
    scoring: "mixed (PPR + Yahoo default)",
    status: "ok",
    notes: `Unweighted mean of ADP for names present on each ok blended source. CBS public is not a second vote — it is the same 8/31 fetch as Gil. Do not treat this as a live CBS feed.`,
    players: consensusPlayers,
  });
  catalog.push({
    id: "consensus",
    label: "Consensus",
    banner: `Consensus of ${blendLabels.join(" + ")}, fetched Aug 31 2026`,
    fetched: FETCHED,
    scoring: "mixed",
    status: "ok",
    file: "adp-consensus.json",
    blend: false,
  });

  writeJson(join(DATA, "players.json"), {
    source: "CBS public ADP — Gil's board, Aug 31 2026",
    scoring: "PPR",
    fetched: FETCHED,
    url: "https://www.cbssports.com/fantasy/football/draft/averages/",
    players: updated,
  });

  for (const [id, board] of Object.entries(boards)) {
    writeJson(join(DATA, `adp-${id === "cbs-public" ? "cbs-public" : id}.json`), board);
  }

  writeJson(join(DATA, "adp-sources.json"), {
    defaultSourceId: "gil",
    leagueDefaults: { gable: "gil", cobra: "cbs-public" },
    fetched: CBS_TODAY,
    scoring: "mixed",
    notes:
      "Cobra default is CBS public Non-PPR (data/adp-cbs-public.json). Gable default remains Gil's 8/31 board (data/players.json). Consensus averages unique publishers only (Gil + ESPN + Yahoo).",
    sources: catalog,
  });

  console.log(
    JSON.stringify(
      {
        fetched: FETCHED,
        cbsRows: cbsRows.length,
        sources: catalog.map((s) => `${s.id}:${s.status}`),
        mustWriteCook: updated.find((p) => p.id === "james-cook")?.adp,
        mustWriteKaleb: updated.find((p) => p.id === "kaleb-johnson")?.adp,
        priceTeam: updated.find((p) => p.id === "jadarian-price")?.nflTeam,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
