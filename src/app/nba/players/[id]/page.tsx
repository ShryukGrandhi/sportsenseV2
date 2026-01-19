'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayerStatsDisplay, GameLogTable } from '@/components/players/PlayerStatsDisplay';
import { PlayerVisuals } from '@/components/players/PlayerVisuals';
import { PlayerSearchBar } from '@/components/players/PlayerSearchBar';
import { PlayerAIInsight } from '@/components/players/PlayerAIInsight';

interface PlayerDetail {
  id: string;
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  position: string;
  jersey: string;
  height: string;
  weight: string;
  birthDate: string;
  birthPlace: string;
  college: string;
  draft: string;
  experience: number;
  headshot: string;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    color: string;
  };
}

interface PlayerStats {
  gamesPlayed: number;
  gamesStarted: number;
  minutesPerGame: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  plusMinus: number;
}

interface GameLog {
  gameId: string;
  date: string;
  opponent: string;
  isHome: boolean;
  result: 'W' | 'L';
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PlayerDetailPage({ params }: PageProps) {
  const { id: playerId } = use(params);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'games' | 'visuals' | 'ai'>('stats');

  useEffect(() => {
    async function loadPlayer() {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/players/${playerId}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error?.message || 'Failed to load player');
          return;
        }
        
        setPlayer(data.data.player);
        setStats(data.data.stats);
        setGameLogs(data.data.gameLogs || []);
      } catch (err) {
        setError('Failed to load player data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPlayer();
  }, [playerId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-800 rounded-xl" />
            <div className="h-64 bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              {error || 'Player not found'}
            </h2>
            <Link href="/nba/players" className="text-blue-400 hover:underline">
              ← Back to Player Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with team color */}
      <div
        className="relative py-8"
        style={{
          background: player.team?.color
            ? `linear-gradient(135deg, #${player.team.color}40 0%, #111827 100%)`
            : 'linear-gradient(135deg, #1e3a5f 0%, #111827 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb and search */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/nba/players"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Search
            </Link>
            <div className="w-64">
              <PlayerSearchBar />
            </div>
          </div>

          {/* Player Header */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Headshot */}
            <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
              <Image
                src={player.headshot}
                alt={player.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {player.team?.logo && (
                  <div className="relative w-10 h-10">
                    <Image
                      src={player.team.logo}
                      alt={player.team.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-gray-400 text-lg">
                  {player.team?.name || 'Free Agent'}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-2">
                {player.name}
                {player.jersey && (
                  <span className="text-2xl text-gray-400 ml-3">#{player.jersey}</span>
                )}
              </h1>

              <div className="flex flex-wrap gap-4 text-gray-400">
                {player.position && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {player.position}
                  </span>
                )}
                {player.height && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {player.height}
                  </span>
                )}
                {player.weight && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {player.weight}
                  </span>
                )}
                {player.experience > 0 && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {player.experience} yr{player.experience !== 1 ? 's' : ''} exp
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              {stats && (
                <div className="flex gap-8 mt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.pointsPerGame.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">PPG</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.reboundsPerGame.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">RPG</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.assistsPerGame.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">APG</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.fgPct.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 uppercase">FG%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
            {player.birthDate && (
              <div>
                <span className="text-gray-500">Born:</span>{' '}
                <span className="text-gray-300">
                  {new Date(player.birthDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {player.birthPlace && (
              <div>
                <span className="text-gray-500">From:</span>{' '}
                <span className="text-gray-300">{player.birthPlace}</span>
              </div>
            )}
            {player.college && (
              <div>
                <span className="text-gray-500">College:</span>{' '}
                <span className="text-gray-300">{player.college}</span>
              </div>
            )}
            {player.draft && (
              <div>
                <span className="text-gray-500">Draft:</span>{' '}
                <span className="text-gray-300">{player.draft}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {(['stats', 'games', 'visuals', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab === 'stats' && 'Season Stats'}
                {tab === 'games' && 'Game Log'}
                {tab === 'visuals' && 'Visualizations'}
                {tab === 'ai' && '🤖 AI Insight'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'stats' && stats && (
          <PlayerStatsDisplay stats={stats} />
        )}
        
        {activeTab === 'stats' && !stats && (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
            No stats available for this season
          </div>
        )}

        {activeTab === 'games' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Games</h3>
            <GameLogTable gameLogs={gameLogs} />
          </div>
        )}

        {activeTab === 'visuals' && stats && (
          <PlayerVisuals stats={stats} playerName={player.name} />
        )}
        
        {activeTab === 'visuals' && !stats && (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
            No stats available for visualizations
          </div>
        )}

        {activeTab === 'ai' && (
          <PlayerAIInsight
            playerName={player.name}
            playerId={playerId}
            stats={stats ? {
              pointsPerGame: stats.pointsPerGame,
              reboundsPerGame: stats.reboundsPerGame,
              assistsPerGame: stats.assistsPerGame,
              fgPct: stats.fgPct,
              fg3Pct: stats.fg3Pct,
            } : undefined}
            team={player.team ? {
              name: player.team.name,
              abbreviation: player.team.abbreviation,
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}
