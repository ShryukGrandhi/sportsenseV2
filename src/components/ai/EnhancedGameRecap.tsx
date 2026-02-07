'use client';

/**
 * EnhancedGameRecap.tsx
 * Enhanced game recap that combines top players with analytics charts
 * Provides a scrollable, visually polished view of game highlights
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight, Trophy, Target, BarChart3, TrendingUp,
  Flame, Shield, Zap, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateShootingPct, formatPercentage } from '@/lib/stat-utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

// Types
export interface TopPlayerData {
  name: string;
  headshot?: string;
  minutes: string;
  points: number;
  rebounds: number;
  assists: number;
  fg3m: number;
  fg3a: number;
  fgm?: number;
  fga?: number;
  plusMinus?: string;
}

export interface TeamTotals {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
}

export interface EnhancedGameRecapProps {
  gameId: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
    record?: string;
    topPlayers: TopPlayerData[];
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    score: number;
    logo?: string;
    record?: string;
    topPlayers: TopPlayerData[];
  };
  homeTotals: TeamTotals;
  awayTotals: TeamTotals;
  status: 'live' | 'halftime' | 'final' | 'scheduled';
  venue?: string;
  date?: string;
}

// Chart colors
const COLORS = {
  home: '#22C55E', // Green for home
  away: '#3B82F6', // Blue for away
  gradient: {
    home: 'from-green-500/20 to-green-600/10',
    away: 'from-blue-500/20 to-blue-600/10',
  }
};

// Player headshot component with fallback
function PlayerHeadshot({ src, name, size = 48 }: { src?: string; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const fallbackUrl = 'https://a.espncdn.com/i/headshots/nba/players/full/0.png';

  return (
    <div
      className="rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 flex-shrink-0 ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={imgError ? fallbackUrl : (src || fallbackUrl)}
        alt={name}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}

// Team logo component
function TeamLogo({ src, abbreviation, size = 32 }: { src?: string; abbreviation: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const url = src || `https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation.toLowerCase()}.png`;

  if (imgError) {
    return (
      <div
        className="rounded-lg flex items-center justify-center text-xs font-bold text-white bg-white/20"
        style={{ width: size, height: size }}
      >
        {abbreviation}
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={abbreviation}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setImgError(true)}
      unoptimized
    />
  );
}

// Player row in top performers section
function PlayerRow({ player, rank, isHome }: { player: TopPlayerData; rank: number; isHome: boolean }) {
  const fg3Pct = calculateShootingPct(player.fg3m, player.fg3a);
  const fg3PctDisplay = player.fg3a > 0 ? formatPercentage(fg3Pct) : '-';

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
      "bg-gradient-to-r hover:scale-[1.01]",
      isHome
        ? "from-green-500/5 to-transparent hover:from-green-500/10"
        : "from-blue-500/5 to-transparent hover:from-blue-500/10",
      "animate-fade-in"
    )} style={{ animationDelay: `${rank * 100}ms` }}>
      {/* Rank badge */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
        "ring-2 transition-all duration-300",
        rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 ring-yellow-400/50",
        rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 ring-slate-400/50",
        rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-600 text-slate-900 ring-orange-400/50"
      )}>
        {rank}
      </div>

      {/* Player headshot */}
      <PlayerHeadshot src={player.headshot} name={player.name} size={44} />

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{player.name}</p>
        <p className="text-xs text-white/40">{player.minutes} MIN</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs">
        <div className="text-center min-w-[36px]">
          <p className={cn(
            "font-bold text-base",
            isHome ? "text-green-400" : "text-blue-400"
          )}>{player.points}</p>
          <p className="text-white/30 uppercase text-[9px] tracking-wider">PTS</p>
        </div>

        <div className="text-center min-w-[30px]">
          <p className="font-medium text-white/80 text-sm">{player.rebounds}</p>
          <p className="text-white/30 uppercase text-[9px] tracking-wider">REB</p>
        </div>

        <div className="text-center min-w-[30px]">
          <p className="font-medium text-white/80 text-sm">{player.assists}</p>
          <p className="text-white/30 uppercase text-[9px] tracking-wider">AST</p>
        </div>

        <div className={cn(
          "text-center min-w-[52px] rounded-lg px-2 py-1",
          isHome ? "bg-green-500/10" : "bg-blue-500/10"
        )}>
          <p className={cn(
            "font-medium text-sm",
            isHome ? "text-green-400" : "text-blue-400"
          )}>
            {player.fg3m}-{player.fg3a}
          </p>
          <p className="text-white/40 text-[9px]">{fg3PctDisplay}</p>
        </div>
      </div>
    </div>
  );
}

