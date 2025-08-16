'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileEditPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    avatar_url: '',
    first_name: '',
    last_name: '',
    nickname: '',
    username: '',
    experience_level: 0,
    birthday: '',
    gender: '',
    phone: '',
    country: '',
    language: '',
    bio: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        router.replace('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
      if (data) {
        setForm({
          avatar_url: data.avatar_url ?? '',
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          nickname: data.nickname ?? '',
          username: data.username ?? '',
          experience_level: Number(data.experience_level ?? 0),
          birthday: data.birthday ?? '',
          gender: data.gender ?? '',
          phone: data.phone ?? '',
          country: data.country ?? '',
          language: data.language ?? '',
          bio: data.bio ?? '',
        });
      }
    })();
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error('Niet ingelogd');

      const payload = { ...form, id: u.user.id, updated_at: new Date().toISOString() };
      // upsert (insert of update eigen profiel)
      const { error } = await supabase.from('profiles').upsert(payload).eq('id', u.user.id);
      if (error) throw error;

      setMsg('✅ Profiel opgeslagen.');
      setTimeout(() => router.replace('/profile'), 800);
    } catch (e: any) {
      setMsg(`✖ Kon profiel niet opslaan: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Profiel bewerken</h1>

      <Card>
        <CardHeader>
          <CardTitle>Jouw gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Avatar URL</label>
              <Input
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Voornaam</label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Achternaam</label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Nickname</label>
              <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Experience level</label>
              <Input
                type="number"
                value={form.experience_level}
                onChange={(e) => setForm({ ...form, experience_level: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Birthday</label>
              <Input type="date" value={form.birthday ?? ''} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Land</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Taal</label>
              <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <Button type="submit" disabled={busy}>{busy ? 'Opslaan…' : 'Opslaan'}</Button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}