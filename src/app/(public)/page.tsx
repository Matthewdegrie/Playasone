// src/app/(public)/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function Page() {
  // Server-side session check (Next 15 compatible)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // In een Server Component mogen we cookies rechtstreeks zetten
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = Boolean(session);

  return (
    <main className="min-h-dvh relative overflow-hidden bg-brand-navy text-white">
      {/* Brand glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(104,254,154,0.22) 0%, rgba(104,254,154,0) 60%)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(73,85,115,0.20) 0%, rgba(73,85,115,0) 60%)",
          }}
        />
      </div>

      {/* Top nav */}
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="font-display text-lg tracking-wide">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-primary" />
              <span className="font-semibold">Play&nbsp;As&nbsp;One</span>
            </span>
          </div>

          {/* Session-aware nav */}
          <nav className="hidden sm:flex items-center gap-3">
            {isAuthed ? (
              <>
                <Link
                  href="/feed"
                  className="rounded-md px-4 py-2 text-sm font-medium text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition"
                >
                  Ga naar Feed
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-md px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary/40 hover:border-brand-primary hover:bg-white/5 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md px-4 py-2 text-sm font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition"
                >
                  Registreren
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-16 sm:pt-12 lg:pt-20 lg:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
              Speel, scoor en <span className="text-brand-primary">stijg</span> als team
            </h1>
            <p className="mt-5 text-base sm:text-lg text-brand-paper/80">
              De community-app voor challenges, games en leaderboards. Bouw je league,
              daag vrienden uit en volg je progressie in realtime.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthed ? (
                <Link
                  href="/feed"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition shadow-inset-brand"
                  aria-label="Open je feed"
                >
                  Open je Feed
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition shadow-inset-brand"
                    aria-label="Maak een account aan"
                  >
                    Maak account aan
                  </Link>
                  <Link
                    href="/auth/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-5 py-3 text-base font-medium text-brand-primary border border-brand-primary/50 hover:border-brand-primary hover:bg-white/5 transition"
                    aria-label="Log in"
                  >
                    Ik heb al een account
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-brand-paper/60">
              Door te starten ga je akkoord met onze{" "}
              <Link href="/legal/terms" className="underline hover:text-brand-primary">voorwaarden</Link>{" "}
              en <Link href="/legal/privacy" className="underline hover:text-brand-primary">privacy</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Feature peeks */}
      <section className="relative z-10 border-t border-white/10 bg-[#0f1b39]/30">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h3 className="font-display text-base font-semibold text-white">Leaderboards</h3>
            <p className="mt-1 text-sm text-brand-paper/75">
              Dagelijks, wekelijks en maandelijks. Motiveer je crew met badges &amp; ranks.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h3 className="font-display text-base font-semibold text-white">Games &amp; Challenges</h3>
            <p className="mt-1 text-sm text-brand-paper/75">
              Start snelle mini-games of maak eigen regels met punten en streaks.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <h3 className="font-display text-base font-semibold text-white">Teams &amp; Leagues</h3>
            <p className="mt-1 text-sm text-brand-paper/75">
              Nodig vrienden uit, beheer teams en speel samen als één.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-brand-paper/70">
          <span>© {new Date().getFullYear()} Play As One</span>
          <div className="flex items-center gap-5">
            <Link href="/legal/privacy" className="hover:text-brand-primary">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-brand-primary">Voorwaarden</Link>
            <Link href="/contact" className="hover:text-brand-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}