// Team section header
function TeamHeader({
  team,
  isHome,
  isWinner
}: {
  team: EnhancedGameRecapProps['homeTeam'];
  isHome: boolean;
  isWinner: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
      isHome
        ? "bg-gradient-to-r from-green-500/15 to-green-500/5"
        : "bg-gradient-to-r from-blue-500/15 to-blue-500/5"
    )}>
      <TeamLogo src={team.logo} abbreviation={team.abbreviation} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white truncate">{team.name}</p>
          {isWinner && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
              WIN
            </span>
          )}
        </div>
        <p className="text-xs text-white/40">{isHome ? 'Home' : 'Away'} {team.record && `| ${team.record}`}</p>
      </div>
      <div className={cn(
        "text-3xl font-bold tabular-nums",
        isWinner
          ? "text-green-400"
          : isHome ? "text-green-400/70" : "text-blue-400/70"
      )}>
        {team.score}
      </div>
    </div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-xl">
      <p className="text-white font-medium mb-2 text-sm">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

// Stat comparison bar
function StatComparisonBar({
  label,
  homeValue,
  awayValue,
  icon: Icon,
  format = 'number'
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'percent';
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const homeWins = homeValue > awayValue;
  const awayWins = awayValue > homeValue;

  const displayValue = (val: number) =>
    format === 'percent' ? `${val.toFixed(1)}%` : val.toString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "font-bold tabular-nums",
          awayWins ? "text-blue-400" : "text-white/70"
        )}>
          {displayValue(awayValue)}
        </span>
        <div className="flex items-center gap-1.5 text-white/50">
          <Icon className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider text-[10px]">{label}</span>
        </div>
        <span className={cn(
          "font-bold tabular-nums",
          homeWins ? "text-green-400" : "text-white/70"
        )}>
          {displayValue(homeValue)}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
          style={{ width: `${100 - homePercent}%` }}
        />
        <div
          className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
      </div>
    </div>
  );
}

