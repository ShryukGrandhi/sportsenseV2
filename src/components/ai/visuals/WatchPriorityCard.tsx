'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Eye, Clock, ChevronRight } from 'lucide-react';
import type { WatchPriorityVisual } from '@/types/chat-visuals';

export function WatchPriorityCard({ data }: { data: WatchPriorityVisual }) {
  const { games } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 bg-orange-500/5">
        <Eye className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-white">Must-Watch Rankings</span>
      </div>

      {/* Game List */}
      <div className="divide-y divide-white/5">
        {games.map((game, i) => (
          <Link
            key={game.gameId}
            href={`/nba/games/${game.gameId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
          >
            {/* Rank */}
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
              i === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900" :
              i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900" :
              i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-slate-900" :
              "bg-white/10 text-white/60"
            )}>
              {i + 1}
            </div>

            {/* Teams */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Image src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} width={20} height={20} className="object-contain" unoptimized />
                <span className="text-xs font-medium text-white">{game.awayTeam.abbreviation}</span>
                <span className="text-white/30 text-xs">@</span>
                <Image src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} width={20} height={20} className="object-contain" unoptimized />
                <span className="text-xs font-medium text-white">{game.homeTeam.abbreviation}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/40">{game.gameTime}</span>
              </div>
              {/* Reasons */}
              <div className="flex flex-wrap gap-1 mt-1">
                {game.reasons.slice(0, 2).map((reason, j) => (
                  <span key={j} className="text-[10px] text-white/50">{reason}</span>
                ))}
              </div>
            </div>

            {/* Watch Score */}
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      game.watchScore >= 80 ? "bg-green-500" :
                      game.watchScore >= 60 ? "bg-yellow-500" :
                      game.watchScore >= 40 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${game.watchScore}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs font-bold tabular-nums w-6",
                  game.watchScore >= 80 ? "text-green-400" :
                  game.watchScore >= 60 ? "text-yellow-400" : "text-orange-400"
                )}>
                  {game.watchScore}
                </span>
              </div>
              {/* Tags */}
              <div className="flex gap-1 mt-1 justify-end">
                {game.tags.slice(0, 2).map((tag, j) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
