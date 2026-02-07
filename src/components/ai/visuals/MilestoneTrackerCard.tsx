'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Trophy, Target } from 'lucide-react';
import type { MilestoneTrackerVisual } from '@/types/chat-visuals';

export function MilestoneTrackerCard({ data }: { data: MilestoneTrackerVisual }) {
  const { player, milestones, careerTotals } = data;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'points': return { bg: 'bg-orange-500', text: 'text-orange-400', bar: 'from-orange-500 to-orange-600' };
      case 'rebounds': return { bg: 'bg-blue-500', text: 'text-blue-400', bar: 'from-blue-500 to-blue-600' };
      case 'assists': return { bg: 'bg-green-500', text: 'text-green-400', bar: 'from-green-500 to-green-600' };
      case 'games': return { bg: 'bg-purple-500', text: 'text-purple-400', bar: 'from-purple-500 to-purple-600' };
      default: return { bg: 'bg-white/20', text: 'text-white/60', bar: 'from-white/20 to-white/30' };
    }
  };

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-yellow-500/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">Career Milestones</p>
        </div>
        <Trophy className="w-5 h-5 text-yellow-400" />
      </div>

      {/* Career Totals */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2 border-b border-white/10">
        <div className="text-center">
          <p className="text-lg font-bold text-white tabular-nums">{careerTotals.points.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 uppercase">Points</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white tabular-nums">{careerTotals.rebounds.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 uppercase">Rebounds</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white tabular-nums">{careerTotals.assists.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 uppercase">Assists</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white tabular-nums">{careerTotals.games.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 uppercase">Games</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="px-4 py-3 space-y-4">
        {milestones.length > 0 ? (
          milestones.map((milestone, i) => {
            const colors = getCategoryColor(milestone.category);
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Target className={cn("w-3.5 h-3.5", colors.text)} />
                    <span className="text-xs font-medium text-white">{milestone.name}</span>
                  </div>
                  <span className={cn("text-xs font-bold", colors.text)}>
                    {milestone.percentComplete}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all", colors.bar)}
                    style={{ width: `${Math.min(100, milestone.percentComplete)}%` }}
                  />
                </div>

                <div className="flex justify-between mt-1 text-[10px] text-white/40">
                  <span>{milestone.current.toLocaleString()} / {milestone.target.toLocaleString()}</span>
                  <span>{milestone.remaining.toLocaleString()} remaining (~{milestone.estimatedGames} games)</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-white/40 text-center py-4">No approaching milestones found</p>
        )}
      </div>
    </div>
  );
}
