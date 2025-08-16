// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <main className="min-h-[60vh]">
      <Suspense fallback={<div className="p-6 text-white/70">Laden…</div>}>
        <LoginClient />
      </Suspense>
    </main>
  );
}