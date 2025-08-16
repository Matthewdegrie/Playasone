'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewGameClient() {
  const search = useSearchParams(); // veilig in client
  const router = useRouter();
  const leagueId = search.get('league_id') ?? '';

  // Placeholder velden; vervang door je echte form
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: submit naar je API / Supabase insert
    setMsg(`Game aangemaakt voor league ${leagueId} met score ${home}–${away}`);
    // router.push(`/leagues/${leagueId}?tab=games`);
  }

  return (
    <section className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Nieuwe game</h1>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className="text-sm">League</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-200 p-2"
            value={leagueId}
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Jij</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-neutral-200 p-2"
              value={home}
              onChange={(e) => setHome(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm">Tegenstander</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-neutral-200 p-2"
              value={away}
              onChange={(e) => setAway(Number(e.target.value))}
            />
          </div>
        </div>

        <button type="submit" className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white">
          Opslaan
        </button>

        {msg && <p className="text-green-600">{msg}</p>}
      </form>
    </section>
  );
}