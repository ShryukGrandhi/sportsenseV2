'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Zap, AlertTriangle, MapPin, Clock } from 'lucide-react';
import type { GamePredictionVisual } from '@/types/chat-visuals';

export function GamePredictionCard({ data }: { data: GamePredictionVisual }) {
  const { homeTeam, awayTeam, homeWinProbability, keyMatchups, gameTime, venue } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-orange-500/5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Game Prediction</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Estimated
          </span>
        </div>
        {gameTime && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            <span>{gameTime}</span>
          </div>
        )}
      </div>

      {/* Matchup */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex-1 text-center">
            <Image src={awayTeam.logo} alt={awayTeam.abbreviation} width={56} height={56} className="object-contain mx-auto mb-2" unoptimized />
            <p className="font-bold text-white">{awayTeam.abbreviation}</p>
            <p className="text-xs text-white/40">{awayTeam.record}</p>
            <div className="mt-2 flex justify-center gap-1">
              {awayTeam.recentForm.split('-').map((r, i) => (
                <span key={i} className={cn(
                  "w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold",
                  r === 'W' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* VS & Predicted Score */}
          <div className="flex-shrink-0 px-4 text-center">
            <div className="flex items-center gap-3 mb-1">
              <span className={cn(
                "text-3xl font-bold tabular-nums",
                homeWinProbability < 50 ? "text-blue-400" : "text-white/50"
              )}>
                {awayTeam.predictedScore}
              </span>
              <span className="text-white/30 text-sm">-</span>
              <span className={cn(
                "text-3xl font-bold tabular-nums",
                homeWinProbability > 50 ? "text-green-400" : "text-white/50"
              )}>
                {homeTeam.predictedScore}
              </span>
            </div>
            <p className="text-[10px] text-white/30 uppercase">Predicted Score</p>
          </div>

          {/* Home Team */}
          <div className="flex-1 text-center">
            <Image src={homeTeam.logo} alt={homeTeam.abbreviation} width={56} height={56} className="object-contain mx-auto mb-2" unoptimized />
            <p className="font-bold text-white">{homeTeam.abbreviation}</p>
            <p className="text-xs text-white/40">{homeTeam.record}</p>
            <div className="mt-2 flex justify-center gap-1">
              {homeTeam.recentForm.split('-').map((r, i) => (
                <span key={i} className={cn(
                  "w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold",
                  r === 'W' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Win probability bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-blue-400 font-medium">{100 - homeWinProbability}%</span>
            <span className="text-green-400 font-medium">{homeWinProbability}%</span>
          </div>
          <div className="w-full h-3 bg-blue-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
              style={{ width: `${homeWinProbability}%`, float: 'right' }}
            />
          </div>
        </div>
      </div>

      {/* Key Matchups */}
      {keyMatchups.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/40 mb-2">Key Matchups</p>
          <div className="space-y-2">
            {keyMatchups.map((matchup, i) => (
              <div key={i} className="flex items-center text-xs">
                <span className={cn(
                  "w-16 text-right font-medium tabular-nums",
                  matchup.edge === 'away' ? "text-blue-400" : "text-white/60"
                )}>
                  {matchup.awayValue}
                </span>
                <span className="flex-1 text-center text-white/40 px-2">{matchup.category}</span>
                <span className={cn(
                  "w-16 font-medium tabular-nums",
                  matchup.edge === 'home' ? "text-green-400" : "text-white/60"
                )}>
                  {matchup.homeValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venue */}
      {venue && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-1 text-xs text-white/30">
          <MapPin className="w-3 h-3" />
          <span>{venue}</span>
        </div>
      )}
    </div>
  );
}
