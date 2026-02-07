'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle, Target } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { PlayerProjectionVisual } from '@/types/chat-visuals';

export function PlayerProjectionCard({ data }: { data: PlayerProjectionVisual }) {
  const { player, projectedStats, seasonAvg, recentTrend, opponent, confidence } = data;

  const confidenceColor = confidence === 'high' ? 'text-green-400' : confidence === 'medium' ? 'text-yellow-400' : 'text-red-400';
  const confidenceBg = confidence === 'high' ? 'bg-green-500/20' : confidence === 'medium' ? 'bg-yellow-500/20' : 'bg-red-500/20';

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-orange-500/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">
            Projection{opponent ? ` vs ${opponent}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", confidenceBg, confidenceColor)}>
            {confidence} confidence
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Est.
          </span>
        </div>
      </div>

      {/* Projected Stats */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        {/* Points */}
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/40 uppercase mb-1">Points</p>
          <p className="text-2xl font-bold text-orange-400">{projectedStats.points.value}</p>
          <p className="text-[10px] text-white/30">{projectedStats.points.low} - {projectedStats.points.high}</p>
          <p className="text-[10px] text-white/20 mt-1">Avg: {seasonAvg.points}</p>
        </div>
        {/* Rebounds */}
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/40 uppercase mb-1">Rebounds</p>
          <p className="text-2xl font-bold text-blue-400">{projectedStats.rebounds.value}</p>
          <p className="text-[10px] text-white/30">{projectedStats.rebounds.low} - {projectedStats.rebounds.high}</p>
          <p className="text-[10px] text-white/20 mt-1">Avg: {seasonAvg.rebounds}</p>
        </div>
        {/* Assists */}
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/40 uppercase mb-1">Assists</p>
          <p className="text-2xl font-bold text-green-400">{projectedStats.assists.value}</p>
          <p className="text-[10px] text-white/30">{projectedStats.assists.low} - {projectedStats.assists.high}</p>
          <p className="text-[10px] text-white/20 mt-1">Avg: {seasonAvg.assists}</p>
        </div>
      </div>

      {/* Recent Trend Chart */}
      {recentTrend.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Recent Trend
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={recentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="game"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <ReferenceLine y={seasonAvg.points} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="points" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
              <Line type="monotone" dataKey="rebounds" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2, fill: '#3B82F6' }} />
              <Line type="monotone" dataKey="assists" stroke="#22C55E" strokeWidth={1.5} dot={{ r: 2, fill: '#22C55E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projection indicator */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 text-xs text-white/40">
        <Target className="w-3 h-3" />
        <span>Projection based on season averages and recent performance</span>
      </div>
    </div>
  );
}
