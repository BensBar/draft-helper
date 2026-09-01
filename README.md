# LIVE DRAFT COMPANION

Flashy CBS draft-room companion for **Ben Stoll**. Open this **next to** the CBS live draft — it does not replace CBS.

Leagues:

- **Gable** (default through Thu 9/3/2026 8:00pm ET) — Stan Gable's All Americans, Ben's Bar Bruskis, pick 12
- **Cobra** — Cobra Craig, Ben's Bar, slot drawn at kickoff (1–12 picker, never hardcoded)

Default ranks are **CBS public draft averages** fetched Mon 8/31/2026 from [the public ADP page](https://www.cbssports.com/fantasy/football/draft/averages/) (no login), plus Gil's must-write numbers. The banner is honest:

> CBS public ADP Aug 31 2026 — Gil's board (not a live draft feed)

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

1. Lands on **Gable**. Bowers + Burden are already on his roster. All 24 keepers are **KEPT** on the board and out of the pool.
2. CBS starts. Click whoever just went — they leave the pool and fill the current overall pick.
3. When it is Ben's turn the **ON THE CLOCK** banner hits and the giant rec is the smash pick (75s clock; Gable robot autodrafts if he misses).
4. **Undo** if you mis-click. State persists in `localStorage` per league.
5. After 9/3, switch to **Cobra**, draw the live slot 1–12, and the rec engine + whose-turn math recompute from that slot.
6. **SCENARIOS** (header) is prep — tap trigger chips for if-this-then-that. GiantRec stays the live path. Overlay does not change rec-engine rules.

Keyboard: `Enter` / `D` mark highlighted player drafted · `U` undo · `↑↓` pool · `/` search · `C` clock.

## CBS live-draft sync (Pages)

Live site: [https://bensbar.github.io/draft-helper/](https://bensbar.github.io/draft-helper/)

GitHub Pages is **static**. The browser cannot fetch `cbssports.com` (CORS), we do not scrape CBS, and we do not use Ben’s CBS password. Sync is a **bookmarklet** (or optional unpacked Chrome extension) that Ben runs **on the CBS draft page**. It reads the live board DOM, matches names to `data/players.json`, and pushes the pick list to the companion via `postMessage` (origin-checked) plus `BroadcastChannel` `bensbar-draft-sync` (companion tabs) and a same-origin `sync-relay.html` iframe so the Pages tab can hear CBS.

### Install the bookmarklet

1. Open the companion ([Pages](https://bensbar.github.io/draft-helper/) or `http://localhost:3000`).
2. Click **COPY BOOKMARKLET** in the CBS SYNC bar.
3. Add a bookmark on the bookmarks bar. Edit it and paste the copied `javascript:…` as the URL. Name it `Ben draft sync`.

### Live draft (Gable Thu 9/3/2026 8:00pm ET)

1. Keep the companion open (Gable).
2. Open the CBS draft room (`*.football.cbssports.com` — Gable host `gable.football.cbssports.com`, Cobra `ck22.football.cbssports.com`).
3. Click **Ben draft sync** once. Leave both tabs open. It polls every ~2s.
4. After each CBS pick, GiantRec / next-8 recompute from the remaining pool. Ben does **not** click that player in the companion.
5. CBS is source of truth: a full replay **replaces** live `takenIds` only. Keepers stay locked from `data/keepers.json` and are never ingested again.
6. Unmatched CBS names show in a small list — search the pool and mark them, or fix the paste.
7. If the bookmarklet cannot run: **HOW-TO / PASTE** and paste names (one per line).

Optional: Chrome → `chrome://extensions` → Developer mode → Load unpacked → `extension/` in this repo. Same postMessage path. No CBS login in the extension.

The ADP banner stays honest about **whose board** is selected (Gil/CBS 8/31 by default). Sync is **picks only**, not a live ADP feed.

## ADP sources

Default board is **Gil / CBS 8/31** (`data/players.json`). Other public sources are extras — they change ADP/ordering of eligible players only.

| Control | What |
| --- | --- |
| **ADP SOURCE** bar | Gil / CBS 8/31 · CBS public · FantasyPros · ESPN · Sleeper · Yahoo · Consensus |
| Persistence | `localStorage` key `draft-helper:adp-source` |
| Rec rules | Unchanged. 12/13 pile, never Jacobs / Taylor / TE, never Kaleb Johnson as a stash |

Refresh from the public web (no passwords):

```bash
npm run refresh-adp
```

Writes dated files. Gil must-write ADPs always overwrite parsed CBS Avg Pos on `data/players.json`.

| File | Role |
| --- | --- |
| `data/players.json` | Default board (CBS public 8/31 + Gil flags/notes) |
| `data/adp-gil.json` | Same default board, dated |
| `data/adp-cbs-public.json` | Raw public CBS draft averages (same page; not a second consensus vote) |
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
| `data/rec-rules.json` | Gable 12/13 RB pile, 36/37, 60/61, R8+; Cobra slot-3 rules |
| `data/meta.json` | ADP banner copy + default-league cutoff |
| `data/adp-*.json` | Extra public ADP boards (see above) |
| `data/scenarios-gable.json` | Gable if-this-then-that tree (Gil drop-in copy) |
| `data/scenarios-cobra.json` | Thin Cobra tree — slot drawn at kickoff, not pick 3 |

## Scenarios (prep overlay)

Header **SCENARIOS** opens a prep overlay. GiantRec / next-8 / pool stay the live path underneath.

- **Gable first.** Tap trigger chips (S1–S5, S-36, S-60, S-84, S-109, S180, cheat sheet). Each page is TRIGGER → PICK → WHY → NEXT FORK.
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

3WR + FLEX all-play. Explosive WR/RB for 50-yd TD and 100-yd bonuses. Wait on QB. K/DST last two. If he draws **3**: leftover of Gibbs / Bijan / Chase, else Taylor / Nacua; round 2 best remaining RB/WR — do **not** take Josh Allen in R2.
