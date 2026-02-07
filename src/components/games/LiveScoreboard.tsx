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
  const pointText = points === 1 ? 'Free Throw!' : points === 2 ? '2-Pointer!' : points === 3 ? '3-Pointer!' : `+${points}`;

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
      role="status"
      aria-live="assertive"
    >
      <span className="text-2xl" aria-hidden="true">🏀</span>
      <div>
        <p className="font-bold text-green-400">{teamData.abbreviation} SCORES!</p>
        <p className="text-sm text-[var(--text-secondary)]">{pointText}</p>
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

  const handleScoreChange = useCallback((
    gameId: string,
    team: 'home' | 'away',
    points: number,
    game: LiveGameData
  ) => {
    const toastId = `${gameId}-${team}-${Date.now()}`;
    const teamData = team === 'home' ? game.homeTeam : game.awayTeam;

    setScoreToasts(prev => [...prev, { id: toastId, game, team, points }]);

    addNotification({
      type: 'score',
      title: `${teamData.abbreviation} scores!`,
      message: `${game.awayTeam.abbreviation} ${game.awayTeam.score} - ${game.homeTeam.score} ${game.homeTeam.abbreviation}`,
      sport: 'NBA',
    });

    if (soundEnabled) {
      try {
        const audio = new Audio('/sounds/score.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Sound not available
      }
    }
  }, [addNotification, soundEnabled]);

  const removeToast = useCallback((id: string) => {
    setScoreToasts(prev => prev.filter(t => t.id !== id));
  }, []);

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

  const liveGames = games.filter(g => g.status === 'live' || g.status === 'halftime');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const completedGames = games.filter(g => g.status === 'final');

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
      <div className="flex items-center justify-between glass rounded-lg px-4 py-2" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-400">
              <Wifi className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">Live Updates Active</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">{error}</span>
              <button
                onClick={reconnect}
                className="ml-2 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded transition-colors min-h-[32px]"
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
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </motion.div>
              <span className="text-sm">Connecting to live data...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-xs text-[var(--text-muted)]">
              Last update: <time>{formatLastUpdate(lastUpdate)}</time>
            </span>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-[var(--text-muted)]'
            }`}
            aria-label={soundEnabled ? 'Mute score sounds' : 'Enable score sounds'}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
          </button>

          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Refresh scores"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Games count */}
      {games.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <span>{games.length} {games.length === 1 ? 'game' : 'games'} today</span>
          {liveGames.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 font-medium">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {liveGames.length} LIVE
            </span>
          )}
        </div>
      )}

      {/* Live Games */}
      {liveGames.length > 0 && (
        <section className="mb-8" aria-labelledby="live-games-heading">
          <h3 id="live-games-heading" className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite" aria-atomic="false">
            {liveGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <section className="mb-8" aria-labelledby="upcoming-games-heading">
          <h3 id="upcoming-games-heading" className="text-lg font-semibold text-blue-400 mb-4">Upcoming</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <section className="mb-8" aria-labelledby="completed-games-heading">
          <h3 id="completed-games-heading" className="text-lg font-semibold text-[var(--text-secondary)] mb-4">Final</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.map((game) => (
              <LiveGameCard key={game.gameId} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {games.length === 0 && (
        <div className="text-center py-16 space-y-6">
          <div className="text-6xl" aria-hidden="true">🏀</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">No games scheduled</h3>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
              Check out the calendar for upcoming matchups.
            </p>
          </div>
        </div>
      )}

      {/* Score Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-label="Score notifications">
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
