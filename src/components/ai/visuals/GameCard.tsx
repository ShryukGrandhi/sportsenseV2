'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import type { VisualGameData } from '@/types/chat-visuals';

export function GameCard({ game }: { game: VisualGameData }) {
  const isLive = game.status === 'live' || game.status === 'halftime';
  const isFinal = game.status === 'final';

  const homeWinning = game.homeTeam.score > game.awayTeam.score;
  const awayWinning = game.awayTeam.score > game.homeTeam.score;

  return (
    <Link
      href={`/nba/games/${game.gameId}`}
      className="block bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] overflow-hidden"
    >
      {/* Status Bar */}
      <div className={cn(
        "px-3 py-1.5 text-xs font-medium flex items-center justify-between",
        isLive ? "bg-red-500/20 text-red-400" :
        isFinal ? "bg-green-500/20 text-green-400" :
        "bg-blue-500/20 text-blue-400"
      )}>
        <div className="flex items-center gap-2">
          {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span>
            {game.status === 'live' ? `Q${game.period} ${game.clock}` :
             game.status === 'halftime' ? 'HALFTIME' :
             game.status === 'final' ? 'FINAL' :
             game.clock || 'Scheduled'}
          </span>
        </div>
        {game.broadcast && <span className="text-white/50">{game.broadcast}</span>}
      </div>

      {/* Teams */}
      <div className="p-3 space-y-2">
        {/* Away Team */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg transition-colors",
          awayWinning && (isLive || isFinal) ? "bg-green-500/10" : "bg-white/5"
        )}>
          <div className="flex items-center gap-3">
            <Image
              src={game.awayTeam.logo}
              alt={game.awayTeam.abbreviation}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
            <div>
              <p className="font-semibold text-white text-sm">{game.awayTeam.abbreviation}</p>
              {game.awayTeam.record && (
                <p className="text-xs text-white/40">{game.awayTeam.record}</p>
              )}
            </div>
          </div>
          <span className={cn(
            "text-xl font-bold tabular-nums",
            awayWinning && (isLive || isFinal) ? "text-green-400" : "text-white"
          )}>
            {game.awayTeam.score}
          </span>
        </div>

        {/* Home Team */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg transition-colors",
          homeWinning && (isLive || isFinal) ? "bg-green-500/10" : "bg-white/5"
        )}>
          <div className="flex items-center gap-3">
            <Image
              src={game.homeTeam.logo}
              alt={game.homeTeam.abbreviation}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
            <div>
              <p className="font-semibold text-white text-sm">{game.homeTeam.abbreviation}</p>
              {game.homeTeam.record && (
                <p className="text-xs text-white/40">{game.homeTeam.record}</p>
              )}
            </div>
          </div>
          <span className={cn(
            "text-xl font-bold tabular-nums",
            homeWinning && (isLive || isFinal) ? "text-green-400" : "text-white"
          )}>
            {game.homeTeam.score}
          </span>
        </div>
      </div>

      {/* Footer */}
      {game.venue && (
        <div className="px-3 pb-2 flex items-center gap-1 text-xs text-white/40">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{game.venue}</span>
        </div>
      )}
    </Link>
  );
}
