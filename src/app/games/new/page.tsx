// src/app/games/new/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

type LeagueRow = { id: string; name: string | null };
type MemberRow = { user_id: string; label: string };

export default function AddGamePage() {
  const router = useRouter();
  const search = useSearchParams();

  // UI state
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [leagueId, setLeagueId] = useState<string>('');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);

  const [type, setType] = useState<'1v1' | '2v2'>('1v1');
  const [opponentId, setOpponentId] = useState<string>(''); // 1v1
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const preselectedLeague = search.get('league_id') ?? undefined;
  const preselectedOpponent = search.get('opponent_id') ?? undefined;

  // 1) Haal user + leagues op
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        // Wie ben ik?
        const { data: userData, error: uerr } = await supabase.auth.getUser();
        if (uerr) throw uerr;
        if (!userData.user) {
          router.replace('/login');
          return;
        }
        setMe({ id: userData.user.id, email: userData.user.email ?? null });

        // Leagues waar ik bij kan (RLS beperkt vanzelf tot member/owner)
        const { data: ldata, error: lerr } = await supabase
          .from('leagues')
          .select('id, name')
          .order('created_at', { ascending: false });

        if (lerr) throw lerr;
        const list = (ldata ?? []) as LeagueRow[];
        setLeagues(list);

        // Default league: query param > eerste league
        const initial =
          (preselectedLeague && list.find((l) => l.id === preselectedLeague)?.id) ||
          (list[0]?.id ?? '');
        setLeagueId(initial);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, preselectedLeague]);

  // 2) Bij gewijzigde league: haal leden op (zonder auth.users; gebruik profiles)
  const loadMembers = useCallback(
    async (lgId: string) => {
      if (!lgId) {
        setMembers([]);
        return;
      }
      try {
        setLoadingMembers(true);
        setError('');

        // 2a) member ids voor league
        const { data: memRows, error: memErr } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', lgId);

        if (memErr) throw memErr;

        const ids = (memRows ?? []).map((r: any) => r.user_id) as string[];
        if (ids.length === 0) {
          setMembers([]);
          return;
        }

        // 2b) labels uit profiles
        const { data: profRows, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, username, email')
          .in('id', ids);

        if (profErr) throw profErr;

        const byId = new Map<string, any>();
        (profRows ?? []).forEach((p: any) => byId.set(p.id, p));

        const ms: MemberRow[] = ids.map((uid) => {
          const p = byId.get(uid);
          const label =
            (p?.full_name as string | undefined) ||
            (p?.username as string | undefined) ||
            (p?.email as string | undefined) ||
            uid;
          return { user_id: uid, label };
        });

        ms.sort((a, b) => a.label.localeCompare(b.label, 'nl'));
        setMembers(ms);

        // Preselecteer tegenstander als meegegeven in query
        if (preselectedOpponent && ms.some((m) => m.user_id === preselectedOpponent)) {
          setOpponentId(preselectedOpponent);
        } else {
          setOpponentId('');
        }
      } catch (e: any) {
        setError(e.message ?? String(e));
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    },
    [preselectedOpponent]
  );

  useEffect(() => {
    if (leagueId) loadMembers(leagueId);
  }, [leagueId, loadMembers]);

  // 3) Validatie helpers
  const otherMembers = useMemo(() => {
    if (!me) return members;
    return members.filter((m) => m.user_id !== me.id);
  }, [members, me]);

  const hasAtLeastTwo = members.length >= 2;
  const scoresValid =
    Number.isFinite(homeScore) &&
    Number.isFinite(awayScore) &&
    homeScore >= 0 &&
    awayScore >= 0;

  // 4) Submit -> **insert in echte tabel 'games'**
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!me) return;
    if (!leagueId) {
      setError('Kies een league.');
      return;
    }
    if (!hasAtLeastTwo) {
      setError('Er moeten minstens 2 leden in deze league zitten.');
      return;
    }
    if (type === '1v1') {
      if (!opponentId) {
        setError('Kies een tegenstander.');
        return;
      }
      if (opponentId === me.id) {
        setError('Je kunt niet tegen jezelf spelen.');
        return;
      }
    }
    if (!scoresValid) {
      setError('Scores moeten 0 of hoger zijn.');
      return;
    }

    try {
      setSaving(true);

      // NB: winner_id / is_draw worden NIET opgeslagen in 'games'.
      // Je view (game_result_view) leidt die velden af. Daarom inserten we enkel de basisvelden hier.
      const payload: any = {
        league_id: leagueId,
        created_by: me.id,
        type, // '1v1' | '2v2' (2v2 later)
        home_user_id: me.id,
        away_user_id: type === '1v1' ? opponentId : null,
        home_score: Number(homeScore) || 0,
        away_score: Number(awayScore) || 0,
        comment: comment?.trim() ? comment.trim() : null,
        // Speelmoment—handig om te tonen/sorteren. Past in je view (coalesce(play ed_at, created_at))
        played_at: new Date().toISOString(),
      };

      const { data: inserted, error: ierr } = await supabase
        .from('games')
        .insert(payload)
        .select('id')
        .single();

      if (ierr) throw ierr;

      // Terug naar de league-feed (waar je de view leest)
      router.replace(`/leagues/${leagueId}?tab=feed`);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  // UI
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Nieuwe game</h1>

      {error ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          ✖ {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <div className="h-6 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* League keuze */}
          <div>
            <label className="mb-1 block text-sm">League</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name ?? 'Naamloos'}
                </option>
              ))}
            </select>
            {!hasAtLeastTwo ? (
              <p className="mt-2 text-sm text-gray-600">
                Minstens 2 leden nodig om een game toe te voegen.
              </p>
            ) : null}
          </div>

          {/* Type (2v2 gereserveerd voor later) */}
          <div>
            <label className="mb-1 block text-sm">Type</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="1v1"
                  checked={type === '1v1'}
                  onChange={() => setType('1v1')}
                />
                1 vs 1
              </label>
              <label className="inline-flex cursor-not-allowed items-center gap-2 opacity-50">
                <input
                  type="radio"
                  name="type"
                  value="2v2"
                  checked={type === '2v2'}
                  onChange={() => setType('2v2')}
                  disabled
                />
                2 vs 2 (later)
              </label>
            </div>
          </div>

          {/* Tegenstander (1v1) */}
          {type === '1v1' ? (
            <div>
              <label className="mb-1 block text-sm">Tegenstander</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={opponentId}
                onChange={(e) => setOpponentId(e.target.value)}
                disabled={!hasAtLeastTwo || loadingMembers}
              >
                <option value="">— kies —</option>
                {otherMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.label}
                  </option>
                ))}
              </select>
              {loadingMembers && (
                <p className="mt-1 text-xs text-gray-500">Leden aan het laden…</p>
              )}
            </div>
          ) : null}

          {/* Score */}
          <div>
            <label className="mb-1 block text-sm">Score</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                className="w-24 rounded border px-3 py-2"
                value={homeScore}
                onChange={(e) =>
                  setHomeScore(Math.max(0, Number.isFinite(+e.target.value) ? +e.target.value : 0))
                }
              />
              <span>-</span>
              <input
                type="number"
                min={0}
                step={1}
                className="w-24 rounded border px-3 py-2"
                value={awayScore}
                onChange={(e) =>
                  setAwayScore(Math.max(0, Number.isFinite(+e.target.value) ? +e.target.value : 0))
                }
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Linker score = jij, rechter score = tegenstander.
            </p>
          </div>

          {/* Comment (optioneel) */}
          <div>
            <label className="mb-1 block text-sm">Comment (optioneel)</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bv. leuke pot 🎾"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                saving || !hasAtLeastTwo || !scoresValid || (type === '1v1' && !opponentId)
              }
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border px-4 py-2"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
    </main>
  );
}