'use client';

import { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
// TIP: je kunt ook een alias gebruiken: import { createSupabaseBrowserClient } from '@/app/lib/supabase/client';

const SITE_URL =
  (typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : undefined) || // SSR fallback
  (typeof window !== 'undefined' ? window.location.origin : ''); // CSR fallback

export default function LoginClient() {
  // Maak client slechts 1x aan
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMessage('Check je mailbox voor de magic link ✉️');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Onbekende fout bij inloggen.');
    } finally {
      setLoading(false);
    }
  };

  type OAuthProvider = 'google' | 'apple' | 'github';

  const signInWithProvider = async (provider: OAuthProvider) => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${SITE_URL}/auth/callback`,
        },
      });

      if (error) setErrorMsg(error.message);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Onbekende OAuth fout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Log in</h1>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="jouw@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
            required
            autoComplete="email"
            inputMode="email"
            aria-label="E-mailadres"
          />

          <button
            type="submit"
            disabled={loading || !isEmailValid}
            className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-disabled={loading || !isEmailValid}
          >
            {loading ? 'Versturen…' : 'Stuur magic link'}
          </button>
        </form>

        <div className="my-4 h-px w-full bg-border" />

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => signInWithProvider('google')}
            disabled={loading}
            className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            Log in met Google
          </button>
          {/* Extra providers kun je hier toevoegen */}
          {/* <button onClick={() => signInWithProvider('github')} ...>Log in met GitHub</button> */}
        </div>

        {/* aria-live zorgt dat screenreaders updates voorlezen */}
        <p className="sr-only" aria-live="polite">
          {message || errorMsg || ''}
        </p>

        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

        <p className="mt-6 text-xs text-muted-foreground">
          Na succesvolle login word je doorgestuurd naar <code>/auth/callback</code>.
        </p>
      </div>
    </div>
  );
}