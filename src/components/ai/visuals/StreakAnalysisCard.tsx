'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Flame, Snowflake, TrendingUp, Home, Plane } from 'lucide-react';
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
import type { StreakAnalysisVisual } from '@/types/chat-visuals';

export function StreakAnalysisCard({ data }: { data: StreakAnalysisVisual }) {
  const { subject, currentStreak, recentGames, record, trend } = data;

  const chartData = recentGames.map((g, i) => ({
    game: i + 1,
    opponent: g.opponent,
    points: g.points ?? 0,
    result: g.result,
    score: g.score,
  })).reverse(); // oldest first for chart

  const avgPoints = chartData.length > 0
    ? chartData.reduce((s, g) => s + g.points, 0) / chartData.length
    : 0;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between border-b border-white/10",
        trend === 'hot' && "bg-red-500/10",
        trend === 'cold' && "bg-blue-500/10",
        trend === 'neutral' && "bg-white/5"
      )}>
        <div className="flex items-center gap-3">
          {subject.type === 'player' && subject.headshot ? (
            <Image src={subject.headshot} alt={subject.name} width={32} height={32} className="rounded-full" unoptimized />
          ) : subject.logo ? (
            <Image src={subject.logo} alt={subject.name} width={32} height={32} className="object-contain" unoptimized />
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
            <p className="text-xs text-white/50">Streak Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trend === 'hot' ? <Flame className="w-4 h-4 text-red-400" /> :
           trend === 'cold' ? <Snowflake className="w-4 h-4 text-blue-400" /> :
           <TrendingUp className="w-4 h-4 text-white/50" />}
          <span className={cn(
            "text-sm font-bold",
            currentStreak.type === 'W' ? "text-green-400" : "text-red-400"
          )}>
            {currentStreak.type}{currentStreak.count}
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && chartData[0].points > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs text-white/40 mb-2">Points (Last {chartData.length} Games)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="game"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                domain={['dataMin - 5', 'dataMax + 5']}
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
                  `${value} PTS`,
                  ''
                ]) as never}
              />
              <ReferenceLine y={avgPoints} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: `Avg: ${avgPoints.toFixed(1)}`, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#F97316"
                strokeWidth={2}
                dot={(props: Record<string, unknown>) => {
                  const cx = props.cx as number;
                  const cy = props.cy as number;
                  const payload = props.payload as { result: string };
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={payload.result === 'W' ? '#22C55E' : '#EF4444'}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Games List */}
      <div className="px-4 py-3">
        <p className="text-xs text-white/40 mb-2">Recent Games</p>
        <div className="space-y-1.5">
          {recentGames.slice(0, 5).map((game, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={cn(
                "w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]",
                game.result === 'W' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {game.result}
              </span>
              <Image src={game.opponentLogo} alt={game.opponent} width={16} height={16} className="object-contain" unoptimized />
              <span className="text-white/70 flex-1">{game.opponent}</span>
              {game.isHome ? <Home className="w-3 h-3 text-white/30" /> : <Plane className="w-3 h-3 text-white/30" />}
              <span className="text-white/60 tabular-nums">{game.score}</span>
              {game.points !== undefined && <span className="text-white font-medium tabular-nums w-8 text-right">{game.points}</span>}
              <span className="text-white/30">{game.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-white/50">Record: <span className="text-white font-medium">{record.wins}-{record.losses}</span></span>
        <span className="text-white/50">Last 10: <span className="text-white font-medium">{record.last10}</span></span>
      </div>
    </div>
  );
}
