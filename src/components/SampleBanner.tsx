export function SampleBanner({ text, news }: { text: string; news?: string }) {
  return (
    <>
      <div
        data-testid="sample-adp-banner"
        className="siren-bar text-black px-4 py-1.5 flex items-center justify-between gap-4"
      >
        <p className="font-[family-name:var(--font-label)] font-bold tracking-[0.18em] text-[13px] uppercase w-full text-center">
          {text}
        </p>
      </div>
      {news ? (
        <div
          data-testid="gil-news-banner"
          className="bg-[#ffb703] text-black px-4 py-1.5"
        >
          <p className="font-[family-name:var(--font-label)] font-semibold text-[12px] tracking-wide text-center">
            {news}
          </p>
        </div>
      ) : null}
    </>
  );
}
