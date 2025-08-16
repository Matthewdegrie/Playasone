// Server component (no "use client" here)
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Log in',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Laden…</div>}>
      <LoginClient />
    </Suspense>
  );
}