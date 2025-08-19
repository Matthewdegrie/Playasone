"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/GoogleButton";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") ?? "/"; // waarheen na login

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // we checken eerst of user al ingelogd is
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

  const onEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotice(null);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace(nextUrl);
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 bg-brand-navy text-white">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="font-display text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-brand-paper/75">
          Welkom terug! Log in met je e-mailadres en wachtwoord of gebruik Google.
        </p>

        {checking ? (
          <div className="mt-6 text-sm text-brand-paper/70">Bezig met laden…</div>
        ) : (
          <>
            <form onSubmit={onEmailPasswordLogin} className="mt-6 space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 outline-none focus:border-brand-primary"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {notice && <p className="text-sm text-brand-primary">{notice}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-2 font-semibold text-brand-navy bg-brand-primary hover:bg-[#68fe9a] transition disabled:opacity-60"
              >
                {loading ? "Bezig..." : "Log in"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/60">of</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <GoogleButton label="Log in met Google" />

            <p className="mt-4 text-sm text-white/70">
              Nog geen account?{" "}
              <Link className="text-brand-primary underline" href="/auth/register">
                Registreer hier
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}