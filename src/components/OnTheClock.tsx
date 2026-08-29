export function OnTheClock({ team, pick, seconds }: { team: string; pick: number; seconds: number }) {
  return (
    <div
      data-testid="on-the-clock"
      className="on-clock-pulse mx-3 mt-3 rounded-sm bg-[#ff2a7a] text-black px-4 py-2.5 flex items-center justify-between"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-[family-name:var(--font-label)] font-bold tracking-[0.35em] text-sm">
          ON THE CLOCK
        </span>
        <span className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-wide">
          {team}
        </span>
      </div>
      <div className="flex items-baseline gap-3 font-[family-name:var(--font-mono)] font-extrabold">
        <span className="text-sm tracking-widest">PICK {pick}</span>
        <span className={`text-4xl leading-none ${seconds <= 15 ? "tick-urgent" : ""}`}>
          {seconds}s
        </span>
      </div>
    </div>
  );
}
