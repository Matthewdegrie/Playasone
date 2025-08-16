// src/app/invite/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

type InviteRow = {
  id: string;
  token: string;
  league_id: string;
};

type LeagueRow = {
  id: string;
  name: string | null;
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) user (mag null zijn)
        const { data: uRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!cancelled && uRes?.user) {
          setMe({ id: uRes.user.id, email: uRes.user.email ?? null });
        }

        // 2) invite ophalen (zonder used_at)
        const { data: inv, error: iErr } = await supabase
          .from('invites')
          .select('id, token, league_id')
          .eq('token', String(token))
          .maybeSingle();

        if (iErr) throw iErr;
        if (!inv) {
          if (!cancelled) {
            setErr('Invite niet gevonden of al gebruikt.');
            setLoading(false);
          }
          return;
        }
        if (!cancelled) setInvite(inv as InviteRow);

        // 3) league naam
        const { data: lg, error: lErr } = await supabase
          .from('leagues')
          .select('id, name')
          .eq('id', inv.league_id)
          .maybeSingle();

        if (lErr) throw lErr;
        if (!cancelled) setLeague(lg as LeagueRow);

        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? String(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const goLogin = () => {
    router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  };

  const accept = async () => {
    if (!invite) return;
    try {
      setLoading(true);

      // check login
      const { data: uRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!uRes?.user) {
        setLoading(false);
        goLogin();
        return;
      }

      // lidmaatschap (voorkomt dubbel via onConflict)
      const { error: upErr } = await supabase
        .from('league_members')
        .upsert(
          { league_id: invite.league_id, user_id: uRes.user.id, role: 'member' },
          { onConflict: 'league_id,user_id' }
        );
      if (upErr) throw upErr;

      // (optioneel) invite op gebruikt zetten als je later kolom toevoegt
      // await supabase.from('invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);

      router.replace(`/leagues/${invite.league_id}`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      </main>
    );
  }

  if (err) {
    return (
      <main className="p-6">
        <p>✖ {err}</p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="p-6">
        <p>✖ Invite niet gevonden of al gebruikt.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Uitnodiging</h1>
      <p>
        Je bent uitgenodigd voor{' '}
        <span className="font-medium">{league?.name ?? 'deze league'}</span>.
      </p>

      {!me ? (
        <div className="space-y-2">
          <p>Log in om de uitnodiging te accepteren.</p>
          <button
            onClick={goLogin}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-900"
          >
            Inloggen
          </button>
        </div>
      ) : (
        <div className="space-x-2">
          <button
            onClick={accept}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-900"
          >
            Uitnodiging accepteren
          </button>
        </div>
      )}
    </main>
  );
}