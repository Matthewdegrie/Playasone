'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import Link from 'next/link';

type Game = {
  id: string;
  league_id: string;
  type: '1v1' | '2v2';
  opponent?: string | null;
  left_score?: number | null;
  right_score?: number | null;
  created_at: string;
};

type Props = {
  leagueId: string;
};

export default function GameList({ leagueId }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from('games')
      .select(
        'id, league_id, type, opponent, left_score, right_score, created_at'
      )
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    if (error) {
      setErr(error.message);
      setGames([]);
    } else {
      setGames((data ?? []) as Game[]);
    }

    setLoading(false);
  }, [leagueId]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  if (loading) {
    return (
      <ul className="divide-y rounded-md border animate-pulse">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </li>
        ))}
      </ul>
    );
  }

  if (err) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        ✖ Fout bij laden van games: {err}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center text-sm text-gray-600">
        <p>Nog geen games in deze league.</p>
        <Link
          href={`/leagues/${leagueId}/games/new`}
          className="mt-3 inline-block rounded bg-black px-3 py-1.5 text-white hover:bg-gray-800"
        >
          ➕ Nieuwe game toevoegen
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {games.map((g) => (
        <li
          key={g.id}
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {g.type === '1v1' ? '1 vs 1' : '2 vs 2'}
              {g.opponent ? ` • tegen ${g.opponent}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(g.created_at).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="text-sm tabular-nums font-medium">
            {(g.left_score ?? '–')}{' '}
            <span className="mx-1 text-gray-400">—</span>{' '}
            {(g.right_score ?? '–')}
          </div>
        </li>
      ))}
    </ul>
  );
}