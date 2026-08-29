export function SampleBanner({ text }: { text: string }) {
  return (
    <div
      data-testid="sample-adp-banner"
      className="siren-bar text-black px-4 py-1.5 flex items-center justify-between gap-4"
    >
      <p
        className="font-[family-name:var(--font-label)] font-bold tracking-[0.18em] text-[13px] uppercase w-full text-center"
      >
        {text}
      </p>
    </div>
  );
}
