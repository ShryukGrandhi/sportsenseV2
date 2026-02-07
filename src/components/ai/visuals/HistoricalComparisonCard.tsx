'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts';
import type { HistoricalComparisonVisual } from '@/types/chat-visuals';

export function HistoricalComparisonCard({ data }: { data: HistoricalComparisonVisual }) {
  const { player, currentSeason, comparisonSeason, changes } = data;

  // Normalize stats for radar chart (scale to 0-100)
  const maxPpg = Math.max(currentSeason.ppg, comparisonSeason.ppg, 1);
  const maxRpg = Math.max(currentSeason.rpg, comparisonSeason.rpg, 1);
  const maxApg = Math.max(currentSeason.apg, comparisonSeason.apg, 1);

  const radarData = [
    { stat: 'PPG', current: (currentSeason.ppg / maxPpg) * 100, previous: (comparisonSeason.ppg / maxPpg) * 100 },
    { stat: 'RPG', current: (currentSeason.rpg / maxRpg) * 100, previous: (comparisonSeason.rpg / maxRpg) * 100 },
    { stat: 'APG', current: (currentSeason.apg / maxApg) * 100, previous: (comparisonSeason.apg / maxApg) * 100 },
    { stat: 'FG%', current: currentSeason.fgPct, previous: comparisonSeason.fgPct },
    { stat: '3P%', current: currentSeason.fg3Pct, previous: comparisonSeason.fg3Pct },
  ];

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-purple-500/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">{currentSeason.year} vs {comparisonSeason.year}</p>
        </div>
        <History className="w-5 h-5 text-purple-400" />
      </div>

      {/* Radar Chart */}
      <div className="px-4 pt-4">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            <Radar
              name={currentSeason.year}
              dataKey="current"
              stroke="#F97316"
              fill="#F97316"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name={comparisonSeason.year}
              dataKey="previous"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Changes Table */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {changes.map((change, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-white/50 w-12">{change.stat}</span>
              <span className="text-white/60 tabular-nums w-14 text-right">{change.previous.toFixed(1)}</span>
              <div className="flex-1 flex items-center justify-center">
                {change.improved ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                ) : change.change === 0 ? (
                  <Minus className="w-3.5 h-3.5 text-white/30" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
              <span className="text-white font-medium tabular-nums w-14">{change.current.toFixed(1)}</span>
              <span className={cn(
                "tabular-nums w-16 text-right font-medium",
                change.improved ? "text-green-400" : change.change === 0 ? "text-white/30" : "text-red-400"
              )}>
                {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}
                {change.changePercent !== 0 && (
                  <span className="text-[10px] text-white/30"> ({change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(0)}%)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
        <span>{comparisonSeason.year}: {comparisonSeason.gamesPlayed} GP</span>
        <span>{currentSeason.year}: {currentSeason.gamesPlayed} GP</span>
      </div>
    </div>
  );
}
