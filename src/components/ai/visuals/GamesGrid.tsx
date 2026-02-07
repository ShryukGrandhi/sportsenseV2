'use client';

import { Calendar } from 'lucide-react';
import { GameCard } from './GameCard';
import type { VisualGameData } from '@/types/chat-visuals';

export function GamesGrid({ games, title, dateDisplay }: { games: VisualGameData[]; title?: string; dateDisplay?: string }) {
  if (games.length === 0) return null;

  let displayTitle = title || "Today's Games";
  if (dateDisplay) {
    if (dateDisplay === 'Today') {
      displayTitle = "Today's Games";
    } else if (dateDisplay === 'Tomorrow') {
      displayTitle = "Tomorrow's Games";
    } else if (dateDisplay === 'Yesterday') {
      displayTitle = "Yesterday's Games";
    } else {
      try {
        const date = new Date(dateDisplay);
        if (!isNaN(date.getTime())) {
          const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          };
          const formattedDate = date.toLocaleDateString('en-US', options);
          displayTitle = `${formattedDate}'s Games`;
        } else {
          displayTitle = `${dateDisplay}'s Games`;
        }
      } catch {
        displayTitle = `${dateDisplay}'s Games`;
      }
    }
  }

  return (
    <div className="w-full my-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">{displayTitle}</h3>
        <span className="text-xs text-white/40">({games.length} {games.length === 1 ? 'game' : 'games'})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {games.map((game) => (
          <GameCard key={game.gameId} game={game} />
        ))}
      </div>
    </div>
  );
}
