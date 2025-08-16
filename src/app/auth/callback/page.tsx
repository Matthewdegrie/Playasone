'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { ensureProfile } from '@/app/lib/ensureProfile';

export default function CallbackPage() {
  const [status, setStatus] = useState('Sessiesleutel verwerken…');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // 1) PKCE code in query? -> exchangeCodeForSession
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url.toString());
          if (error) throw error;
        } else {
          // 2) Anders: check bestaande sessie
          const { data: sess1 } = await supabase.auth.getSession();

          // 3) Legacy token_hash flow (query of hash)
          const hash = url.hash;
          const qpTokenHash = url.searchParams.get('token_hash');
          const type =
            url.searchParams.get('type') ??
            (hash.includes('type=')
              ? hash.split('type=')[1].split('&')[0]
              : 'magiclink');

          if (!sess1?.session && qpTokenHash) {
            const { error } = await supabase.auth.verifyOtp({
              type: type as any,
              token_hash: qpTokenHash,
            });
            if (error) throw error;
          }
        }

        // 4) Nu zou er een sessie moeten zijn
        const { data: sess2 } = await supabase.auth.getSession();
        if (!sess2.session) throw new Error('Geen auth parameters gevonden.');

        // 5) Profiel aanmaken/bijwerken
        const res = await ensureProfile();
        if (!res.ok) {
          console.warn('⚠️ Profiel update:', res.reason);
        }

        setStatus('✅ Ingelogd, even geduld…');
        router.replace('/dashboard');
      } catch (e: any) {
        console.error(e);
        setStatus(`❌ ${e?.message ?? 'Onbekende fout'}`);
      }
    })();
  }, [router]);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black">
      {/* Achtergrond (vangt geen taps) */}
      <Image
        src="/images/Splashscreen.png"
        alt=""
        fill
        priority
        className="pointer-events-none select-none object-cover opacity-90 -z-10"
      />
      {/* Donkere overlay (vangt geen taps) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80" />

      {/* Content */}
      <main className="relative z-10 grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6 text-center text-white backdrop-blur-md">
          <div className="mb-4 flex items-center justify-center gap-3">
            <Image
              src="/images/applogo.png"
              alt="PlayAsOne"
              width={40}
              height={40}
              priority
              className="rounded-md"
            />
            <span className="text-lg font-semibold">PlayAsOne</span>
          </div>

          {/* Loader */}
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />

          <p className="text-sm text-white/90" aria-live="polite">
            {status}
          </p>

          <p className="mt-3 text-xs text-white/70">
            Je wordt zo doorgestuurd naar je dashboard…
          </p>
        </div>
      </main>
    </div>
  );
}