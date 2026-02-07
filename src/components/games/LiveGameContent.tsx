'use client';

// Live Game Content - Client component that handles real-time updates
// for all game data including analytics, player stats, and play-by-play

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, TrendingUp, History, ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { GameAnalytics } from '@/components/games/GameAnalytics';
import { EnhancedPlayerStats } from '@/components/games/EnhancedPlayerStats';
import { PlayByPlayFeed } from '@/components/games/PlayByPlayFeed';
import type { ESPNGameDetail, ESPNPreviousGame } from '@/services/nba/espn-api';

interface TeamTotals {
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

interface LiveGameContentProps {
  initialGame: ESPNGameDetail;
  initialHomeTotals: TeamTotals;
  initialAwayTotals: TeamTotals;
  homePreviousGames: ESPNPreviousGame[];
  awayPreviousGames: ESPNPreviousGame[];
}

export function LiveGameContent({
  initialGame,
  initialHomeTotals,
  initialAwayTotals,
  homePreviousGames,
  awayPreviousGames,
}: LiveGameContentProps) {
  const [game, setGame] = useState(initialGame);
  const [homeTotals, setHomeTotals] = useState(initialHomeTotals);
  const [awayTotals, setAwayTotals] = useState(initialAwayTotals);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isLive = game.status === 'live' || game.status === 'halftime';

  // Helper to calculate totals from player stats
  const calculateTotalsFromPlayers = useCallback((players: typeof game.homeStats) => {
    const defaultTotals: TeamTotals = {
      points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
      fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
    };
    
    if (!players || players.length === 0) return defaultTotals;
    
    return players.reduce((acc, p) => ({
      points: acc.points + (p.points || 0),
      rebounds: acc.rebounds + (p.rebounds || 0),
      assists: acc.assists + (p.assists || 0),
      steals: acc.steals + (p.steals || 0),
      blocks: acc.blocks + (p.blocks || 0),
      turnovers: acc.turnovers + (p.turnovers || 0),
      fgm: acc.fgm + (p.fgm || 0),
      fga: acc.fga + (p.fga || 0),
      fg3m: acc.fg3m + (p.fg3m || 0),
      fg3a: acc.fg3a + (p.fg3a || 0),
      ftm: acc.ftm + (p.ftm || 0),
      fta: acc.fta + (p.fta || 0),
    }), defaultTotals);
  }, []);

  // Fetch updated game data
  const fetchGameData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/games/${game.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game data');
      }

      const data = await response.json();
      
      // Update game state
      setGame(prev => ({
        ...prev,
        homeScore: data.homeScore ?? prev.homeScore,
        awayScore: data.awayScore ?? prev.awayScore,
        status: data.status ?? prev.status,
        period: data.period ?? prev.period,
        clock: data.clock ?? prev.clock,
        homeStats: data.homeStats?.length > 0 ? data.homeStats : prev.homeStats,
        awayStats: data.awayStats?.length > 0 ? data.awayStats : prev.awayStats,
        plays: data.plays?.length > 0 ? data.plays : prev.plays,
        leaders: data.leaders ?? prev.leaders,
      }));
      
      // Update totals - prefer API totals, fallback to calculating from players, keep existing if both fail
      const newHomeStats = data.homeStats?.length > 0 ? data.homeStats : game.homeStats;
      const newAwayStats = data.awayStats?.length > 0 ? data.awayStats : game.awayStats;
      
      // Check if API returned valid totals
      const apiHomeTotals = data.homeTotals;
      const apiAwayTotals = data.awayTotals;
      
      const hasValidHomeTotals = apiHomeTotals && (apiHomeTotals.rebounds > 0 || apiHomeTotals.assists > 0 || apiHomeTotals.points > 0);
      const hasValidAwayTotals = apiAwayTotals && (apiAwayTotals.rebounds > 0 || apiAwayTotals.assists > 0 || apiAwayTotals.points > 0);
      
      // Calculate from player stats as fallback
      const calculatedHomeTotals = calculateTotalsFromPlayers(newHomeStats);
      const calculatedAwayTotals = calculateTotalsFromPlayers(newAwayStats);
      
      // Use API totals if valid, else calculated, else keep existing
      if (hasValidHomeTotals) {
        setHomeTotals(apiHomeTotals);
      } else if (calculatedHomeTotals.points > 0 || calculatedHomeTotals.rebounds > 0) {
        setHomeTotals(calculatedHomeTotals);
      }
      // Otherwise keep existing homeTotals
      
      if (hasValidAwayTotals) {
        setAwayTotals(apiAwayTotals);
      } else if (calculatedAwayTotals.points > 0 || calculatedAwayTotals.rebounds > 0) {
        setAwayTotals(calculatedAwayTotals);
      }
      // Otherwise keep existing awayTotals
      
      setLastUpdate(new Date());
      setError(null);
      
      console.log('[LiveGameContent] Updated game data', {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        homeStatsCount: data.homeStats?.length || 0,
        awayStatsCount: data.awayStats?.length || 0,
        homeTotals: hasValidHomeTotals ? 'from API' : calculatedHomeTotals.points > 0 ? 'calculated' : 'kept existing',
        awayTotals: hasValidAwayTotals ? 'from API' : calculatedAwayTotals.points > 0 ? 'calculated' : 'kept existing',
      });
    } catch (err) {
      console.error('[LiveGameContent] Error fetching game data:', err);
      setError('Failed to update');
    } finally {
      setIsRefreshing(false);
    }
  }, [game.id, game.homeStats, game.awayStats, calculateTotalsFromPlayers]);

  // Connect to SSE for live games - listen for score changes then fetch full data
  useEffect(() => {
    if (!isLive) return;

    const connectSSE = () => {
      const eventSource = new EventSource('/api/live/nba/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('[LiveGameContent] SSE connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'update' && data.games) {
            // Check if our game has an update
            const gameUpdate = data.games.find((g: any) => g.gameId === game.id);
            
            if (gameUpdate) {
              // Update basic score info immediately from SSE
              setGame(prev => ({
                ...prev,
                homeScore: gameUpdate.homeTeam.score,
                awayScore: gameUpdate.awayTeam.score,
                status: gameUpdate.status,
                period: gameUpdate.period,
                clock: gameUpdate.clock,
              }));

              // If score changed, fetch full game data for updated stats
              if (gameUpdate._changes?.scoreChanged) {
                fetchGameData();
              }
            }
          }
        } catch (err) {
          console.error('[LiveGameContent] Error parsing SSE:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    // Also poll every 30 seconds as backup for live games
    intervalRef.current = setInterval(fetchGameData, 30000);

    return () => {
      eventSourceRef.current?.close();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [game.id, isLive, fetchGameData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchGameData();
  };

  return (
    <div className="space-y-6">
      {/* Live Update Status Bar (only show for live games) */}
      {isLive && (
        <div className="flex items-center justify-between glass rounded-lg px-4 py-2 mb-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Real-Time Updates Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Reconnecting...</span>
              </div>
            )}
            {error && (
              <span className="text-xs text-red-400">{error}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors disabled:opacity-50"
              title="Manual refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Game Leaders */}
      {(game.leaders.home.points || game.leaders.away.points) && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm text-white/50 text-center mb-4">GAME LEADERS</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {game.leaders.away.points && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Points</p>
                <p className="text-sm font-medium text-white">{game.leaders.away.points}</p>
              </div>
            )}
            {game.leaders.away.rebounds && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Rebounds</p>
                <p className="text-sm font-medium text-white">{game.leaders.away.rebounds}</p>
              </div>
            )}
            {game.leaders.away.assists && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Assists</p>
                <p className="text-sm font-medium text-white">{game.leaders.away.assists}</p>
              </div>
            )}
            {game.leaders.home.points && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Points</p>
                <p className="text-sm font-medium text-white">{game.leaders.home.points}</p>
              </div>
            )}
            {game.leaders.home.rebounds && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Rebounds</p>
                <p className="text-sm font-medium text-white">{game.leaders.home.rebounds}</p>
              </div>
            )}
            {game.leaders.home.assists && (
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40">Assists</p>
                <p className="text-sm font-medium text-white">{game.leaders.home.assists}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Game Analytics</h2>
          {isLive && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
              LIVE DATA
            </span>
          )}
        </div>
        
        <GameAnalytics 
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          homeTotals={homeTotals}
          awayTotals={awayTotals}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
          plays={game.plays}
          status={game.status}
        />
      </div>

      {/* Enhanced Player Stats - Away Team */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{game.awayTeam.displayName}</h2>
          <motion.span 
            key={game.awayScore}
            initial={{ scale: 1.2, color: '#22c55e' }}
            animate={{ scale: 1, color: 'rgba(255,255,255,0.6)' }}
            className="px-2 py-1 text-sm bg-white/10 rounded-lg"
          >
            {game.awayScore} PTS
          </motion.span>
        </div>
        
        <EnhancedPlayerStats 
          players={game.awayStats} 
          teamColor={game.awayTeam.color || '333'}
          teamName={game.awayTeam.displayName}
          teamLogo={game.awayTeam.logo}
        />
      </div>

      {/* Enhanced Player Stats - Home Team */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{game.homeTeam.displayName}</h2>
          <motion.span 
            key={game.homeScore}
            initial={{ scale: 1.2, color: '#22c55e' }}
            animate={{ scale: 1, color: 'rgba(255,255,255,0.6)' }}
            className="px-2 py-1 text-sm bg-white/10 rounded-lg"
          >
            {game.homeScore} PTS
          </motion.span>
        </div>
        
        <EnhancedPlayerStats 
          players={game.homeStats}
          teamColor={game.homeTeam.color || '333'}
          teamName={game.homeTeam.displayName}
          teamLogo={game.homeTeam.logo}
        />
      </div>

      {/* Play by Play */}
      {game.plays.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Play-by-Play</h2>
            <span className="text-xs text-white/40">{game.plays.length} plays</span>
          </div>
          
          <PlayByPlayFeed 
            plays={game.plays}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
          />
        </div>
      )}

      {/* Previous Games Section */}
      {(homePreviousGames.length > 0 || awayPreviousGames.length > 0) && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Recent Games</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Away Team Previous Games */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={game.awayTeam.logo}
                  alt={game.awayTeam.abbreviation}
                  width={28}
                  height={28}
                  className="object-contain"
                  unoptimized
                />
                <h3 className="font-semibold text-white">{game.awayTeam.displayName}</h3>
                <span className="text-xs text-white/40">Last 5</span>
              </div>
              <div className="space-y-2">
                {awayPreviousGames.length > 0 ? (
                  awayPreviousGames.map((pg) => {
                    const isTeamHome = pg.homeTeam.abbreviation === game.awayTeam.abbreviation;
                    const teamWon = isTeamHome ? pg.homeTeam.winner : pg.awayTeam.winner;
                    const opponent = isTeamHome ? pg.awayTeam : pg.homeTeam;
                    const teamScore = isTeamHome ? pg.homeTeam.score : pg.awayTeam.score;
                    const oppScore = isTeamHome ? pg.awayTeam.score : pg.homeTeam.score;
                    
                    return (
                      <Link
                        key={pg.id}
                        href={`/nba/games/${pg.id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            teamWon 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {teamWon ? 'W' : 'L'}
                          </span>
                          <Image
                            src={opponent.logo}
                            alt={opponent.abbreviation}
                            width={24}
                            height={24}
                            className="object-contain"
                            unoptimized
                          />
                          <span className="text-sm text-white/70">
                            {isTeamHome ? 'vs' : '@'} {opponent.abbreviation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {teamScore}-{oppScore}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/40 py-4 text-center">No recent games</p>
                )}
              </div>
            </div>

            {/* Home Team Previous Games */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={game.homeTeam.logo}
                  alt={game.homeTeam.abbreviation}
                  width={28}
                  height={28}
                  className="object-contain"
                  unoptimized
                />
                <h3 className="font-semibold text-white">{game.homeTeam.displayName}</h3>
                <span className="text-xs text-white/40">Last 5</span>
              </div>
              <div className="space-y-2">
                {homePreviousGames.length > 0 ? (
                  homePreviousGames.map((pg) => {
                    const isTeamHome = pg.homeTeam.abbreviation === game.homeTeam.abbreviation;
                    const teamWon = isTeamHome ? pg.homeTeam.winner : pg.awayTeam.winner;
                    const opponent = isTeamHome ? pg.awayTeam : pg.homeTeam;
                    const teamScore = isTeamHome ? pg.homeTeam.score : pg.awayTeam.score;
                    const oppScore = isTeamHome ? pg.awayTeam.score : pg.homeTeam.score;
                    
                    return (
                      <Link
                        key={pg.id}
                        href={`/nba/games/${pg.id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            teamWon 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {teamWon ? 'W' : 'L'}
                          </span>
                          <Image
                            src={opponent.logo}
                            alt={opponent.abbreviation}
                            width={24}
                            height={24}
                            className="object-contain"
                            unoptimized
                          />
                          <span className="text-sm text-white/70">
                            {isTeamHome ? 'vs' : '@'} {opponent.abbreviation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {teamScore}-{oppScore}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/40 py-4 text-center">No recent games</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveGameContent;

