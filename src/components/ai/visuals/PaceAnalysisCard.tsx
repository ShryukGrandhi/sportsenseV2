'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Gauge, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { PaceAnalysisVisual } from '@/types/chat-visuals';

export function PaceAnalysisCard({ data }: { data: PaceAnalysisVisual }) {
  const { homeTeam, awayTeam, leagueAvgPace, scoringByQuarter, totalPossessions, pointsPerPossession } = data;

  const categorizePace = (pace: number) => {
    if (pace > leagueAvgPace + 3) return { label: 'Fast', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (pace < leagueAvgPace - 3) return { label: 'Slow', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { label: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  };

  const homePaceInfo = categorizePace(homeTeam.pace);
  const awayPaceInfo = categorizePace(awayTeam.pace);

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 bg-white/5">
        <Gauge className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-white">Pace Analysis</span>
      </div>

      {/* Pace Comparison */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        {/* Away pace */}
        <div className="text-center">
          <Image src={awayTeam.logo} alt={awayTeam.abbreviation} width={28} height={28} className="object-contain mx-auto mb-1" unoptimized />
          <p className="text-xs text-white/50">{awayTeam.abbreviation}</p>
          <p className="text-2xl font-bold text-white tabular-nums">{awayTeam.pace.toFixed(1)}</p>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", awayPaceInfo.bg, awayPaceInfo.color)}>
            {awayPaceInfo.label}
          </span>
        </div>

        {/* League average */}
        <div className="text-center flex flex-col items-center justify-center">
          <p className="text-[10px] text-white/30 uppercase">League Avg</p>
          <p className="text-lg font-medium text-white/40 tabular-nums">{leagueAvgPace.toFixed(1)}</p>
          <p className="text-[10px] text-white/30">possessions / 48 min</p>
        </div>

        {/* Home pace */}
        <div className="text-center">
          <Image src={homeTeam.logo} alt={homeTeam.abbreviation} width={28} height={28} className="object-contain mx-auto mb-1" unoptimized />
          <p className="text-xs text-white/50">{homeTeam.abbreviation}</p>
          <p className="text-2xl font-bold text-white tabular-nums">{homeTeam.pace.toFixed(1)}</p>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", homePaceInfo.bg, homePaceInfo.color)}>
            {homePaceInfo.label}
          </span>
        </div>
      </div>

      {/* Scoring by Quarter Chart */}
      {scoringByQuarter.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/40 mb-2">Scoring by Quarter</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scoringByQuarter} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="quarter"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
              <Bar name={awayTeam.abbreviation} dataKey="awayPoints" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar name={homeTeam.abbreviation} dataKey="homePoints" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Efficiency Stats */}
      <div className="px-4 py-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <p className="text-white/40 flex items-center gap-1"><Zap className="w-3 h-3" /> Possessions</p>
          <div className="flex justify-between">
            <span className="text-white/50">{awayTeam.abbreviation}</span>
            <span className="text-white font-medium tabular-nums">{totalPossessions.away}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">{homeTeam.abbreviation}</span>
            <span className="text-white font-medium tabular-nums">{totalPossessions.home}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-white/40">Pts/Possession</p>
          <div className="flex justify-between">
            <span className="text-white/50">{awayTeam.abbreviation}</span>
            <span className="text-white font-medium tabular-nums">{pointsPerPossession.away.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">{homeTeam.abbreviation}</span>
            <span className="text-white font-medium tabular-nums">{pointsPerPossession.home.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
