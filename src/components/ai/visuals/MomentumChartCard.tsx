'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Activity, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { MomentumChartVisual } from '@/types/chat-visuals';

export function MomentumChartCard({ data }: { data: MomentumChartVisual }) {
  const { homeTeam, awayTeam, timeline, scoringRuns, leadChanges, largestLead, status } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between border-b border-white/10",
        status === 'live' && "bg-red-500/10",
        status === 'final' && "bg-green-500/10"
      )}>
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Game Momentum</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            status === 'live' && "bg-red-500/20 text-red-400",
            status === 'final' && "bg-green-500/20 text-green-400"
          )}>
            {status === 'live' ? 'LIVE' : status === 'halftime' ? 'HALFTIME' : 'FINAL'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Image src={awayTeam.logo} alt={awayTeam.abbreviation} width={16} height={16} className="object-contain" unoptimized />
            <span className="text-white/60">{awayTeam.abbreviation}</span>
          </div>
          <span className="text-white/30">vs</span>
          <div className="flex items-center gap-1.5">
            <Image src={homeTeam.logo} alt={homeTeam.abbreviation} width={16} height={16} className="object-contain" unoptimized />
            <span className="text-white/60">{homeTeam.abbreviation}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-1 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> {awayTeam.abbreviation} leading
          </span>
          <span className="flex items-center gap-1">
            {homeTeam.abbreviation} leading <span className="w-2 h-2 rounded-full bg-green-500" />
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="minute"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              label={{ value: 'Game Minutes', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
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
              formatter={((value: unknown) => {
                const v = Number(value);
                const leader = v > 0 ? homeTeam.abbreviation : v < 0 ? awayTeam.abbreviation : 'Tied';
                return [`${leader} ${v > 0 ? '+' : ''}${v}`, 'Lead'];
              }) as never}
              labelFormatter={(label) => `Minute ${label}`}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            {/* Quarter dividers */}
            <ReferenceLine x={12} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <ReferenceLine x={24} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <ReferenceLine x={36} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            {/* Scoring run highlights */}
            {scoringRuns.slice(0, 3).map((run, i) => (
              <ReferenceArea
                key={i}
                x1={run.startMinute}
                x2={run.endMinute}
                fill={run.team === 'home' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)'}
                strokeOpacity={0}
              />
            ))}
            <defs>
              <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#22C55E" stopOpacity={0} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="scoreDiff"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#momentumGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scoring Runs */}
      {scoringRuns.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Key Scoring Runs
          </p>
          <div className="flex flex-wrap gap-2">
            {scoringRuns.map((run, i) => (
              <div
                key={i}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full border",
                  run.team === 'home'
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                )}
              >
                {run.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="px-4 py-3 border-t border-white/10 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <p className="text-white font-medium">{leadChanges}</p>
          <p className="text-white/40 text-[10px]">Lead Changes</p>
        </div>
        <div>
          <p className="text-white font-medium">
            {largestLead.team === 'home' ? homeTeam.abbreviation : awayTeam.abbreviation} +{largestLead.amount}
          </p>
          <p className="text-white/40 text-[10px]">Largest Lead</p>
        </div>
        <div>
          <p className="text-white font-medium">{scoringRuns.length}</p>
          <p className="text-white/40 text-[10px]">Scoring Runs</p>
        </div>
      </div>
    </div>
  );
}
