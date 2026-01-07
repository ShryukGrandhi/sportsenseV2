'use client';

import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { X, Zap, Trophy, AlertTriangle, Bell, Volume2 } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'score' | 'highlight' | 'alert' | 'info';
  title: string;
  message: string;
  sport?: string;
  teamLogo?: string;
  timestamp: Date;
  read: boolean;
  sound?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function NotificationToast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const iconMap = {
    score: Trophy,
    highlight: Zap,
    alert: AlertTriangle,
    info: Bell,
  };
  
  const colorMap = {
    score: 'from-green-500 to-emerald-600',
    highlight: 'from-orange-500 to-amber-600',
    alert: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-cyan-600',
  };

  const Icon = iconMap[notification.type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-toast glass-dark rounded-xl p-4 w-80 shadow-2xl border border-white/10">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[notification.type]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white text-sm truncate">{notification.title}</h4>
            {notification.sport && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 uppercase">
                {notification.sport}
              </span>
            )}
          </div>
          <p className="text-white/70 text-xs mt-1 line-clamp-2">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const playSound = useCallback((type: Notification['type']) => {
    if (!soundEnabled) return;
    
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const frequencies: Record<Notification['type'], number> = {
        score: 880,
        highlight: 660,
        alert: 440,
        info: 550,
      };
      
      const frequency = frequencies[type];
      if (frequency && isFinite(frequency)) {
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
      }
    } catch (e) {
      // Ignore audio errors (e.g., browser autoplay restrictions)
      console.warn('Audio playback failed:', e);
    }
  }, [soundEnabled]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setToasts(prev => [newNotification, ...prev].slice(0, 3));
    
    if (notification.sound !== false) {
      playSound(notification.type);
    }
  }, [playSound]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setToasts(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setToasts([]);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id));
  }, []);

  // Monitor for live game updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const gameStates = new Map<string, { 
      lastScore: { home: number; away: number };
      notifiedFinal: boolean;
      notifiedHalftime: boolean;
      notifiedCloseGame: boolean;
    }>();

    const checkForGameUpdates = async () => {
      try {
        const response = await fetch('/api/live/nba');
        if (!response.ok) return;
        
        const data = await response.json();
        const games = data.games || [];

        for (const game of games) {
          const state = gameStates.get(game.gameId) || {
            lastScore: { home: 0, away: 0 },
            notifiedFinal: false,
            notifiedHalftime: false,
            notifiedCloseGame: false,
          };

          // Check for halftime
          if (game.status === 'halftime' && !state.notifiedHalftime) {
            addNotification({
              type: 'info',
              title: `⏸️ Halftime: ${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
              message: `Score: ${game.awayTeam.score} - ${game.homeTeam.score}`,
              sport: 'NBA',
            });
            state.notifiedHalftime = true;
          }

          // Check for final
          if (game.status === 'final' && !state.notifiedFinal) {
            const winner = game.homeTeam.score > game.awayTeam.score ? game.homeTeam : game.awayTeam;
            addNotification({
              type: 'score',
              title: `🏆 ${winner.abbreviation} wins!`,
              message: `Final: ${game.awayTeam.abbreviation} ${game.awayTeam.score} - ${game.homeTeam.abbreviation} ${game.homeTeam.score}`,
              sport: 'NBA',
            });
            state.notifiedFinal = true;
          }

          // Check for close game in 4th quarter
          if (game.status === 'live' && game.period === 4 && !state.notifiedCloseGame) {
            const scoreDiff = Math.abs(game.homeTeam.score - game.awayTeam.score);
            if (scoreDiff <= 5) {
              addNotification({
                type: 'alert',
                title: `🔥 Close game!`,
                message: `${game.awayTeam.abbreviation} ${game.awayTeam.score} - ${game.homeTeam.abbreviation} ${game.homeTeam.score} with ${game.clock} left!`,
                sport: 'NBA',
              });
              state.notifiedCloseGame = true;
            }
          }

          // Update state
          state.lastScore = { home: game.homeTeam.score, away: game.awayTeam.score };
          gameStates.set(game.gameId, state);
        }
      } catch (error) {
        console.error('Failed to check for game updates:', error);
      }
    };

    // Start polling after a delay
    const startPolling = setTimeout(() => {
      checkForGameUpdates();
      intervalId = setInterval(checkForGameUpdates, 60000); // Poll every minute
    }, 5000);

    return () => {
      clearTimeout(startPolling);
      clearInterval(intervalId);
    };
  }, [addNotification]);

  // Welcome notification
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        type: 'info',
        title: 'Welcome to Playmaker!',
        message: 'Your AI sports companion is ready. You\'ll be notified about big plays and game updates!',
        sport: 'ALL',
        sound: false,
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

