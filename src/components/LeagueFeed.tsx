'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Member = {
  user_id: string;
  display_name: string | null;
  initials?: string | null;
  role: 'owner' | 'member' | 'admin' | null;
};

type GameResult = {
  game_id: string;
  league_id: string;
  home_user_id: string;
  away_user_id: string;
  home_score: number;
  away_score: number;
  is_draw: boolean;
  winner_id: string | null;
  played_at: string | null;
  created_at: string;
};

interface Props {
  leagueId: string;
}

/**
 * Games-tab (History):
 * - Leest NIET meer uit `games` maar uit de view `game_result_view`
 * - Zo hebben we `is_draw` en `winner_id` zonder die kolommen op de `games`-tabel te hoeven zetten.
 * - Eenvoudige paginering met "Meer laden".
 */
export default function GameHistory({ leagueId }: Props) {
  const PAGE_SIZE = 15;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<GameResult[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // naam helper
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.user_id, m.display_name ?? 'Onbekend'));
    return (id: string) => map.get(id) ?? 'Onbekend';
  }, [members]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      setRows([]);
      setPage(0);
      setHasMore(true);

      try {
        // Leden (voor namen/initialen)
        const { data: mData, error: mErr } = await supabase
          .from('league_members')
          .select('user_id, role, profiles:profiles!inner(full_name, initials)')
          .eq('league_id', leagueId);

        if (mErr) throw mErr;

        const mappedMembers: Member[] =
          (mData ?? []).map((r: any) => ({
            user_id: r.user_id,
            role: (r.role as Member['role']) ?? null,
            display_name: r.profiles?.full_name ?? null,
            initials: r.profiles?.initials ?? null,
          })) ?? [];

        if (!cancelled) setMembers(mappedMembers);

        // Eerst page ophalen
        const { data: gData, error: gErr } = await supabase
          .from('game_result_view')
          .select(
            'game_id, league_id, home_user_id, away_user_id, home_score, away_score, is_draw, winner_id, played_at, created_at'
          )
          .eq('league_id', leagueId)
          .order('played_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (gErr) throw gErr;

        if (!cancelled) {
          setRows(gData ?? []);
          setHasMore((gData?.length ?? 0) === PAGE_SIZE);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Onbekende fout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  async function loadMore() {
    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('game_result_view')
      .select(
        'game_id, league_id, home_user_id, away_user_id, home_score, away_score, is_draw, winner_id, played_at, created_at'
      )
      .eq('league_id', leagueId)
      .order('played_at', { ascending: false })
      .range(from, to);

    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => [...prev, ...(data ?? [])]);
    setPage(nextPage);
    setHasMore((data?.length ?? 0) === PAGE_SIZE);
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-white/50 p-4 text-sm text-gray-600">
        Laden…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        ✖ {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Nog geen games</h3>
        <p className="mt-1 text-sm text-gray-600">
          Voeg je eerste game toe om de historie te zien.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((g) => (
        <GameLine key={g.game_id} g={g} getName={nameById} />
      ))}

      {hasMore ? (
        <div className="pt-2">
          <button
            onClick={loadMore}
            className="inline-flex w-full items-center justify-center rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Meer laden
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GameLine({
  g,
  getName,
}: {
  g: GameResult;
  getName: (id: string) => string;
}) {
  const played = g.played_at ?? g.created_at;
  const d = new Date(played);
  const dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString();

  const homeName = getName(g.home_user_id);
  const awayName = getName(g.away_user_id);

  const homeWon = !g.is_draw && g.winner_id === g.home_user_id;
  const awayWon = !g.is_draw && g.winner_id === g.away_user_id;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{dateStr}</span>
        <span className="font-mono">#{g.game_id.slice(0, 6)}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 items-center gap-2 text-lg">
        <div className="truncate">
          <span className={homeWon ? 'font-semibold' : ''}>{homeName}</span>
        </div>
        <div className="text-center font-mono">
          {g.home_score} <span className="text-gray-400">-</span> {g.away_score}
          {g.is_draw ? <span className="ml-2 text-xs text-gray-500">draw</span> : null}
        </div>
        <div className="truncate text-right">
          <span className={awayWon ? 'font-semibold' : ''}>{awayName}</span>
        </div>
      </div>
    </div>
  );
}