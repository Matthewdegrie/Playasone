

// src/app/splash/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlayAsOne • Splash',
  description: 'Welcome screen with Register and Login',
};

export default function SplashPage() {
  return (
    <main className="min-h-dvh w-full bg-[#0f1831] text-white flex flex-col items-center justify-between px-6 py-10">
      {/* Top spacer to respect safe areas on mobile */}
      <div className="w-full h-6 md:h-8" aria-hidden />

      {/* Logo / Brand */}
      <section className="flex flex-col items-center gap-6 mt-10">
        <div className="text-[44px] font-black tracking-tight leading-none">
          <span className="text-[#3DFFA6]">P</span>lay
          <span className="text-[#3DFFA6] ml-2">A</span>s
          <span className="text-[#3DFFA6] ml-2">O</span>ne
        </div>
        <p className="text-center text-white/70 max-w-sm">
          Speel met vrienden, maak een league en houd je scores bij.
        </p>
      </section>

      {/* Actions */}
      <section className="w-full max-w-md mb-8 flex flex-col gap-4">
        <Link
          href="/register"
          className="block rounded-full bg-[#3DFFA6] text-[#0c1226] text-center font-semibold py-4 text-lg active:scale-[.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3DFFA6]/60"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="block rounded-full border border-white/30 text-white text-center font-semibold py-4 text-lg active:scale-[.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Log in
        </Link>
      </section>

      {/* Bottom safe area spacer */}
      <div className="h-2" aria-hidden />
    </main>
  );
}