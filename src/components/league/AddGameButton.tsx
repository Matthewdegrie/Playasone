'use client';

import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';

type Props = {
  leagueId: string;
  className?: string;
};

export default function AddGameButton({ leagueId, className }: Props) {
  const router = useRouter();

  const goToNewGame = () => {
    // route die je games-create page gebruikt
    router.push(`/games/new?league_id=${encodeURIComponent(leagueId)}`);
  };

  return (
    <button
      onClick={goToNewGame}
      className={[
        'inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-900',
        className ?? '',
      ].join(' ')}
      aria-label="Nieuwe game"
    >
      <PlusIcon size={18} />
      Nieuwe game
    </button>
  );
}