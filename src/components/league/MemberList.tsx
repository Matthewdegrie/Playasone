'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import MemberRow from './MemberRow';

type Member = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profiles?: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
};

type Props = {
  leagueId: string;
  leagueName?: string | null;
};

export default function MemberList({ leagueId, leagueName }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const title = useMemo(
    () => (leagueName ? `Leden van ${leagueName}` : 'Leden'),
    [leagueName]
  );

  const load = useCallback(async () => {
    setErr(null);
    const { data, error } = await supabase
      .from('league_members')
      .select(
        'user_id, role, profiles(full_name, username, avatar_url, email)'
      )
      .eq('league_id', leagueId)
      // Owner eerst, dan admin, dan members
      .order('role', { ascending: true });

    if (error) {
      setErr(error.message);
      setMembers([]);
      return;
    }
    setMembers((data ?? []) as Member[]);
  }, [leagueId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [leagueId, load]);

  const onRefresh = async () => {
    setReloading(true);
    await load();
    setReloading(false);
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="border-b px-4 py-2 text-sm font-medium">{title}</div>
        <ul className="divide-y p-3">
          <li className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          </li>
          <li className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </li>
          <li className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </li>
        </ul>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-md border">
        <div className="border-b px-4 py-2 text-sm font-medium">{title}</div>
        <div className="p-4 text-sm text-red-600">✖ {err}</div>
      </div>
    );
  }

  const count = members.length;

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
        <div className="font-medium">
          {title}{' '}
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
            {count}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
          disabled={reloading}
        >
          {reloading ? 'Verversen…' : 'Verversen'}
        </button>
      </div>

      <ul className="divide-y">
        {count === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-600">Nog geen leden.</li>
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.user_id}
              name={m.profiles?.full_name || m.profiles?.username || 'Onbekend'}
              email={m.profiles?.email || undefined}
              avatarUrl={m.profiles?.avatar_url || undefined}
              role={m.role}
              leagueId={leagueId}
              leagueName={leagueName || undefined}
            />
          ))
        )}
      </ul>
    </div>
  );
}