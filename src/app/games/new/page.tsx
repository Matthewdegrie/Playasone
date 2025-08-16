import { Suspense } from 'react';
import NewGameClient from './NewGameClient';

export const dynamic = 'force-dynamic'; // voorkom SSG met hooks

export default function NewGamePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <NewGameClient />
    </Suspense>
  );
}