// Main component
export function EnhancedGameRecap({
  gameId,
  homeTeam,
  awayTeam,
  homeTotals,
  awayTotals,
  status,
  venue,
  date,
}: EnhancedGameRecapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isFinal = status === 'final';
  const homeWon = isFinal && homeTeam.score > awayTeam.score;
  const awayWon = isFinal && awayTeam.score > homeTeam.score;

  // Comparison data for bar chart
  const comparisonData = useMemo(() => [
    {
      stat: 'Points',
      [awayTeam.abbreviation]: awayTeam.score,
      [homeTeam.abbreviation]: homeTeam.score,
    },
    {
      stat: 'Rebounds',
      [awayTeam.abbreviation]: awayTotals.rebounds,
      [homeTeam.abbreviation]: homeTotals.rebounds,
    },
    {
      stat: 'Assists',
      [awayTeam.abbreviation]: awayTotals.assists,
      [homeTeam.abbreviation]: homeTotals.assists,
    },
    {
      stat: 'Steals',
      [awayTeam.abbreviation]: awayTotals.steals,
      [homeTeam.abbreviation]: homeTotals.steals,
    },
    {
      stat: 'Blocks',
      [awayTeam.abbreviation]: awayTotals.blocks,
      [homeTeam.abbreviation]: homeTotals.blocks,
    },
  ], [homeTeam, awayTeam, homeTotals, awayTotals]);

  // Efficiency data for radar chart
  const efficiencyData = useMemo(() => {
    const homeFGPct = homeTotals.fga > 0 ? (homeTotals.fgm / homeTotals.fga) * 100 : 0;
    const awayFGPct = awayTotals.fga > 0 ? (awayTotals.fgm / awayTotals.fga) * 100 : 0;
    const homeFG3Pct = homeTotals.fg3a > 0 ? (homeTotals.fg3m / homeTotals.fg3a) * 100 : 0;
    const awayFG3Pct = awayTotals.fg3a > 0 ? (awayTotals.fg3m / awayTotals.fg3a) * 100 : 0;
    const homeFTPct = homeTotals.fta > 0 ? (homeTotals.ftm / homeTotals.fta) * 100 : 0;
    const awayFTPct = awayTotals.fta > 0 ? (awayTotals.ftm / awayTotals.fta) * 100 : 0;

    return [
      { stat: 'FG%', home: homeFGPct, away: awayFGPct, fullMark: 100 },
      { stat: '3P%', home: homeFG3Pct, away: awayFG3Pct, fullMark: 100 },
      { stat: 'FT%', home: homeFTPct, away: awayFTPct, fullMark: 100 },
      { stat: 'REB', home: Math.min(homeTotals.rebounds, 60), away: Math.min(awayTotals.rebounds, 60), fullMark: 60 },
      { stat: 'AST', home: Math.min(homeTotals.assists, 40), away: Math.min(awayTotals.assists, 40), fullMark: 40 },
    ];
  }, [homeTotals, awayTotals]);

  // Shooting percentages
  const homeFGPct = homeTotals.fga > 0 ? (homeTotals.fgm / homeTotals.fga) * 100 : 0;
  const awayFGPct = awayTotals.fga > 0 ? (awayTotals.fgm / awayTotals.fga) * 100 : 0;
  const homeFG3Pct = homeTotals.fg3a > 0 ? (homeTotals.fg3m / homeTotals.fg3a) * 100 : 0;
  const awayFG3Pct = awayTotals.fg3a > 0 ? (awayTotals.fg3m / awayTotals.fg3a) * 100 : 0;
  const homeFTPct = homeTotals.fta > 0 ? (homeTotals.ftm / homeTotals.fta) * 100 : 0;
  const awayFTPct = awayTotals.fta > 0 ? (awayTotals.ftm / awayTotals.fta) * 100 : 0;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Main Card - Top Performers */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className={cn(
          "px-5 py-4 flex items-center justify-between border-b border-white/10",
          "bg-gradient-to-r from-slate-800/50 to-slate-900/50"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <Trophy className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Game Recap</h2>
              <p className="text-xs text-white/40">Top Performers & Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-3 py-1.5 rounded-full font-medium",
              status === 'final' && "bg-green-500/20 text-green-400",
              status === 'live' && "bg-red-500/20 text-red-400 animate-pulse",
              status === 'halftime' && "bg-yellow-500/20 text-yellow-400"
            )}>
              {status === 'final' ? 'FINAL' : status === 'live' ? 'LIVE' : status.toUpperCase()}
            </span>
            {(homeWon || awayWon) && (
              <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                <Target className="w-3 h-3" />
                {homeWon ? homeTeam.abbreviation : awayTeam.abbreviation} wins
              </div>
            )}
          </div>
        </div>

        {/* Teams and Top Players */}
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Away Team */}
            <div className="space-y-3">
              <TeamHeader team={awayTeam} isHome={false} isWinner={awayWon} />
              <div className="space-y-2">
                {awayTeam.topPlayers.slice(0, 3).map((player, idx) => (
                  <PlayerRow key={player.name} player={player} rank={idx + 1} isHome={false} />
                ))}
              </div>
            </div>

            {/* Home Team */}
            <div className="space-y-3">
              <TeamHeader team={homeTeam} isHome={true} isWinner={homeWon} />
              <div className="space-y-2">
                {homeTeam.topPlayers.slice(0, 3).map((player, idx) => (
                  <PlayerRow key={player.name} player={player} rank={idx + 1} isHome={true} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Game Analytics</h3>
            <p className="text-xs text-white/40">Team comparison breakdown</p>
          </div>
        </div>

        <div className="p-5 space-y-8">
          {/* Quick Stats Comparison */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Key Stats
            </h4>
            <div className="grid gap-4">
              <StatComparisonBar
                label="Points"
                homeValue={homeTeam.score}
                awayValue={awayTeam.score}
                icon={Flame}
              />
              <StatComparisonBar
                label="Rebounds"
                homeValue={homeTotals.rebounds}
                awayValue={awayTotals.rebounds}
                icon={Shield}
              />
              <StatComparisonBar
                label="Assists"
                homeValue={homeTotals.assists}
                awayValue={awayTotals.assists}
                icon={Target}
              />
              <StatComparisonBar
                label="Steals"
                homeValue={homeTotals.steals}
                awayValue={awayTotals.steals}
                icon={Zap}
              />
            </div>
          </div>

          {/* Shooting Stats Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Shooting Efficiency
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {/* FG% */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">FG%</p>
                <div className="flex justify-around">
                  <div>
                    <p className={cn("text-xl font-bold", awayFGPct > homeFGPct ? "text-blue-400" : "text-white/60")}>
                      {awayFGPct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold", homeFGPct > awayFGPct ? "text-green-400" : "text-white/60")}>
                      {homeFGPct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                  </div>
                </div>
              </div>

              {/* 3P% */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">3P%</p>
                <div className="flex justify-around">
                  <div>
                    <p className={cn("text-xl font-bold", awayFG3Pct > homeFG3Pct ? "text-blue-400" : "text-white/60")}>
                      {awayFG3Pct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold", homeFG3Pct > awayFG3Pct ? "text-green-400" : "text-white/60")}>
                      {homeFG3Pct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                  </div>
                </div>
              </div>

              {/* FT% */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">FT%</p>
                <div className="flex justify-around">
                  <div>
                    <p className={cn("text-xl font-bold", awayFTPct > homeFTPct ? "text-blue-400" : "text-white/60")}>
                      {awayFTPct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold", homeFTPct > awayFTPct ? "text-green-400" : "text-white/60")}>
                      {homeFTPct.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts - only render on client */}
          {isClient && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Comparison Bar Chart */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Team Comparison
                </h4>
                <div className="bg-slate-800/30 rounded-xl p-4" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis
                        dataKey="stat"
                        type="category"
                        stroke="#6B7280"
                        width={70}
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        dataKey={awayTeam.abbreviation}
                        fill={COLORS.away}
                        radius={[0, 4, 4, 0]}
                        name={awayTeam.abbreviation}
                      />
                      <Bar
                        dataKey={homeTeam.abbreviation}
                        fill={COLORS.home}
                        radius={[0, 4, 4, 0]}
                        name={homeTeam.abbreviation}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Efficiency Radar Chart */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Team Efficiency
                </h4>
                <div className="bg-slate-800/30 rounded-xl p-4" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={efficiencyData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="stat" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar
                        name={awayTeam.abbreviation}
                        dataKey="away"
                        stroke={COLORS.away}
                        fill={COLORS.away}
                        fillOpacity={0.3}
                      />
                      <Radar
                        name={homeTeam.abbreviation}
                        dataKey="home"
                        stroke={COLORS.home}
                        fill={COLORS.home}
                        fillOpacity={0.3}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Turnovers</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className={cn("text-xl font-bold", awayTotals.turnovers < homeTotals.turnovers ? "text-blue-400" : "text-white/60")}>
                    {awayTotals.turnovers}
                  </p>
                  <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xl font-bold", homeTotals.turnovers < awayTotals.turnovers ? "text-green-400" : "text-white/60")}>
                    {homeTotals.turnovers}
                  </p>
                  <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Blocks</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className={cn("text-xl font-bold", awayTotals.blocks > homeTotals.blocks ? "text-blue-400" : "text-white/60")}>
                    {awayTotals.blocks}
                  </p>
                  <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xl font-bold", homeTotals.blocks > awayTotals.blocks ? "text-green-400" : "text-white/60")}>
                    {homeTotals.blocks}
                  </p>
                  <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">FG Made</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xl font-bold text-white/70">
                    {awayTotals.fgm}/{awayTotals.fga}
                  </p>
                  <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white/70">
                    {homeTotals.fgm}/{homeTotals.fga}
                  </p>
                  <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">3PT Made</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xl font-bold text-white/70">
                    {awayTotals.fg3m}/{awayTotals.fg3a}
                  </p>
                  <p className="text-[10px] text-white/30">{awayTeam.abbreviation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white/70">
                    {homeTotals.fg3m}/{homeTotals.fg3a}
                  </p>
                  <p className="text-[10px] text-white/30">{homeTeam.abbreviation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href={`/nba/games/${gameId}`}
        className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 hover:from-orange-500/30 hover:via-purple-500/30 hover:to-blue-500/30 border border-white/10 hover:border-white/20 text-white font-semibold transition-all duration-300 hover:scale-[1.02]"
      >
        <span>View Full Game Details</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default EnhancedGameRecap;
