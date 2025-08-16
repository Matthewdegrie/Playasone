'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabaseClient';

// Shape coming from the DB view `game_result_view`
// (contains derived columns like is_draw and winner_id)
export type GameResult = {
  game_id: string;
  league_id: string;
  home_user_id: string;
  away_user_id: string;
  home_score: number;
  away_score: number;
  is_draw: boolean;
  winner_id: string | null;
  played_at: string; // ISO string; parse to Date in UI if desired
  created_at?: string;
  comment?: string | null; // view may not include this; kept for forward-compat
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Props = {
  leagueId: string;
};

/** Utility to print "time ago" text. */
function timeAgo(input?: string | null) {
  if (!input) return '';
  const then = new Date(input).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mnd`;
  const y = Math.floor(d / 365);
  return `${y}j`;
}

/** Compact avatar bubble. Falls back to initials. */
function Avatar({ profile, size = 36 }: { profile?: Profile; size?: number }) {
  const initials = useMemo(() => {
    const n = (profile?.full_name ?? '').trim();
    if (!n) return '•';
    const parts = n.split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }, [profile?.full_name]);

  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.full_name ?? ''}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full bg-slate-200 text-slate-700"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={profile?.full_name ?? 'avatar'}
      title={profile?.full_name ?? ''}
    >
      {initials.toUpperCase()}
    </div>
  );
}

/**
 * GameHistory – shows a paginated list of recent games for a league.
 * Reads from `game_result_view` (NOT from the raw `games` table) so that
 * derived columns like `is_draw` and `winner_id` exist and RLS is simpler.
 */
export default function GameHistory({ leagueId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<GameResult[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch a page from the *view*
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error: gErr } = await supabase
          .from('game_result_view')
          .select(
            'game_id, league_id, home_user_id, away_user_id, home_score, away_score, is_draw, winner_id, played_at, created_at'
          )
          .eq('league_id', leagueId)
          .order('played_at', { ascending: false })
          .range(from, to);

        if (gErr) throw gErr;
        if (!isMounted) return;

        const pageData = (data ?? []) as GameResult[];
        setGames(prev => (page === 0 ? pageData : [...prev, ...pageData]));

        // Collect unique user ids present on this page
        const ids = Array.from(
          new Set(pageData.flatMap(g => [g.home_user_id, g.away_user_id]).filter(Boolean) as string[])
        );

        if (ids.length) {
          const missing = ids.filter(id => !profiles[id]);
          if (missing.length) {
            const { data: profs, error: pErr } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', missing);
            if (pErr) throw pErr;
            if (!isMounted) return;
            setProfiles(prev => {
              const next = { ...prev };
              (profs ?? []).forEach(p => (next[p.id] = p as Profile));
              return next;
            });
          }
        }
      } catch (e: any) {
        setError(e?.message ?? 'Kon games niet laden.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, page]);

  function onLoadMore() {
    setPage(p => p + 1);
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        ✖ {error}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold">Recente games</h2>

      {loading && games.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <p className="text-sm text-slate-500">Nog geen games.</p>
      ) : (
        <ul className="divide-y">
          {games.map(g => {
            const home = profiles[g.home_user_id];
            const away = profiles[g.away_user_id];
            const draw = g.is_draw;
            const homeWon = !draw && g.home_score > g.away_score;
            return (
              <li key={g.game_id} className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar profile={home} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {home?.full_name ?? 'Onbekend'}{' '}
                          <span className="mx-1 text-xs text-slate-400">vs</span>{' '}
                          {away?.full_name ?? 'Onbekend'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {timeAgo(g.played_at)} • wedstrijd
                        </p>
                      </div>
                      <div className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums">
                        {g.home_score}–{g.away_score}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1 text-[11px] font-medium">
                      {draw ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Gelijk</span>
                      ) : homeWon ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                          {home?.full_name?.split(' ')[0] ?? 'Thuis'} wint
                        </span>
                      ) : (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                          {away?.full_name?.split(' ')[0] ?? 'Uit'} wint
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {games.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-full border px-4 py-1.5 text-sm hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? 'Laden…' : 'Meer laden'}
          </button>
        </div>
      )}
    </section>
  );
}
