'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Browser Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default function RegisterClient() {
  const search = useSearchParams();                // client hook → zit al in client component
  const next = search.get('next') || '/';

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect URL voor de magic link callback
  const redirectTo = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '');
    const url = new URL('/auth/callback', base);
    if (next) url.searchParams.set('next', next);
    return url.toString();
  }, [next]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMsg(null);
      setError(null);
      setSending(true);
      try {
        // MAGIC LINK (wachtwoordloos)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true, // maak user aan als die nog niet bestaat
          },
        });

        if (error) throw error;

        // NB: 'nickname' kun je na de callback opslaan (bijv. in /auth/callback profiel upserten)
        setMsg('✅ Bevestigingsmail verstuurd. Check je inbox om je account te activeren.');
      } catch (err: any) {
        setError(`❌ Registratie mislukt: ${err?.message ?? 'onbekende fout'}`);
      } finally {
        setSending(false);
      }
    },
    [email, redirectTo]
  );

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">Account aanmaken</h1>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="nickname" className="text-sm">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white/5 p-2 outline-none focus:border-blue-400"
            placeholder="Hoe mogen we je noemen?"
            autoComplete="nickname"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm">E-mail *</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white/5 p-2 outline-none focus:border-blue-400"
            placeholder="jij@example.com"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {sending ? 'Versturen…' : 'Stuur bevestigingsmail'}
        </button>

        {msg && <p className="text-sm text-green-500">{msg}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      <p className="mt-6 text-xs text-white/60">
        Je ontvangt een magic link om je e-mail te bevestigen. Daarna leiden we je terug naar: <code>{next}</code>
        <br />
        <span className="opacity-75">
          Tip: sla de <em>nickname</em> op na verificatie in <code>/auth/callback</code> via een upsert naar je <code>profiles</code>-tabel.
        </span>
      </p>
    </section>
  );
}