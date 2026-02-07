'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Home, Plane } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { HomeAwaySplitVisual } from '@/types/chat-visuals';

export function HomeAwaySplitCard({ data }: { data: HomeAwaySplitVisual }) {
  const { player, home, away, biggestDifference } = data;

  const chartData = [
    { stat: 'PPG', Home: home.ppg, Away: away.ppg },
    { stat: 'RPG', Home: home.rpg, Away: away.rpg },
    { stat: 'APG', Home: home.apg, Away: away.apg },
    { stat: 'FG%', Home: home.fgPct, Away: away.fgPct },
    { stat: '3P%', Home: home.fg3Pct, Away: away.fg3Pct },
  ];

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-white/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">Home vs Away Splits</p>
        </div>
        {player.teamLogo && (
          <Image src={player.teamLogo} alt={player.team} width={24} height={24} className="object-contain" unoptimized />
        )}
      </div>

      {/* Chart */}
      <div className="px-4 pt-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="stat"
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
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}
            />
            <Bar dataKey="Home" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Away" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        {/* Home */}
        <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Home</span>
            <span className="text-[10px] text-white/40 ml-auto">{home.games} GP</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-white/50">Record</span><span className="text-white font-medium">{home.record}</span></div>
            <div className="flex justify-between"><span className="text-white/50">PPG</span><span className="text-white font-medium">{home.ppg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">RPG</span><span className="text-white font-medium">{home.rpg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">APG</span><span className="text-white font-medium">{home.apg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">FG%</span><span className="text-white font-medium">{home.fgPct.toFixed(1)}%</span></div>
          </div>
        </div>

        {/* Away */}
        <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-orange-400">Away</span>
            <span className="text-[10px] text-white/40 ml-auto">{away.games} GP</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-white/50">Record</span><span className="text-white font-medium">{away.record}</span></div>
            <div className="flex justify-between"><span className="text-white/50">PPG</span><span className="text-white font-medium">{away.ppg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">RPG</span><span className="text-white font-medium">{away.rpg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">APG</span><span className="text-white font-medium">{away.apg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">FG%</span><span className="text-white font-medium">{away.fgPct.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>

      {/* Biggest Difference */}
      {biggestDifference && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/50">
            Biggest split: <span className="text-white font-medium">{biggestDifference.stat}</span>
            {' '}({biggestDifference.homeDiff > 0 ? '+' : ''}{biggestDifference.homeDiff.toFixed(1)} at home)
          </p>
        </div>
      )}
    </div>
  );
}
