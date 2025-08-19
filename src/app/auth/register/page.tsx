"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/GoogleButton";

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") ?? "/"; // waarheen na registratie

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // check of user al ingelogd is
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Als er al een sessie is, meteen door naar nextUrl
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        router.replace(nextUrl);
      } else {
        setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, router, nextUrl]);

  const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotice(null);
    setError(null);

    const origin = typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Supabase stuurt na e-mailverificatie terug naar deze callback
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) return setError(error.message);

    // Afhankelijk van je Supabase Auth setting:
    // - "Email confirmations: ON" ⇒ user moet e-mail verifiëren
    if (!data.session) {
      setNotice(
        "Check je inbox om je e-mailadres te bevestigen. Daarna kun je inloggen."
      );
      return;
    }

    // - "Email confirmations: OFF" ⇒ direct ingelogd
    router.replace(nextUrl);
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 bg-brand-navy text-white">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="font-display text-2xl font-semibold">Account aanmaken</h1>
        <p className="mt-1 text-sm text-brand-paper/75">
          Start met e-mail en wachtwoord of gebruik Google.
        </p>

        {checking ? (
          <div className="mt-6 text-sm text-brand-paper/70">Bezig met laden…</div>
        ) : (
          <>
            <form onSubmit={onRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm mb-1" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand-primary"
                  placeholder="jij@voorbeeld.com"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="password">Wachtwoord</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand-primary"
                  placeholder="Min. 6 tekens"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {notice && <p className="text-sm text-brand-primary">{notice}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-2 font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition disabled:opacity-60"
              >
                {loading ? "Bezig..." : "Account aanmaken"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/60">of</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <GoogleButton label="Ga verder met Google" />

            <p className="mt-4 text-sm text-white/70">
              Al een account?{" "}
              <Link className="text-brand-primary underline" href="/auth/login">
                Log hier in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}