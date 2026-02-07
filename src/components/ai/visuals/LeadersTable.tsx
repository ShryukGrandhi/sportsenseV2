'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Minus, Target, Flame, Shield,
  Zap, Star
} from 'lucide-react';
import type { VisualLeadersData } from '@/types/chat-visuals';

export function LeadersTable({ leaders }: { leaders: VisualLeadersData }) {
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('point') || cat.includes('scoring')) return <Flame className="w-4 h-4 text-orange-400" />;
    if (cat.includes('rebound')) return <Shield className="w-4 h-4 text-blue-400" />;
    if (cat.includes('assist')) return <Target className="w-4 h-4 text-green-400" />;
    if (cat.includes('steal')) return <Zap className="w-4 h-4 text-yellow-400" />;
    if (cat.includes('block')) return <Shield className="w-4 h-4 text-purple-400" />;
    return <Star className="w-4 h-4 text-white/60" />;
  };

  return (
    <div className="w-full my-4 bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          {getCategoryIcon(leaders.category)}
          <h3 className="text-sm font-semibold text-white">{leaders.category} Leaders</h3>
        </div>
      </div>

      {/* Players List */}
      <div className="divide-y divide-white/5">
        {leaders.players.map((player, index) => (
          <div
            key={player.name}
            className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
          >
            {/* Rank */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
              index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900" :
              index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900" :
              index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-slate-900" :
              "bg-white/10 text-white/60"
            )}>
              {player.rank}
            </div>

            {/* Player Photo */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-800">
              <Image
                src={player.headshot}
                alt={player.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{player.name}</p>
              <div className="flex items-center gap-2">
                <Image
                  src={player.teamLogo}
                  alt={player.team}
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
                <span className="text-xs text-white/50">{player.team}</span>
              </div>
            </div>

            {/* Value */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tabular-nums">{player.value}</span>
              {player.trend && (
                player.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                player.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                <Minus className="w-4 h-4 text-white/40" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
