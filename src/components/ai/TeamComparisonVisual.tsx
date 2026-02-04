'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Trophy, Shield, Target } from 'lucide-react';

interface TeamComparisonData {
  team1: {
    name: string;
    abbreviation: string;
    logo: string;
    record: { wins: number; losses: number; winPct: string };
    stats: { ppg: number; oppg: number; rpg: number; apg: number; fgPct: number; fg3Pct: number; ftPct: number };
  };
  team2: {
    name: string;
    abbreviation: string;
    logo: string;
    record: { wins: number; losses: number; winPct: string };
    stats: { ppg: number; oppg: number; rpg: number; apg: number; fgPct: number; fg3Pct: number; ftPct: number };
  };
  categories: Array<{
    name: string;
    team1Value: string | number;
    team2Value: string | number;
    winner: 'team1' | 'team2' | 'tie';
  }>;
}

export function TeamComparisonCard({ comparison }: { comparison: TeamComparisonData }) {
  const { team1, team2, categories } = comparison;
  const t1Wins = categories.filter(c => c.winner === 'team1').length;
  const t2Wins = categories.filter(c => c.winner === 'team2').length;

  return (
    <div className="w-full max-w-2xl mx-auto my-4 animate-fade-in">
      {/* Header - Team Logos + Records */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-500/10 via-transparent to-orange-500/10">
          <div className="flex items-center justify-between">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Image
                src={team1.logo}
                alt={team1.abbreviation}
                width={64}
                height={64}
                className="object-contain"
                unoptimized
              />
              <h3 className="font-bold text-white text-sm text-center">{team1.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">{team1.record.wins}</span>
                <span className="text-white/30">-</span>
                <span className="text-red-400 font-bold">{team1.record.losses}</span>
              </div>
              <span className="text-xs text-white/40">{team1.record.winPct}%</span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">VS</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded",
                  t1Wins > t2Wins ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                )}>
                  {t1Wins}
                </span>
                <span className="text-white/30 text-xs">-</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded",
                  t2Wins > t1Wins ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                )}>
                  {t2Wins}
                </span>
              </div>
              <span className="text-[10px] text-white/30">categories</span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Image
                src={team2.logo}
                alt={team2.abbreviation}
                width={64}
                height={64}
                className="object-contain"
                unoptimized
              />
              <h3 className="font-bold text-white text-sm text-center">{team2.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold">{team2.record.wins}</span>
                <span className="text-white/30">-</span>
                <span className="text-red-400 font-bold">{team2.record.losses}</span>
              </div>
              <span className="text-xs text-white/40">{team2.record.winPct}%</span>
            </div>
          </div>
        </div>

        {/* Category Comparison Bars */}
        <div className="p-4 space-y-3">
          {categories.map((cat) => (
            <div key={cat.name} className="group">
              {/* Category Label */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium tabular-nums",
                  cat.winner === 'team1' ? "text-blue-400" : "text-white/50"
                )}>
                  {cat.team1Value}
                </span>
                <span className="text-xs text-white/40 uppercase tracking-wider">{cat.name}</span>
                <span className={cn(
                  "text-sm font-medium tabular-nums",
                  cat.winner === 'team2' ? "text-orange-400" : "text-white/50"
                )}>
                  {cat.team2Value}
                </span>
              </div>

              {/* Comparison Bar */}
              <div className="flex items-center gap-1 h-2">
                <div className={cn(
                  "h-full rounded-l-full transition-all",
                  cat.winner === 'team1' ? "bg-blue-500" : cat.winner === 'tie' ? "bg-white/20" : "bg-blue-500/30"
                )} style={{ flex: 1 }} />
                <div className={cn(
                  "h-full rounded-r-full transition-all",
                  cat.winner === 'team2' ? "bg-orange-500" : cat.winner === 'tie' ? "bg-white/20" : "bg-orange-500/30"
                )} style={{ flex: 1 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-4 py-3 rounded-xl bg-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-white/50">{team1.abbreviation}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-white/50">{team2.abbreviation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
