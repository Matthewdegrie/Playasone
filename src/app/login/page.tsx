'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Helper: kies next of dashboard
  const nextOrDashboard = (fallback = '/dashboard') =>
    nextParam && nextParam.startsWith('/') ? nextParam : fallback;

  // Al ingelogd? -> naar next of dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace(nextOrDashboard());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, nextParam]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email || sending) return;
    setMessage(null);
    setSending(true);
    try {
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, '');
      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(nextOrDashboard())}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setMessage('✅ Magic link verstuurd! Check je inbox.');
    } catch (err: any) {
      setMessage(`✖ Kon geen magic link sturen: ${err?.message ?? err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Donkere overlay (vangt geen taps) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />

      {/* Achtergrondbeeld (optioneel – blokkeert geen interactie) */}
      <img
        src="/images/Splashscreen.png"
        alt=""
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: -1,
          opacity: 0.35,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto grid min-h-dvh max-w-xl grid-rows-[1fr_auto] px-6 py-8">
        {/* Logo + branding */}
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <Image
            src="/images/applogo.png"
            width={96}
            height={96}
            alt="PlayAsOne"
            className="rounded-xl drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">PlayAsOne</h1>
          <p className="mt-1 text-sm text-white/80">Speel. Nodig uit. Win samen.</p>
        </div>

        {/* Login card */}
        <form
          onSubmit={sendMagicLink}
          className="mb-6 mt-6 flex flex-col gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md sm:flex-row sm:items-center"
        >
          <label htmlFor="email" className="sr-only">E‑mail</label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="jij@voorbeeld.be"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 sm:flex-1"
          />

          <Button
            type="submit"
            disabled={sending || !email}
            className="h-11 w-full sm:w-auto bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {sending ? 'Versturen…' : 'Stuur magic link'}
          </Button>
        </form>

        {message && (
          <p className="mb-4 text-center text-sm text-white/90">{message}</p>
        )}

        <div className="mb-10 text-center">
          <Link
            href="/splash"
            className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
          >
            ← Terug naar splash
          </Link>
        </div>
      </div>
    </div>
  );
}