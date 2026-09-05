# Changelog

## Gil Cobra facts — Sep 5 2026

Locked from Gil’s Cobra audit (operational handoff is Carlos/Gil, not app UI):

- League: `ck22.football.cbssports.com` · Ben’s Bar · Thu 9/10/2026 5:00pm ET · 16 rounds · **NO keepers** · slot **unknown** until the draw (picker 1–12).
- Cobra ADP source is Gil’s CBS Non-PPR page: https://www.cbssports.com/fantasy/football/draft/averages/both/h2h/all/ (refetched Sep 5; same board as 9/4 numbers).
- Live app: https://bensbar.github.io/draft-helper/
- UI copy: **fade Josh Jacobs (CEL)**; **MarShawn Lloyd climbing (~87) but still a reach** — never confuse with Kaleb Johnson; never a vague WR.
- Night handoff stays human: watch → 2 picks out **ONE full name + search** → Ben clicks. Preload the robot queue before kickoff.

## Cobra night prep — Thu 9/10/2026 5:00pm ET

Draft-helper now lands on **Cobra Craig** after Gable (9/3). Gable stays as a historical keepers board.

### Ready for draft night

- **League switcher** defaults to COBRA after 9/3. GABLE tab is unchanged (slot 12, 17 rounds, Bowers + Burden kept).
- **Slot picker 1–12** always shown on Cobra. NEXT PICK + next-8 recompute for any drawn slot. Never hardcoded pick 3.
- **CBS sync** copy is Cobra-specific: `ck22.football.cbssports.com`, bookmarklet how-to, paste fallback, clearer idle / listening / synced status. Same bookmarklet — no scrape/CORS backend.
- **Robot / preload queue** — paste a ranked list (one full name per line) before the 75s clock. Smash uses that order once a slot is drawn. Josh Jacobs and Kaleb Johnson are stripped even if pasted.
- **Cobra SCENARIOS** overlay now has slot pages 1–12, R2 (never Josh Allen), mid, Lloyd/QB window, K/DST last, and a one-screen cheat. Specific full names only.
- **League settings** panel: no keepers, 16 rounds, $165, all-play, half-PPR, pass TD 6, slot unknown, ADP source note.
- Rec-engine **why** copy names leftover players (Jahmyr Gibbs / Bijan Robinson / …). Never “a WR”.

### ADP (dated)

| League | Default source | Date | Scoring |
| --- | --- | --- | --- |
| **Cobra** | CBS public Non-PPR (`data/adp-cbs-public.json`) | **Sep 4 2026** | Non-PPR — closest CBS. CBS has **no public half-PPR** board. |
| Gable | Gil / CBS 8/31 (`data/players.json`) | Aug 31 2026 | Gil must-write board (historical) |
| Toggle | CBS PPR 9/4 · ESPN · Yahoo (usually half-PPR shaped) · Consensus | dated on the button | extras only |

Cobra default is **not** Gil’s Gable overlays. Switch sources in the ADP SOURCE bar; that only reorders value.

### Hard rules unchanged

- Never Josh Jacobs
- MarShawn Lloyd not Kaleb Johnson
- Never Josh Allen in Cobra R2
- Never vague “a WR” — full names in rec / scenarios / queue copy

### Blockers / need Ben or Gil

- **Confirm CBS robot / autodraft** on Cobra. Clock is 75s in settings; `robot` is still off until Ben confirms. Preload queue works either way.
- **Half-PPR / pass TD 6 ADP** — CBS does not publish it. Using Non-PPR 9/4 as closest CBS. Gil can drop must-write half-PPR numbers if he wants a Cobra overlay (do not invent them).
- **Pick slot** is unknown until the 9/10 kickoff draw. Do not assume 3.
- Yahoo 8/31 is the closest *scoring-shaped* extra (typical half-PPR), not CBS.
