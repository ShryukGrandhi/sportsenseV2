'use client';

interface PlayerStats {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
}

interface PlayerVisualsProps {
  stats: PlayerStats;
  playerName: string;
  className?: string;
}

// League averages for comparison (approximate 2025-26 values)
const LEAGUE_AVERAGES = {
  pointsPerGame: 11.5,
  reboundsPerGame: 4.0,
  assistsPerGame: 2.5,
  stealsPerGame: 0.7,
  blocksPerGame: 0.4,
  fgPct: 46.0,
  fg3Pct: 36.0,
  ftPct: 78.0,
};

export function PlayerVisuals({ stats, playerName, className = '' }: PlayerVisualsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stat Comparison Bars */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Stats vs League Average</h4>
        <div className="space-y-4">
          <StatComparisonBar
            label="Points"
            value={stats.pointsPerGame}
            average={LEAGUE_AVERAGES.pointsPerGame}
            max={35}
            unit="PPG"
          />
          <StatComparisonBar
            label="Rebounds"
            value={stats.reboundsPerGame}
            average={LEAGUE_AVERAGES.reboundsPerGame}
            max={15}
            unit="RPG"
          />
          <StatComparisonBar
            label="Assists"
            value={stats.assistsPerGame}
            average={LEAGUE_AVERAGES.assistsPerGame}
            max={12}
            unit="APG"
          />
          <StatComparisonBar
            label="Steals"
            value={stats.stealsPerGame}
            average={LEAGUE_AVERAGES.stealsPerGame}
            max={2.5}
            unit="SPG"
          />
          <StatComparisonBar
            label="Blocks"
            value={stats.blocksPerGame}
            average={LEAGUE_AVERAGES.blocksPerGame}
            max={3}
            unit="BPG"
          />
        </div>
      </div>

      {/* Shooting Splits */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Shooting Efficiency</h4>
        <div className="grid grid-cols-3 gap-4">
          <ShootingCircle
            label="FG%"
            value={stats.fgPct}
            average={LEAGUE_AVERAGES.fgPct}
            color="#3B82F6"
          />
          <ShootingCircle
            label="3P%"
            value={stats.fg3Pct}
            average={LEAGUE_AVERAGES.fg3Pct}
            color="#10B981"
          />
          <ShootingCircle
            label="FT%"
            value={stats.ftPct}
            average={LEAGUE_AVERAGES.ftPct}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* Skill Radar Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Player Profile</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SkillBadge
            skill="Scorer"
            level={getSkillLevel(stats.pointsPerGame, 25)}
            icon="🔥"
          />
          <SkillBadge
            skill="Playmaker"
            level={getSkillLevel(stats.assistsPerGame, 8)}
            icon="🎯"
          />
          <SkillBadge
            skill="Rebounder"
            level={getSkillLevel(stats.reboundsPerGame, 10)}
            icon="💪"
          />
          <SkillBadge
            skill="Defender"
            level={getSkillLevel(stats.stealsPerGame + stats.blocksPerGame, 3)}
            icon="🛡️"
          />
          <SkillBadge
            skill="Shooter"
            level={getSkillLevel(stats.fg3Pct, 42)}
            icon="🎯"
          />
          <SkillBadge
            skill="Efficiency"
            level={getSkillLevel(stats.fgPct, 55)}
            icon="📈"
          />
        </div>
      </div>
    </div>
  );
}

function getSkillLevel(value: number, eliteThreshold: number): 'elite' | 'above-avg' | 'avg' | 'below-avg' {
  const ratio = value / eliteThreshold;
  if (ratio >= 0.85) return 'elite';
  if (ratio >= 0.6) return 'above-avg';
  if (ratio >= 0.35) return 'avg';
  return 'below-avg';
}

interface StatComparisonBarProps {
  label: string;
  value: number;
  average: number;
  max: number;
  unit: string;
}

function StatComparisonBar({ label, value, average, max, unit }: StatComparisonBarProps) {
  const valuePercent = Math.min((value / max) * 100, 100);
  const avgPercent = Math.min((average / max) * 100, 100);
  const isAboveAverage = value >= average;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-medium text-white">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
        {/* Player value bar */}
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${
            isAboveAverage ? 'bg-blue-500' : 'bg-orange-500'
          }`}
          style={{ width: `${valuePercent}%` }}
        />
        {/* League average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
          style={{ left: `${avgPercent}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        League avg: {average.toFixed(1)}
      </div>
    </div>
  );
}

interface ShootingCircleProps {
  label: string;
  value: number;
  average: number;
  color: string;
}

function ShootingCircle({ label, value, average, color }: ShootingCircleProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const isAboveAverage = value >= average;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm text-gray-400">{label}</span>
      <span className={`text-xs ${isAboveAverage ? 'text-green-400' : 'text-orange-400'}`}>
        {isAboveAverage ? '↑' : '↓'} Avg: {average.toFixed(1)}%
      </span>
    </div>
  );
}

interface SkillBadgeProps {
  skill: string;
  level: 'elite' | 'above-avg' | 'avg' | 'below-avg';
  icon: string;
}

function SkillBadge({ skill, level, icon }: SkillBadgeProps) {
  const levelStyles = {
    'elite': 'bg-purple-500/20 border-purple-500 text-purple-400',
    'above-avg': 'bg-blue-500/20 border-blue-500 text-blue-400',
    'avg': 'bg-gray-500/20 border-gray-500 text-gray-400',
    'below-avg': 'bg-orange-500/20 border-orange-500 text-orange-400',
  };

  const levelLabels = {
    'elite': 'Elite',
    'above-avg': 'Above Avg',
    'avg': 'Average',
    'below-avg': 'Below Avg',
  };

  return (
    <div className={`p-3 rounded-lg border ${levelStyles[level]} text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-medium">{skill}</div>
      <div className="text-xs opacity-75">{levelLabels[level]}</div>
    </div>
  );
}
