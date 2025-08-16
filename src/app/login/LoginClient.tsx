// src/app/login/LoginClient.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function LoginClient() {
  // Voorbeeld: lees eventueel een "next" param om na login te redirecten
  const params = useSearchParams();
  const next = useMemo(() => params.get('next') ?? '/', [params]);

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Log in</h1>

      {/* Hier komt jouw echte login-flow (magic link / OAuth / etc.) */}
      <div className="rounded-md border p-4">
        <p className="mb-2 text-sm text-white/80">
          Dit is een placeholder voor de login. Na succesvolle login kun je
          doorsturen naar: <code className="text-white">{next}</code>
        </p>

        <button
          type="button"
          className="mt-2 rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          onClick={() => {
            // TODO: vervang met je echte auth logica (Supabase signIn, etc.)
            alert('Voeg hier je inloglogica toe (magic link / OAuth).');
          }}
        >
          Inloggen
        </button>
      </div>
    </section>
  );
}