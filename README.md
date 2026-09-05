# LIVE DRAFT COMPANION

Flashy CBS draft-room companion for **Ben Stoll**. Open this **next to** the CBS live draft — it does not replace CBS.

Leagues:

- **Cobra** (default after Thu 9/3/2026) — Cobra Craig, Ben's Bar, live snake Thu 9/10/2026 5:00pm ET, 16 rounds, $165, all-play, half-PPR, pass TD 6, **no keepers**, slot drawn at kickoff (1–12 picker, never hardcoded)
- **Gable** (historical) — Stan Gable's All Americans, Ben's Bar Bruskis, pick 12, keepers locked

Cobra default ranks are **CBS public Non-PPR** fetched Sat 9/5/2026 from Gil’s board: [draft/averages/both/h2h/all](https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/) (no login). CBS PPR is a separate toggle. CBS has **no public half-PPR** board. Gable still uses Gil's 8/31 must-write board. The banner is honest about whichever source is selected.

Draft-night **handoff is operational** (Carlos/Gil), not an app feature: watch the CBS board → two picks out call **one full name + search** → Ben clicks. Preload the robot queue before kickoff. Live app: [bensbar.github.io/draft-helper](https://bensbar.github.io/draft-helper/).

This is **not** a live CBS draft-room ADP stream. Switch sources in the ADP SOURCE bar — that only reorders value, not rec-engine rules.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Laptop-first. No auth. No league passwords. No CBS logos.

| Script | What |
| --- | --- |
| `npm run dev` | Next.js App Router at [http://localhost:3000](http://localhost:3000) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Snake math + rec engine + ADP overlay + scenarios |
| `npm run refresh-adp` | Re-fetch public ADP into `data/adp-*.json` and refresh `data/players.json` (Gil must-write values always win) |
| `npm run build` | Static export to `out/` (no Pages path prefix) |

`next start` is not used for this app. GitHub Pages (and `npx serve out`) host the `out/` folder. JSON boards are bundled at build time from `data/`.

## GitHub Pages

Live URL: **https://bensbar.github.io/draft-helper/**

Public repo. GitHub Pages deploys from `main`.

Enable hosting once (does not change visibility):

1. Repo **Settings → Pages**
2. **Build and deployment → Source:** GitHub Actions

Pushes to `main` run `.github/workflows/pages.yml`: `npm ci`, `next build` with `GITHUB_PAGES=true` (so assets resolve under `/draft-helper/`), then `actions/upload-pages-artifact` + `actions/deploy-pages`.

Local `npm run dev` is unchanged — still [http://localhost:3000](http://localhost:3000), no `/draft-helper` prefix.

## How Ben uses it

1. Lands on **Cobra** (after 9/3). Slot is unknown — **DRAW YOUR SLOT 1–12** at kickoff. Never assume pick 3. GABLE tab is the historical keepers board.
2. Optional: paste a ranked **ROBOT / PRELOAD QUEUE** (full names, one per line) before the 75s clock. Smash uses that order once a slot is drawn. Josh Jacobs / Kaleb Johnson are stripped.
3. Open CBS (`ck22.football.cbssports.com`), click **COPY BOOKMARKLET** once on the draft page (or paste taken names). Companion does not scrape CBS.
4. When it is Ben's turn the **ON THE CLOCK** banner hits and the giant rec is the named smash pick. Queue works for any slot 1–12.
5. **Undo** if you mis-click. State persists in `localStorage` per league.
6. **SCENARIOS** (header) is prep — tap slot 1–12 chips for if-this-then-that. GiantRec stays the live path. Overlay does not change rec-engine rules.

Keyboard: `Enter` / `D` mark highlighted player drafted · `U` undo · `↑↓` pool · `/` search · `C` clock.

## CBS live-draft sync (Pages)

Live site: [https://bensbar.github.io/draft-helper/](https://bensbar.github.io/draft-helper/)

GitHub Pages is **static**. The browser cannot fetch `cbssports.com` (CORS), we do not scrape CBS, and we do not use Ben’s CBS password. Sync is a **bookmarklet** (or optional unpacked Chrome extension) that Ben runs **on the CBS draft page**. It reads the live board DOM, matches names to `data/players.json`, and pushes the pick list to the companion via `postMessage` (origin-checked) plus `BroadcastChannel` `bensbar-draft-sync` (companion tabs) and a same-origin `sync-relay.html` iframe so the Pages tab can hear CBS.

### Install the bookmarklet

1. Open the companion ([Pages](https://bensbar.github.io/draft-helper/) or `http://localhost:3000`).
2. Click **COPY BOOKMARKLET** in the CBS SYNC bar.
3. Add a bookmark on the bookmarks bar. Edit it and paste the copied `javascript:…` as the URL. Name it `Ben draft sync`.

### Live draft (Cobra Thu 9/10/2026 5:00pm ET)

1. Keep the companion open (**Cobra**). Draw slot 1–12 when CBS draws it.
2. Open the CBS draft room (`ck22.football.cbssports.com`). Gable historical: `gable.football.cbssports.com`.
3. Click **Ben draft sync** once. Leave both tabs open. It polls every ~2s.
4. After each CBS pick, GiantRec / next-8 recompute from the remaining pool. Ben does **not** click that player in the companion.
5. CBS is source of truth: a full replay **replaces** live `takenIds` only. Cobra has **no keepers**. On Gable, keepers stay locked from `data/keepers.json`.
6. Unmatched CBS names show in a small list — search the pool and mark them, or fix the paste.
7. If the bookmarklet cannot run: **HOW-TO / PASTE** and paste names (one per line, full names).

Optional: Chrome → `chrome://extensions` → Developer mode → Load unpacked → `extension/` in this repo. Same postMessage path. No CBS login in the extension.

The ADP banner stays honest about **whose board** is selected (Cobra = CBS Non-PPR 9/4; Gable = Gil/CBS 8/31). Sync is **picks only**, not a live ADP feed.

## ADP sources

Cobra default is **CBS Non-PPR Sep 5 2026** from [both/h2h/all](https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/) (`data/adp-cbs-public.json`) — closest CBS board; CBS has no public half-PPR / pass-TD-6 ADP. Gable default is **Gil / CBS 8/31** (`data/players.json`). Other public sources are extras — they change ADP/ordering of eligible players only.

| Control | What |
| --- | --- |
| **ADP SOURCE** bar | Gil / CBS 8/31 · CBS Non-PPR 9/5 · CBS PPR 9/4 · FantasyPros · ESPN · Sleeper · Yahoo · Consensus |
| Persistence | `localStorage` key `draft-helper:adp-source:<leagueId>` |
| Rec rules | Unchanged. Never Jacobs. MarShawn Lloyd not Kaleb Johnson. Cobra never Josh Allen in R2. |

Refresh from the public web (no passwords):

```bash
npm run refresh-adp
```

Writes dated files. Gil must-write ADPs always overwrite parsed CBS Avg Pos on `data/players.json`.

| File | Role |
| --- | --- |
| `data/players.json` | Gable historical board (CBS public 8/31 + Gil flags/notes) |
| `data/adp-gil.json` | Same Gable board, dated |
| `data/adp-cbs-public.json` | **Cobra default** — CBS Non-PPR Sep 5 2026 from [both/h2h/all](https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/) |
| `data/adp-cbs-ppr.json` | CBS PPR Sep 4 2026 extra toggle |
| `data/adp-espn.json` | ESPN public PPR league-defaults API |
| `data/adp-yahoo.json` | Yahoo public `draft_analysis` API (no login) |
| `data/adp-fantasypros.json` | **Skipped 8/31** — public HTML is a 5-row preview; JSON API is 403 without a key |
| `data/adp-sleeper.json` | **Skipped 8/31** — Sleeper players API has no ADP field; not faked |
| `data/adp-consensus.json` | Mean of Gil + ESPN + Yahoo only |
| `data/adp-sources.json` | Catalog, banners, skip reasons |

Do not treat Consensus or ESPN/Yahoo as a live CBS feed. If a source is skipped, the button is disabled and the skip reason is in the tooltip + this README.

## Data layer (Gil diffs here)

Swap boards without rewriting UI:

| File | Contents |
| --- | --- |
| `data/leagues.json` | Settings, scoring, roster, draft order, URLs |
| `data/players.json` | 2026 players — CBS 8/31 ADP + Gil notes |
| `data/keepers.json` | All 24 Gable keepers (round cost + team) |
| `data/rec-rules.json` | Gable 12/13 RB pile, 36/37, 60/61, R8+; Cobra named leftover + never Allen in R2 |
| `data/meta.json` | ADP banner copy + default-league cutoff |
| `data/adp-*.json` | Extra public ADP boards (see above) |
| `data/scenarios-gable.json` | Gable if-this-then-that tree (Gil drop-in copy) |
| `data/scenarios-cobra.json` | Cobra if-this-then-that — slots 1–12, R2 never Allen, mid, Lloyd, K/DST |

## Scenarios (prep overlay)

Header **SCENARIOS** opens a prep overlay. GiantRec / next-8 / pool stay the live path underneath.

- **Cobra night:** tap slot chips 1–12 (not pick 3 by default), then R2 / mid / Lloyd / K/DST / cheat. Gable tab is historical (S1–S5, S-36, S-60, S-84, S-109, S180). Each page is TRIGGER → PICK → WHY → NEXT FORK.
- Pick 36 is a **single** live pick. 37 = Bowers KEPT skip. 108 = Burden KEPT skip.
- Ordering inside a locked set follows the selected ADP source, except listed else-chains (Saquon else Chase Brown) and **Price over Tuten**.
- Swap copy in `data/scenarios-gable.json` / `data/scenarios-cobra.json` without rewriting UI.
- Rec-engine from-lists stay locked. Never Jacobs / Taylor / TE / QB at 12/13. Do not stash Kaleb Johnson.

## Gable rec (precomputed, 75s)

- **12/13** — two RBs from leftover of CMC, Cook, Chase Brown, Henry, Barkley, Hampton, Jeanty. No TE/QB. Never Jacobs. Never Taylor. Live CBS 8/31: Cook/Henry/CMC ~7–8 (often gone); doorstep Saquon + Chase Brown; then Hampton / Jeanty (Q).
- **36/37** — WR/RB (ARSB, Lamb, Jefferson, London, AJ Brown, Rice, Nico, Nabers, leftover Henry). Never TE. (R4 37 is Bowers **KEPT**.)
- **60/61** — Tuten (51) or Price (53) are R5, not sleepers. Price is SEA lead (Charbonnet PUP ≥4). Prefer Price slightly if both there. Maye is kept.
- **R8+** — Dobbins, Tate, Lloyd (~107 / R9), Shaheed. Washington Jr. only if Jeanty already drafted. Kaleb Johnson is **not** a 12-team pick / not a stash.
- **DST/K last.** DEN DST is a trap.

Ben starts: TE done (Bowers), one WR (Burden, groin Q). Holes: QB, RB, RB, WR, WR, FLEX, K, DST. Waiver **1 of 12** does not reset — post-draft FA queue is the recovery lever.

## Cobra rec

3WR + FLEX all-play. Smash leftover **Jahmyr Gibbs / Bijan Robinson / Ja'Marr Chase / Jonathan Taylor / Puka Nacua**. Wait on Josh Allen until ~R7. K/DST last two. If he draws **3**: leftover of Jahmyr Gibbs / Bijan Robinson / Ja'Marr Chase, else Jonathan Taylor / Puka Nacua. Round 2 leftover skill — do **not** take Josh Allen. Fade Josh Jacobs (CEL). MarShawn Lloyd is climbing (CBS Non-PPR ~87) but still a reach — never confuse with Kaleb Johnson. Slot is unknown until kickoff — picker 1–12, never hardcoded.
