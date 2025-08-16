'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/app/lib/supabaseClient';
import InviteButton from '@/components/InviteButton';
import LeagueFeed from '@/components/LeagueFeed';
import GameHistory from '@/components/GameHistory';
import { ChevronLeftIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';

// Lazy load Leaderboard (client-only)
const Leaderboard = dynamic(
  () => import('@/components/Leaderboard').catch(() => ({ default: () => null })),
  { ssr: false }
);

// Types
type League = {
  id: string;
  name: string | null;
  description?: string | null;
  created_at?: string | null;
};

type MemberRow = {
  user_id: string;
  role: 'owner' | 'admin' | 'member' | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type Member = {
  user_id: string;
  role: 'owner' | 'admin' | 'member' | null;
  name: string;
  avatar_url: string | null;
};

// Tabs
type TabKey = 'feed' | 'leaderboard' | 'games';
const TAB_LABEL: Record<TabKey, string> = {
  feed: 'Feed',
  leaderboard: 'Leaderboard',
  games: 'Games',
};
const isTabKey = (v: string | null): v is TabKey => v === 'feed' || v === 'leaderboard' || v === 'games';

export default function LeaguePage() {
  const router = useRouter();
  const search = useSearchParams();
  const { id: leagueIdParam } = useParams<{ id: string }>();
  const leagueId = String(leagueIdParam ?? '');

  // Read tab from URL, default to feed
  const initialTab = isTabKey(search?.get('tab')) ? (search!.get('tab') as TabKey) : 'feed';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const hasTwoOrMoreMembers = members.length >= 2;

  const iAmMember = useMemo(
    () => !!me && members.some((m) => m.user_id === me.id),
    [me, members]
  );

  // Keep activeTab in sync if user changes the URL (?tab=..)
  useEffect(() => {
    const q = search?.get('tab');
    if (isTabKey(q) && q !== activeTab) setActiveTab(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadLeague = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, description, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('League niet gevonden.');
    setLeague(data as League);
  }, []);

  const loadMembers = useCallback(async (id: string) => {
    // 1) leden ophalen
    const { data: memRows, error: mErr } = await supabase
      .from('league_members')
      .select('user_id, role')
      .eq('league_id', id);

    if (mErr) throw mErr;

    // 2) bijhorende profielen resolven
    const userIds = (memRows ?? []).map((r) => r.user_id);
    let profiles: ProfileRow[] = [];
    if (userIds.length) {
      const { data: profRows, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
      if (pErr) throw pErr;
      profiles = (profRows ?? []) as ProfileRow[];
    }

    const profMap = new Map<string, ProfileRow>();
    profiles.forEach((p) => profMap.set(p.id, p));

    const displayName = (p?: ProfileRow) =>
      (p?.full_name && p.full_name.trim()) ||
      (p?.username && p.username.trim()) ||
      'Onbekend';

    const enriched: Member[] = (memRows ?? []).map((m: MemberRow) => {
      const prof = profMap.get(m.user_id);
      return {
        user_id: m.user_id,
        role: m.role,
        name: displayName(prof),
        avatar_url: prof?.avatar_url ?? null,
      };
    });

    // sorteer owner/admin eerst
    enriched.sort((a, b) => {
      const rank = (r: Member['role']) => (r === 'owner' ? 0 : r === 'admin' ? 1 : 2);
      const d = rank(a.role) - rank(b.role);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' });
    });

    setMembers(enriched);
  }, []);

  const hydrate = useCallback(
    async (id: string) => {
      setLoading(true);
      setErr(null);
      try {
        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!u?.user) {
          router.replace('/login');
          return;
        }
        setMe({ id: u.user.id, email: u.user.email ?? null });
        await Promise.all([loadLeague(id), loadMembers(id)]);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    },
    [loadLeague, loadMembers, router]
  );

  useEffect(() => {
    if (!leagueId) return;
    hydrate(String(leagueId));
  }, [leagueId, hydrate]);

  // Reflect active tab in URL (so refresh preserves state)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState(null, '', url.toString());
  }, [activeTab]);

  // UI pieces
  const Header = () => (
    <header className="flex items-center justify-between bg-black px-6 py-4 border-b border-gray-800">
      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="text-gray-400 hover:text-white transition"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <h1 className="text-lg font-bold text-white truncate max-w-[60%] text-center">
        {league?.name ?? 'LEAGUE'}
      </h1>
      <button
        onClick={() => router.push('/settings')}
        aria-label="Settings"
        className="text-gray-400 hover:text-white transition"
      >
        <Cog6ToothIcon className="h-6 w-6" />
      </button>
    </header>
  );

  const Tabs = () => (
    <nav className="flex border-b border-gray-800 bg-black px-6">
      {(['feed', 'leaderboard', 'games'] as TabKey[]).map((key) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-center text-sm uppercase tracking-wide transition ${
              active
                ? 'font-bold text-white border-b-2 border-emerald-400'
                : 'font-normal text-gray-500 hover:text-gray-300'
            }`}
          >
            {TAB_LABEL[key]}
          </button>
        );
      })}
    </nav>
  );

  const EmptyState = () => (
    <section className="flex flex-col items-center justify-center gap-8 p-12 text-center text-white">
      <p className="text-base text-gray-400">
        Minstens 2 leden nodig om content te bekijken of games toe te voegen.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/leagues/new')}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Nieuwe league
        </button>
        {league && (
          <InviteButton leagueId={league.id} leagueName={league.name} />
        )}
      </div>
    </section>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 space-y-8 text-white">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-700" />
        <div className="h-28 animate-pulse rounded bg-gray-800" />
        <div className="h-40 animate-pulse rounded bg-gray-800" />
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <h1 className="mb-2 text-2xl font-semibold">League</h1>
        <p className="text-red-500">✖ {err}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <Tabs />

      {league ? (
        hasTwoOrMoreMembers ? (
          <section className="relative flex-1 overflow-auto p-6 space-y-6">
            <header className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{league.name ?? 'Naamloos'}</h2>
              {iAmMember && (
                <div className="flex items-center gap-2">
                  <InviteButton leagueId={league.id} leagueName={league.name} />
                  <button
                    onClick={() => router.push(`/games/new?league=${league.id}`)}
                    className="hidden sm:inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
                  >
                    <PlusIcon className="h-4 w-4" /> Nieuwe game
                  </button>
                </div>
              )}
            </header>

            {league.description ? (
              <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <p className="whitespace-pre-wrap text-sm text-gray-300">{league.description}</p>
              </section>
            ) : null}

            <section className="space-y-4">
              {activeTab === 'feed' && <LeagueFeed leagueId={league.id} />}
              {activeTab === 'leaderboard' && <Leaderboard leagueId={league.id} />}
              {activeTab === 'games' && <GameHistory leagueId={league.id} />}
            </section>

            {/* Floating Add Game button on mobile */}
            {iAmMember && (
              <button
                onClick={() => router.push(`/games/new?league=${league.id}`)}
                className="sm:hidden fixed bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-700/30 hover:bg-emerald-400"
                aria-label="Nieuwe game"
              >
                <PlusIcon className="h-5 w-5" />
                Add
              </button>
            )}
          </section>
        ) : (
          <EmptyState />
        )
      ) : (
        <section className="flex flex-1 items-center justify-center p-12 text-center text-gray-400">
          <p>League niet gevonden.</p>
        </section>
      )}
    </main>
  );
}