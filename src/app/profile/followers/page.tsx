'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';

type Row = { follower_id: string; created_at: string };

export default function FollowersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        window.location.href = '/login';
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('followee_id', u.user.id)
        .order('created_at', { ascending: false });
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Followers</h1>
      {loading ? (
        '…Laden…'
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-gray-600">Nog geen volgers.</CardContent></Card>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r, i) => (
            <li key={i} className="rounded border p-3">
              follower_id: {r.follower_id}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}