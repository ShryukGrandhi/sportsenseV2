'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface RecentGame {
  opponent: string;
  result: string;
  score: string;
}

interface ChartDataPoint {
  game: string;
  scored: number;
  allowed: number;
  result: string;
}

export function TeamPerformanceChart({ games }: { games: RecentGame[] }) {
  if (!games || games.length === 0) return null;

  // Reverse so oldest game is first (left to right chronological)
  const chartData: ChartDataPoint[] = [...games].reverse().map((g) => {
    const [teamScore, oppScore] = g.score.split('-').map(Number);
    return {
      game: `vs ${g.opponent}`,
      scored: teamScore || 0,
      allowed: oppScore || 0,
      result: g.result,
    };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="scoredGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="allowedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="game"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,15,20,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const label = name === 'scored' ? 'Points Scored' : 'Points Allowed';
              const color = name === 'scored' ? '#22c55e' : '#ef4444';
              return [<span key={name} style={{ color }}>{value ?? 0}</span>, label];
            }}
          />
          <Area
            type="monotone"
            dataKey="scored"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#scoredGradient)"
            dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="allowed"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#allowedGradient)"
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-white/50">Points Scored</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-white/50">Points Allowed</span>
        </span>
      </div>
    </div>
  );
}
