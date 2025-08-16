'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Props = {
  leagueId: string;
  leagueName: string | null;
};

export default function InviteShareButton({ leagueId, leagueName }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onShare() {
    setMsg(null);
    setBusy(true);
    try {
      // 1) check login
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        setMsg('Log eerst in om een invite te maken.');
        return;
      }

      // 2) token + invite rij
      const token = crypto.randomUUID();
      const inviter_id = u.user.id;

      const { error: insErr } = await supabase
        .from('invites')
        .insert({
          league_id: leagueId,
          inviter_id,
          token,
          status: 'pending',
        });

      if (insErr) throw insErr;

      // 3) deelbare link
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, '');
      const url = `${base}/invite/${token}`;

      const text =
        `Hey! Ik nodig je uit voor mijn league` +
        (leagueName ? ` “${leagueName}”` : '') +
        `. Klik om te joinen:\n${url}`;

      // 4) native share -> whatsapp fallback -> copy
      if (navigator.share) {
        await navigator.share({ title: 'PlayAsOne', text, url });
        setMsg('Deelvenster geopend ✅');
      } else {
        // simpele WhatsApp fallback op mobiel
        const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(wa, '_blank', 'noopener,noreferrer');
        setMsg('WhatsApp geopend ✅');
      }
    } catch (e: any) {
      setMsg(`Kon geen invite delen: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onShare}
        disabled={busy}
        className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? 'Maken…' : 'Deelbare link'}
      </button>
      {msg && <span className="text-xs text-gray-600">{msg}</span>}
    </div>
  );
}