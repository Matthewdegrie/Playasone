'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Row = {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: { username: string | null; nickname: string | null; avatar_url: string | null };
};

export default function RequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        window.location.href = '/login';
        return;
      }
      const uid = u.user.id;
      setLoading(true);
      // requests waar jij de target bent
      const { data } = await supabase
        .from('follow_requests')
        .select('id, requester_id, target_id, status, created_at')
        .eq('target_id', uid)
        .order('created_at', { ascending: false });
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    await supabase.from('follow_requests').update({ status }).eq('id', id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-8">…Laden…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Requests</h1>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-600">
            Geen openstaande verzoeken.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Verzoek</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div><strong>Status:</strong> {r.status}</div>
                    <div className="text-gray-600">Request ID: {r.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => updateStatus(r.id, 'declined')}>Weiger</Button>
                    <Button onClick={() => updateStatus(r.id, 'accepted')}>Accepteer</Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}