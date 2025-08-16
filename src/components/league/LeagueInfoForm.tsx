'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Props = {
  leagueId: string;
};

type LeagueRow = {
  name: string | null;
  description: string | null;
  join_key: string | null;
  created_at: string | null;
};

const fmt = new Intl.DateTimeFormat('nl-BE', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default function LeagueInfoForm({ leagueId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState<string>('');
  const [joinKey, setJoinKey] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return !saving && name.trim().length >= 2;
  }, [saving, name]);

  const loadLeague = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('leagues')
      .select('name, description, join_key, created_at')
      .eq('id', leagueId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      return;
    }
    const row = (data ?? {}) as LeagueRow;
    setName(row.name ?? '');
    setDescription(row.description ?? '');
    setJoinKey(row.join_key ?? '');
    setCreatedAt(row.created_at ?? null);
  }, [leagueId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await loadLeague();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [loadLeague]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Naam moet minstens 2 tekens bevatten.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('leagues')
      .update({
        name: trimmed,
        description: description?.trim() || null,
      })
      .eq('id', leagueId);

    if (error) {
      setError(error.message);
    } else {
      setMsg('✅ League opgeslagen.');
      // kleine auto-hide
      setTimeout(() => setMsg(null), 2000);
    }
    setSaving(false);
  };

  async function copyJoinKey() {
    try {
      await navigator.clipboard.writeText(joinKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e: any) {
      setError('Kon join key niet kopiëren.');
    }
  }

  async function regenerateJoinKey() {
    setRegenBusy(true);
    setError(null);
    setMsg(null);
    try {
      // simpele leesbare key (6 tekens). Pas aan naar jouw wens.
      const newKey = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { error } = await supabase
        .from('leagues')
        .update({ join_key: newKey })
        .eq('id', leagueId)
        .select('join_key')
        .maybeSingle();

      if (error) throw error;
      setJoinKey(newKey);
      setMsg('🔑 Nieuwe join key ingesteld.');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message ?? 'Kon join key niet wijzigen (rechten?).');
    } finally {
      setRegenBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border p-4">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mb-2 h-9 w-full animate-pulse rounded bg-gray-200" />
        <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border p-4">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          ✖ {error}
        </div>
      )}
      {msg && (
        <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {msg}
        </div>
      )}

      {/* Naam */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Naam</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Naam van de league"
          minLength={2}
          required
        />
        <p className="text-xs text-gray-500">
          Minstens 2 tekens. Huidige lengte: {name.trim().length}
        </p>
      </div>

      {/* Beschrijving */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Beschrijving</label>
        <textarea
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[96px] rounded border px-3 py-2"
          placeholder="Korte beschrijving (optioneel)"
        />
        <p className="text-xs text-gray-500">
          Beschrijf kort wat deze league uniek maakt (optioneel).
        </p>
      </div>

      {/* Join key (alleen lezen) */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Join key</label>
        <div className="flex items-center gap-2">
          <input
            value={joinKey}
            readOnly
            className="w-full rounded border px-3 py-2 font-mono"
            placeholder="—"
          />
          <button
            type="button"
            onClick={copyJoinKey}
            className="whitespace-nowrap rounded border px-3 py-2 text-sm hover:bg-gray-50"
            disabled={!joinKey}
          >
            {copied ? 'Gekopieerd ✓' : 'Kopieer'}
          </button>
          <button
            type="button"
            onClick={regenerateJoinKey}
            className="whitespace-nowrap rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={regenBusy}
            title="Nieuwe join key genereren"
          >
            {regenBusy ? 'Bezig…' : 'Nieuwe key'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Deel deze key om anderen snel te laten joinen (afhankelijk van je rules).
        </p>
      </div>

      {/* Aangemaakt op (alleen lezen) */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Aangemaakt</label>
        <input
          value={createdAt ? fmt.format(new Date(createdAt)) : '—'}
          readOnly
          className="w-full rounded border px-3 py-2 bg-gray-50 text-gray-700"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          type="button"
          onClick={loadLeague}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          disabled={saving}
        >
          Herladen
        </button>
      </div>
    </form>
  );
}