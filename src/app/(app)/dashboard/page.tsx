'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import InviteButton from '@/components/InviteButton';

type LeagueRow = {
  id: string;
  name: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Uitloggen
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // User + leagues laden
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1) user ophalen
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr || !u?.user) {
          router.replace('/login');
          return;
        }
        setEmail(u.user.email ?? '');

        // 2) leagues ophalen (RLS levert enkel leagues waar je bij hoort)
        const { data, error } = await supabase
          .from('leagues')
          .select('id,name')
          .order('name', { ascending: true });

        if (error) throw error;
        setLeagues((data ?? []) as LeagueRow[]);
      } catch (e: any) {
        setErrorMsg(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  // Simpele "join via token" flow – vraagt om een invite-token (of volledige link)
  const handleJoin = () => {
    const raw = window.prompt('Plak je invite-token of volledige /invite/… link:');
    if (!raw) return;
    // accepteer zowel een losse uuid als een volledige link
    const token = raw.includes('/invite/') ? raw.split('/invite/').pop() : raw.trim();
    if (token) {
      router.push(`/invite/${token}`);
    }
  };

  return (
    <main className="min-h-dvh bg-white flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b bg-gradient-to-b from-indigo-800 to-indigo-600 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image
                src="/images/applogo.png"
                alt="PlayAsOne"
                width={32}
                height={32}
                priority
              />
            </div>
            <span className="font-semibold tracking-tight">PlayAsOne</span>
          </Link>

          <div className="flex items-center gap-3 text-sm/5 text-white/90">
            <span className="hidden sm:inline">{email}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-white/30 bg-white/0 text-white hover:bg-white/10"
              onClick={signOut}
            >
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto w-full max-w-5xl grow px-4 py-6 pb-28">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Jouw leagues</h1>

          {/* Desktop shortcut naar nieuwe league (naast FAB) */}
          <Link href="/leagues/new" className="hidden sm:block">
            <Button>Nieuwe league</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-600">…Laden…</p>
        ) : errorMsg ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ✖ Kon leagues niet laden: {errorMsg}
          </div>
        ) : leagues.length === 0 ? (
          // "No active league" — visueel dichter bij je referentie
          <div className="relative isolate overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-8 sm:p-12">
            <div className="pointer-events-none absolute -inset-x-6 -top-6 h-40 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),rgba(255,255,255,0))]" />
            <p className="mb-6 text-center text-2xl font-extrabold tracking-wide text-slate-900 sm:text-3xl">
              NO ACTIVE LEAGUE.
            </p>

            <div className="mx-auto grid max-w-md grid-cols-1 gap-4 sm:max-w-none sm:grid-cols-2">
              <Link href="/leagues/new" className="block">
                <Button className="h-14 w-full justify-center rounded-xl bg-blue-600 text-base font-bold tracking-wide shadow-md hover:bg-blue-700 active:translate-y-[1px]">
                  CREATE
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleJoin}
                className="h-14 w-full justify-center rounded-xl border-2 text-base font-bold tracking-wide shadow-sm"
              >
                JOIN
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {leagues.map((l) => {
              const leagueName = l.name ?? 'Naamloos';
              return (
                <li key={l.id}>
                  <Card className="overflow-hidden transition will-change-transform hover:shadow-md">
                    <Link
                      href={`/leagues/${l.id}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                    >
                      <CardContent className="flex items-center justify-between gap-3 px-4 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-base font-medium">{leagueName}</div>
                          <div className="text-xs text-gray-500">Open league</div>
                        </div>
                        <span className="text-sm text-gray-400">→</span>
                      </CardContent>
                    </Link>

                    {/* Actions onderaan de kaart */}
                    <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
                      <InviteButton leagueId={l.id} leagueName={l.name} />
                      <Link href={`/leagues/${l.id}`}>
                        <Button variant="outline" size="sm">
                          Openen
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Bottom navigation (zoals in je referentie – met centrale FAB erboven) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 items-center px-2 py-2 text-center text-[11px] font-semibold tracking-wide text-slate-700">
          <Link href="/dashboard" className="rounded px-2 py-2 hover:bg-slate-50">
            FEED/
            <br />
            HOME
          </Link>
          <Link href="/dashboard" className="rounded px-2 py-2 hover:bg-slate-50">
            LEAGUE
          </Link>

          {/* Plek vrij voor de centrale FAB */}
          <span className="pointer-events-none" />

          <Link href="/profile" className="rounded px-2 py-2 hover:bg-slate-50">
            PERSONAL
          </Link>
          <Link href="/settings" className="rounded px-2 py-2 hover:bg-slate-50">
            SETTINGS
          </Link>
        </div>
      </nav>

      {/* FAB (altijd zichtbaar; ligt boven de bottom nav) */}
      <Link
        href="/leagues/new"
        aria-label="Nieuwe league"
        className="fixed bottom-[58px] left-1/2 z-20 -translate-x-1/2 sm:bottom-[66px]"
      >
        <Button className="h-14 w-14 rounded-full p-0 text-2xl shadow-xl sm:h-[60px] sm:w-[60px]">
          +
        </Button>
      </Link>
    </main>
  );
}