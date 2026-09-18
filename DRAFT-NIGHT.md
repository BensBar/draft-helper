# Draft-night checklist (next year)

Post-Cobra 2026. Operational handoff is **Carlos → Gil → Ben**. The companion is not CBS.

Live app: [https://bensbar.github.io/draft-helper/](https://bensbar.github.io/draft-helper/)

## T-7 days

- Refresh ADP + scenarios for **that** league. Scoring rules are locked — do not remix boards after this.
- Slot picker works if the draw is still unknown. Never hardcode a pick.
- Hard rules in the app:
  - Never Josh Jacobs
  - MarShawn Lloyd ≠ Kaleb Johnson
  - Full names only — never a vague “a WR”

## T-3 days

- Smoke the Pages app + CBS bookmarklet on a fake or live board. Confirm `takenIds` syncs after each pick.
- Confirm the robot / preload queue path Ben will actually use (paste ranked full names, one per line).
- Ping Gil (football strategist agent): **you’re on call for draft night**.

## T-0 — before the clock (hard gates)

Do not start until all four are true:

1. **Gil replies alive in chat** (not assumed). Cobra 2026 failure mode: Gil errored out and missed the live draft while the app was fine.
2. **Carlos has the CBS room open** and the bookmarklet is feeding `taken`.
3. **One-name protocol locked:** Carlos → Gil → Ben clicks CBS.
4. **Backup:** if Gil goes dark, Carlos calls the smash name straight to Ben.

## During

- Call a **full player name + search string** only when Ben is within 2 picks.
- Log every Ben pick as it lands.

## After

- Dump the full roster + slot / waiver for grades.
- Write a **5-line postmortem:** what broke (agent vs app).
