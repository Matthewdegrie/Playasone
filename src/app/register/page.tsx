'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Waarheen na bevestigen? (invite/next → respecteren)
  const nextOrDashboard = (fallback = '/dashboard') =>
    nextParam && nextParam.startsWith('/') ? nextParam : fallback;

  // Al ingelogd? → doorsturen
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace(nextOrDashboard());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, nextParam]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !agree || sending) return;

    setMessage(null);
    setSending(true);
    try {
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, '');
      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(nextOrDashboard())}`;

// Registreren via e‑mail + tijdelijke pw (voor typings), gebruiker activeert via magic link
const tempPassword = `${crypto.randomUUID()}Aa!9`; // sterke random placeholder
const { error } = await supabase.auth.signUp({
  email,
  password: tempPassword,
  options: {
    emailRedirectTo: redirectTo,
    data: {
      nickname: nickname || null,
      agreed_tos: true,
      // hier kan je later dob/gender/notifs toevoegen
    },
  },
});

      if (error) throw error;
      setMessage('✅ Bevestigingsmail verstuurd! Check je inbox om je account te activeren.');
    } catch (err: any) {
      setMessage(`✖ Registratie mislukt: ${err?.message ?? err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Donkere overlay (blokkeert geen interactie) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />

      {/* Zachte achtergrond (optioneel) */}
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
          opacity: 0.25,
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-xl grid-rows-[1fr_auto] px-6 py-8">
        {/* Branding */}
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <Image
            src="/images/applogo.png"
            width={96}
            height={96}
            alt="PlayAsOne"
            className="rounded-xl drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Maak je account</h1>
          <p className="mt-1 text-sm text-white/80">Ontvang een magic link om je registratie te voltooien.</p>
        </div>

        {/* Register card */}
        <form
          onSubmit={handleRegister}
          className="mb-6 mt-6 grid gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md"
        >
          <label htmlFor="email" className="sr-only">E‑mail</label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="jij@voorbeeld.be"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
          />

          <label htmlFor="nickname" className="sr-only">Nickname (optioneel)</label>
          <Input
            id="nickname"
            type="text"
            autoComplete="nickname"
            placeholder="Nickname (optioneel)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="h-11 border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
          />

          <label className="mt-1 flex items-start gap-3 text-sm text-white/90">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4"
              required
            />
            <span>
              Ik ga akkoord met de{' '}
              <a className="underline underline-offset-2 hover:text-white" href="/legal/terms" target="_blank" rel="noreferrer">
                Terms
              </a>{' '}
              en{' '}
              <a className="underline underline-offset-2 hover:text-white" href="/legal/privacy" target="_blank" rel="noreferrer">
                Privacy
              </a>.
            </span>
          </label>

          <Button
            type="submit"
            disabled={sending || !email || !agree}
            className="mt-1 h-11 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {sending ? 'Versturen…' : 'Stuur bevestigingsmail'}
          </Button>

          {message && (
            <p className="mt-1 text-center text-sm text-white/90">{message}</p>
          )}
        </form>

        <div className="mb-10 text-center">
          <Link
            href="/login"
            className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
          >
            Al een account? Log in
          </Link>
          <span className="mx-2 text-white/30">•</span>
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