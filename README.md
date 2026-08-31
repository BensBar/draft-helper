# LIVE DRAFT COMPANION

Flashy CBS draft-room companion for **Ben Stoll**. Open this **next to** the CBS live draft — it does not replace CBS.

Leagues:

- **Gable** (default through Thu 9/3/2026 8:00pm ET) — Stan Gable's All Americans, Ben's Bar Bruskis, pick 12
- **Cobra** — Cobra Craig, Ben's Bar, slot drawn at kickoff (1–12 picker, never hardcoded)

All ranks are **sample** data. The banner always reads:

> Sample CBS ADP — Gil's board, Aug 27 2026

Do not treat placeholders as live CBS.

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
| `npm test` | Snake math + rec engine |
| `npm run build` | Static export to `out/` (no Pages path prefix) |

`next start` is not used for this app. GitHub Pages (and `npx serve out`) host the `out/` folder. JSON boards are bundled at build time from `data/`.

## GitHub Pages

Live URL: **https://bensbar.github.io/draft-helper/**

This is a **private** repo. Keep it private. GitHub Pages on a private repository requires **GitHub Pro** (or Team / Enterprise) on the account that owns the repo.

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

The sample ADP banner stays honest: **Sample CBS ADP — Gil's board, Aug 27 2026**. Sync is picks only, not a live ADP feed.

## Data layer (Gil diffs here)

Swap boards without rewriting UI:

| File | Contents |
| --- | --- |
| `data/leagues.json` | Settings, scoring, roster, draft order, URLs |
| `data/players.json` | ~200 sample 2026 players with `overallRank` / `adp` |
| `data/keepers.json` | All 24 Gable keepers (round cost + team) |
| `data/rec-rules.json` | Gable 12/13 RB pile, 36/37, 60/61, R8+; Cobra slot-3 rules |
| `data/meta.json` | ADP banner copy + default-league cutoff |

## Gable rec (precomputed, 75s)

- **12/13** — two RBs from leftover of CMC, Cook, Chase Brown, Henry, Barkley, Hampton, Jeanty. No TE/QB. Fade Jacobs.
- **36/37** — WR/RB (ARSB, Lamb, Jefferson, London, AJ Brown, Rice, Nico, Nabers, leftover Henry). Never TE. (R4 37 is Bowers **KEPT**.)
- **60/61** — Tuten or Jadarian Price + WR. Maye is kept.
- **R8+** — Dobbins, Carnell Tate, Mike Washington Jr., MarShawn Lloyd, Shaheed.
- **DST/K last.** DEN DST ADP 90 is a trap.

Ben starts: TE done (Bowers), one WR (Burden, groin Q). Holes: QB, RB, RB, WR, WR, FLEX, K, DST. Waiver **1 of 12** does not reset — post-draft FA queue is the recovery lever.

## Cobra rec

3WR + FLEX all-play. Explosive WR/RB for 50-yd TD and 100-yd bonuses. Wait on QB. K/DST last two. If he draws **3**: leftover of Gibbs / Bijan / Chase, else Taylor / Nacua; round 2 best remaining RB/WR — do **not** take Josh Allen in R2.
