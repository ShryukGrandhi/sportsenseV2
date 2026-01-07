'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { LiveGameCard, type LiveGameData } from './LiveGameCard';
import { useLiveGameUpdates } from '@/hooks/useLiveGameUpdates';
import { useNotifications } from '@/components/notifications/NotificationProvider';

interface LiveScoreboardProps {
  initialGames: LiveGameData[];
  date?: string;
}

// Toast notification for score changes
function ScoreToast({ 
  game, 
  team, 
  points, 
  onClose 
}: { 
  game: LiveGameData; 
  team: 'home' | 'away'; 
  points: number;
  onClose: () => void;
}) {
  const teamData = team === 'home' ? game.homeTeam : game.awayTeam;
  const pointText = points === 1 ? 'Free Throw!' : points === 2 ? '2-Pointer!' : points === 3 ? '3-Pointer! 🔥' : `+${points}`;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      className="glass rounded-xl p-4 flex items-center gap-3 shadow-xl border border-green-500/30"
    >
      <span className="text-2xl">🏀</span>
      <div>
        <p className="font-bold text-green-400">{teamData.abbreviation} SCORES!</p>
        <p className="text-sm text-white/70">{pointText}</p>
      </div>
    </motion.div>
  );
}

export function LiveScoreboard({ initialGames, date }: LiveScoreboardProps) {
  const { addNotification } = useNotifications();
  const [scoreToasts, setScoreToasts] = useState<Array<{
    id: string;
    game: LiveGameData;
    team: 'home' | 'away';
    points: number;
  }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Handle score changes
  const handleScoreChange = useCallback((
    gameId: string, 
    team: 'home' | 'away', 
    points: number, 
    game: LiveGameData
  ) => {
    const toastId = `${gameId}-${team}-${Date.now()}`;
    const teamData = team === 'home' ? game.homeTeam : game.awayTeam;
    
    // Add toast notification
    setScoreToasts(prev => [...prev, { id: toastId, game, team, points }]);
    
    // Add to notification system
    addNotification({
      type: 'score',
      title: `${teamData.abbreviation} scores!`,
      message: `${game.awayTeam.abbreviation} ${game.awayTeam.score} - ${game.homeTeam.score} ${game.homeTeam.abbreviation}`,
      sport: 'NBA',
    });

    // Play sound if enabled
    if (soundEnabled) {
      try {
        const audio = new Audio('/sounds/score.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore autoplay errors
      } catch (e) {
        // Sound not available
      }
    }
  }, [addNotification, soundEnabled]);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setScoreToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Use the live updates hook
  const { 
    games, 
    isConnected, 
    lastUpdate, 
    error, 
    refresh,
    reconnect 
  } = useLiveGameUpdates(initialGames, {
    enabled: true,
    onScoreChange: handleScoreChange,
  });

  // Separate games by status
  const liveGames = games.filter(g => g.status === 'live' || g.status === 'halftime');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const completedGames = games.filter(g => g.status === 'final');

  // Format last update time
  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between glass rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-400">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Live Updates Active</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <button 
                onClick={reconnect}
                className="ml-2 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              <span className="text-sm">Connecting...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-xs text-white/40">
              Last update: {formatLastUpdate(lastUpdate)}
            </span>
          )}
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'
            }`}
            title={soundEnabled ? 'Mute score sounds' : 'Enable score sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
            title="Manual refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Games count & live indicator */}
      {games.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>{games.length} {games.length === 1 ? 'game' : 'games'} today</span>
          {liveGames.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {liveGames.length} LIVE
            </span>
          )}
        </div>
      )}

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Games Section */}
      {upcomingGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-400 mb-4">Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Games Section */}
      {completedGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white/60 mb-4">Final</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {games.length === 0 && (
        <div className="text-center py-16 space-y-6">
          <div className="text-6xl">🏀</div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">No games scheduled</h2>
            <p className="text-white/60 max-w-md mx-auto">
              Check out the calendar for upcoming matchups.
            </p>
          </div>
        </div>
      )}

      {/* Score Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {scoreToasts.slice(-3).map((toast) => (
            <ScoreToast
              key={toast.id}
              game={toast.game}
              team={toast.team}
              points={toast.points}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LiveScoreboard;

