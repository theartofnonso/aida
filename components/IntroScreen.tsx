"use client";

import AidaMark from "./AidaMark";

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="safe-top px-5 pt-5">
        <div className="flex items-center gap-2">
          <AidaMark size={32} />
          <span className="font-serif text-[19px] tracking-tight text-ink">
            Aida
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-5 py-10 max-w-xl mx-auto w-full">
        <h1 className="font-serif text-[34px] sm:text-[40px] leading-[1.08] tracking-tight text-ink">
          What&rsquo;s on your mind?
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-muted max-w-md">
          Tell me where you&rsquo;re stuck and I&rsquo;ll help you figure out
          what to do next.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart();
          }}
          className="mt-8"
        >
          <div className="rounded-3xl bg-surface border border-line shadow-card focus-within:border-accent/40 transition-colors">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6">
              <p
                aria-label="Your message to Aida"
                className="font-serif text-[18px] sm:text-[20px] leading-relaxed text-ink"
              >
                I&rsquo;ve got{" "}
                <span className="text-accent">£3,200</span> sitting in my
                current account. I know I should do something with it, but
                every time I look into it, I end up more confused.
              </p>
            </div>
            <div className="flex items-center justify-between px-3 pb-3 pt-2">
              <button
                type="button"
                aria-label="Add attachment"
                title="Attachments coming soon"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full text-ink-muted hover:text-accent hover:bg-accent/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                type="submit"
                aria-label="Send"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent text-white shadow-soft hover:bg-accent-soft active:bg-accent-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="px-5 pb-6 safe-bottom max-w-xl mx-auto w-full">
        <p className="text-[11.5px] leading-relaxed text-ink-soft text-center">
          Aida offers educational guidance, not regulated financial advice.
        </p>
      </footer>
    </div>
  );
}
