'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 1) haal user + zijn profiel op
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setOk(null);

        const { data: u, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!u.user) {
          // niet ingelogd → naar login
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', u.user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          // in theorie maakt de trigger meteen je profiel aan
          // maar indien het nog niet bestaat, maken we er één
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({
              id: u.user.id,
              username: (u.user.email ?? '').split('@')[0] || null,
            });
          if (insErr) throw insErr;

          // opnieuw ophalen
          const { data: d2, error: e2 } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', u.user.id)
            .single();
          if (e2) throw e2;
          setProfile(d2);
          setUsername(d2.username ?? '');
          setFullName(d2.full_name ?? '');
          setAvatarUrl(d2.avatar_url ?? '');
        } else {
          setProfile(data);
          setUsername(data.username ?? '');
          setFullName(data.full_name ?? '');
          setAvatarUrl(data.avatar_url ?? '');
        }
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // 2) opslaan
  const onSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username || null,
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setOk('✅ Profiel opgeslagen.');
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Profiel</h1>

      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          {loading ? (
            <p className="text-gray-600">…laden…</p>
          ) : err ? (
            <p className="text-red-600">✖ {err}</p>
          ) : (
            <>
              {ok && <p className="text-green-700">{ok}</p>}

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Gebruikersnaam</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jouw_naam"
                />
                <p className="text-xs text-gray-500">
                  Uniek in de app (gebruikers kunnen je hiermee terugvinden).
                </p>
              </div>

              {/* Volledige naam */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Volledige naam</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Voornaam Achternaam"
                />
              </div>

              {/* Avatar URL (simpel) */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Avatar URL (optioneel)</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…/mijn-avatar.png"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button disabled={saving} onClick={onSave}>
                  {saving ? 'Opslaan…' : 'Opslaan'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  type="button"
                >
                  Terug
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}