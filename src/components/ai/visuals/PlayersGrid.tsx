'use client';

import { Users } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import type { VisualPlayerData } from '@/types/chat-visuals';

export function PlayersGrid({ players, title }: { players: VisualPlayerData[]; title?: string }) {
  if (players.length === 0) return null;

  return (
    <div className="w-full my-4">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
