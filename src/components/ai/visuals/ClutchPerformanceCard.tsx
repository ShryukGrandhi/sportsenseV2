'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Target, Flame } from 'lucide-react';
import type { ClutchPerformanceVisual } from '@/types/chat-visuals';

export function ClutchPerformanceCard({ data }: { data: ClutchPerformanceVisual }) {
  const { player, clutchStats, clutchRating, notableMoments } = data;

  // SVG arc for clutch meter
  const radius = 60;
  const circumference = Math.PI * radius; // Half circle
  const progress = (clutchRating / 100) * circumference;

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return { label: 'Elite', color: 'text-green-400' };
    if (rating >= 60) return { label: 'Clutch', color: 'text-blue-400' };
    if (rating >= 40) return { label: 'Average', color: 'text-yellow-400' };
    return { label: 'Needs Work', color: 'text-red-400' };
  };

  const ratingInfo = getRatingLabel(clutchRating);

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-red-500/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">Clutch Performance</p>
        </div>
        <Target className="w-5 h-5 text-red-400" />
      </div>

      {/* Clutch Meter */}
      <div className="px-4 py-4 flex items-center justify-center">
        <div className="relative">
          <svg width="140" height="80" viewBox="0 0 140 80">
            {/* Background arc */}
            <path
              d="M 10 70 A 60 60 0 0 1 130 70"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 70 A 60 60 0 0 1 130 70"
              fill="none"
              stroke={clutchRating >= 80 ? '#22C55E' : clutchRating >= 60 ? '#3B82F6' : clutchRating >= 40 ? '#EAB308' : '#EF4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <p className="text-2xl font-bold text-white">{clutchRating}</p>
            <p className={cn("text-xs font-medium", ratingInfo.color)}>{ratingInfo.label}</p>
          </div>
        </div>
      </div>

      {/* Clutch Stats */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{clutchStats.clutchPoints}</p>
          <p className="text-[10px] text-white/40">Clutch PTS</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{clutchStats.clutchFgPct.toFixed(1)}%</p>
          <p className="text-[10px] text-white/40">Clutch FG%</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{clutchStats.gameWinners}</p>
          <p className="text-[10px] text-white/40">Game Winners</p>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-white/50">
        <span>{clutchStats.clutchGames} clutch games out of {clutchStats.totalCloseGames} close games</span>
      </div>

      {/* Notable Moments */}
      {notableMoments.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Notable Clutch Moments
          </p>
          <div className="space-y-2">
            {notableMoments.slice(0, 3).map((moment, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-orange-400 font-bold tabular-nums">{moment.points} PTS</span>
                <span className="text-white/60">vs {moment.opponent}</span>
                <span className="text-white/30 ml-auto">{moment.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
