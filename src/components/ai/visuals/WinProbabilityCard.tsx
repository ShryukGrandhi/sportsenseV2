'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { WinProbabilityVisual } from '@/types/chat-visuals';

export function WinProbabilityCard({ data }: { data: WinProbabilityVisual }) {
  const { homeTeam, awayTeam, currentProbability, timeline, pivotalMoments, status } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between border-b border-white/10",
        status === 'live' && "bg-red-500/10",
        status === 'final' && "bg-green-500/10"
      )}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Win Probability</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Estimated
          </span>
        </div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full",
          status === 'live' ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        )}>
          {status === 'live' ? 'LIVE' : status === 'halftime' ? 'HALFTIME' : 'FINAL'}
        </span>
      </div>

      {/* Current probability */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={awayTeam.logo} alt={awayTeam.abbreviation} width={24} height={24} className="object-contain" unoptimized />
          <span className="text-sm font-medium text-white">{awayTeam.abbreviation}</span>
          <span className={cn(
            "text-lg font-bold tabular-nums",
            currentProbability < 50 ? "text-blue-400" : "text-white/50"
          )}>
            {100 - currentProbability}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-lg font-bold tabular-nums",
            currentProbability > 50 ? "text-green-400" : "text-white/50"
          )}>
            {currentProbability}%
          </span>
          <span className="text-sm font-medium text-white">{homeTeam.abbreviation}</span>
          <Image src={homeTeam.logo} alt={homeTeam.abbreviation} width={24} height={24} className="object-contain" unoptimized />
        </div>
      </div>

      {/* Probability bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-3 bg-blue-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
            style={{ width: `${currentProbability}%`, float: 'right' }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="minute"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={((value: unknown) => [
                `${homeTeam.abbreviation}: ${value}%`,
                'Win Prob'
              ]) as never}
              labelFormatter={(label) => `Minute ${label}`}
            />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
            <ReferenceLine x={12} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <ReferenceLine x={24} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <ReferenceLine x={36} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
            <defs>
              <linearGradient id="wpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#22C55E" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="homeProb"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#wpGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pivotal Moments */}
      {pivotalMoments.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/40 mb-2">Pivotal Moments</p>
          <div className="space-y-1.5">
            {pivotalMoments.slice(0, 3).map((moment, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-white/40 tabular-nums w-12">Q{moment.period} {moment.minute.toFixed(0)}&apos;</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums",
                  moment.probSwing > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {moment.probSwing > 0 ? '+' : ''}{moment.probSwing}%
                </span>
                <span className="text-white/60 truncate flex-1">{moment.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
