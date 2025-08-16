import { Suspense } from 'react';
import RegisterClient from './RegisterClient'; // ← geen .tsx extensie

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Suspense fallback={<p>Formulier laden…</p>}>
        <RegisterClient />
      </Suspense>
    </main>
  );
}