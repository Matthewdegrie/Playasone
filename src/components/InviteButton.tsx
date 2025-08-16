'use client';

import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Props = {
  leagueId: string;
  leagueName: string | null;
};

/**
 * Basis-URL:
 * 1) NEXT_PUBLIC_APP_URL (prod / preview),
 * 2) window.location.origin (dev),
 * 3) fallback http://localhost:3000
 */
function getBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const fromEnv = env ? env.replace(/\/+$/, '') : '';
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/** Veilige token-generator met fallback voor browsers zonder crypto.randomUUID */
function makeToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // fallback: 32 tekens base36
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join('');
}

export default function InviteButton({ leagueId, leagueName }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const safeLeagueName = useMemo(
    () => (leagueName?.trim() ? leagueName.trim() : 'mijn league'),
    [leagueName]
  );

  const createInviteText = useCallback(async () => {
    // 1) ingelogd?
    const { data: u, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    if (!u?.user) throw new Error('Je moet eerst inloggen.');

    // 2) token genereren en invite rij inserten
    const token = makeToken();
    const { error: insErr } = await supabase.from('invites').insert({
      league_id: leagueId,
      inviter_id: u.user.id,
      token,
      // status: 'pending' // optioneel, als je een statuskolom hebt
    });
    if (insErr) {
      if ((insErr as any).code === '42501') {
        throw new Error('Je hebt geen rechten om invites aan te maken (RLS/policy).');
      }
      throw insErr;
    }

    // 3) share payload opbouwen
    const base = getBaseUrl();
    const url = `${base}/invite/${token}`;
    const title = `Uitnodiging – ${safeLeagueName}`;
    const text = `Hey! Ik nodig je uit voor de league “${safeLeagueName}” op PlayAsOne.\n\nJoin via: ${url}`;
    const subject = `Uitnodiging voor “${safeLeagueName}”`;

    return { url, title, text, subject };
  }, [leagueId, safeLeagueName]);

  async function handleWhatsApp() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const { text } = await createInviteText();
      const encoded = encodeURIComponent(text);
      // Universele wa.me-link (mobiel + WhatsApp Web)
      window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
      setMsg('WhatsApp geopend (of WhatsApp Web).');
    } catch (e: any) {
      setMsg(`✖ Niet gelukt: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const { text, subject } = await createInviteText();
      const body = encodeURIComponent(text);
      const sub = encodeURIComponent(subject);
      window.location.href = `mailto:?subject=${sub}&body=${body}`;
      setMsg('E‑mail opgestart.');
    } catch (e: any) {
      setMsg(`✖ Niet gelukt: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleWhatsApp}
        disabled={busy}
        aria-label="Uitnodigen via WhatsApp"
        className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {busy ? 'Bezig…' : 'Deel via WhatsApp'}
      </button>

      <button
        type="button"
        onClick={handleEmail}
        disabled={busy}
        aria-label="Uitnodigen via e‑mail"
        className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Bezig…' : 'Deel via e‑mail'}
      </button>

      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </div>
  );
}