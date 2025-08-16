'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabaseClient';

type LeaderboardRow = {
  league_id: string;
  user_id: string;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
  points: number;
  bonus_points: number;
};

type Profile = {
  id: string;
  username: string | null;
  nickname: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function displayName(p?: Profile) {
  if (!p) return 'Onbekend';
  return (
    p.username ||
    p.nickname ||
    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
    'Onbekend'
  );
}

function initials(p?: Profile) {
  const name = displayName(p);
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]?.toUpperCase()).join('');
}

export default function Leaderboard({ leagueId }: { leagueId: string }) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) leaderboard-view ophalen
        const { data: lb, error: lbErr } = await supabase
          .from('leaderboard_view')
          .select(
            'league_id,user_id,wins,losses,draws,games_played,points,bonus_points'
          )
          .eq('league_id', leagueId)
          .order('points', { ascending: false })
          .order('wins', { ascending: false })
          .order('games_played', { ascending: true });

        if (lbErr) throw lbErr;

        // 2) profielen ophalen
        const userIds = (lb ?? []).map((r) => r.user_id);
        const profileMap: Record<string, Profile> = {};
        if (userIds.length) {
          const { data: profs, error: pErr } = await supabase
            .from('profiles')
            .select('id, username, nickname, first_name, last_name, avatar_url')
            .in('id', userIds);
          if (pErr) throw pErr;
          for (const p of profs ?? []) profileMap[p.id] = p as Profile;
        }

        if (!cancelled) {
          setRows(lb ?? []);
          setProfiles(profileMap);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  const maxPoints = useMemo(
    () => Math.max(1, ...(rows ?? []).map((r) => r.points ?? 0)),
    [rows]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white/80 p-4 sm:p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border animate-pulse bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        ✖ Kon leaderboard niet laden: {err}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-gray-600">
        Nog geen games in deze league. Speel de eerste match om het klassement te starten!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white/80 overflow-hidden">
      <ul className="divide-y">
        {rows.map((r, idx) => {
          const p = profiles[r.user_id];
          const pct = Math.max(0, Math.min(1, r.points / maxPoints));

          const rankStyles =
            idx === 0
              ? 'ring-2 ring-amber-400'
              : idx === 1
              ? 'ring-2 ring-gray-300'
              : idx === 2
              ? 'ring-2 ring-amber-700'
              : 'ring-1 ring-gray-200';

          const medal =
            idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : String(idx + 1);

          return (
            <li key={r.user_id} className="px-3 sm:px-4 py-3 sm:py-4 bg-white">
              <div className="grid grid-cols-12 items-center gap-3 sm:gap-4">
                {/* Rank / medal */}
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <div className="h-9 w-8 sm:h-10 sm:w-10 grid place-items-center text-sm sm:text-base font-bold">
                    {medal}
                  </div>
                </div>

                {/* Avatar + Name + Progress */}
                <div className="col-span-7 sm:col-span-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 grid place-items-center text-xs font-semibold text-gray-600 ${rankStyles}`}
                    >
                      {p?.avatar_url ? (
                        <Image src={p.avatar_url} alt={displayName(p)} fill className="object-cover" />
                      ) : (
                        initials(p)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-gray-900">
                        {displayName(p)}
                      </div>
                      <div className="mt-1 h-2 w-40 sm:w-64 bg-gray-200/80 rounded">
                        <div
                          className="h-2 rounded bg-emerald-500"
                          style={{ width: `${pct * 100}%` }}
                          aria-label={`Voorsprongbalk, ${Math.round(pct * 100)}%`}
                        />
                      </div>
                      <div className="mt-1 hidden sm:flex gap-3 text-[11px] text-gray-600">
                        <span>G {r.games_played}</span>
                        <span>W {r.wins}</span>
                        <span>D {r.draws}</span>
                        <span>L {r.losses}</span>
                        {r.bonus_points ? <span>Bonus {r.bonus_points}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points pill rechts */}
                <div className="col-span-3 sm:col-span-5 flex sm:justify-end">
                  <div className="ml-auto sm:ml-0 px-3 py-1.5 rounded-full bg-indigo-600 text-white font-bold">
                    {r.points}
                    <span className="ml-1 text-xs font-normal opacity-90">pt</span>
                  </div>
                </div>
              </div>

              {/* Op mobiel: kleine stats onder de naam */}
              <div className="mt-2 sm:hidden pl-14 text-xs text-gray-600">
                <span className="mr-3">G {r.games_played}</span>
                <span className="mr-3">W {r.wins}</span>
                <span className="mr-3">D {r.draws}</span>
                <span>L {r.losses}</span>
                {r.bonus_points ? <span className="ml-3">Bonus {r.bonus_points}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}