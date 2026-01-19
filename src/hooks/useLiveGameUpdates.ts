'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LiveGameData } from '@/components/games/LiveGameCard';

interface GameChangeInfo extends LiveGameData {
  _changes?: {
    scoreChanged: boolean;
    homeScored: boolean;
    awayScored: boolean;
    clockChanged: boolean;
    pointsScored: { home: number; away: number } | null;
  };
}

interface SSEMessage {
  type: 'connected' | 'update' | 'error';
  timestamp: number;
  lastUpdated?: string;
  games?: GameChangeInfo[];
  liveCount?: number;
  message?: string;
}

interface UseLiveGameUpdatesOptions {
  enabled?: boolean;
  onScoreChange?: (gameId: string, team: 'home' | 'away', points: number, game: GameChangeInfo) => void;
  onGameUpdate?: (games: GameChangeInfo[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useLiveGameUpdates(
  initialGames: LiveGameData[],
  options: UseLiveGameUpdatesOptions = {}
) {
  const { 
    enabled = true, 
    onScoreChange, 
    onGameUpdate,
    onConnectionChange 
  } = options;

  const [games, setGames] = useState<GameChangeInfo[]>(initialGames);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 2000;

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback(() => {
    return Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttempts.current),
      30000 // Max 30 seconds
    );
  }, []);

  // Connect to SSE stream
  const connect = useCallback(() => {
    // Don't connect if not mounted, not enabled, or not in browser
    if (!isMountedRef.current || !enabled || typeof window === 'undefined') {
      return;
    }
    
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const eventSource = new EventSource('/api/live/nba/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (!isMountedRef.current) {
        eventSource.close();
        return;
      }
      console.log('[LiveUpdates] Connected to SSE stream');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      onConnectionChange?.(true);
    };

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return;
      
      try {
        const data: SSEMessage = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          return;
        }
        
        if (data.type === 'error') {
          console.warn('[LiveUpdates] Server error:', data.message);
          setError(data.message || 'Unknown error');
          return;
        }
        
        if (data.type === 'update' && data.games) {
          setLastUpdate(new Date(data.timestamp));
          
          // Check for score changes and trigger callbacks
          data.games.forEach((game) => {
            if (game._changes?.scoreChanged) {
              if (game._changes.homeScored && game._changes.pointsScored) {
                onScoreChange?.(game.gameId, 'home', game._changes.pointsScored.home, game);
              }
              if (game._changes.awayScored && game._changes.pointsScored) {
                onScoreChange?.(game.gameId, 'away', game._changes.pointsScored.away, game);
              }
            }
          });

          // Update games state
          setGames(data.games);
          onGameUpdate?.(data.games);
        }
      } catch (e) {
        // Silent fail for parse errors during development
      }
    };

    eventSource.onerror = () => {
      // Don't handle errors if component unmounted
      if (!isMountedRef.current) {
        eventSource.close();
        return;
      }
      
      setIsConnected(false);
      onConnectionChange?.(false);
      
      eventSource.close();
      eventSourceRef.current = null;

      // Only attempt reconnect if still mounted and under max attempts
      if (isMountedRef.current && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = getReconnectDelay();
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            reconnectAttempts.current += 1;
            connect();
          }
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Connection lost. Please refresh the page.');
      }
    };
  }, [enabled, onScoreChange, onGameUpdate, onConnectionChange, getReconnectDelay]);

  // Initial connection and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Delay initial connection slightly to avoid React Strict Mode issues
    const initTimeout = setTimeout(() => {
      if (enabled && isMountedRef.current) {
        connect();
      }
    }, 200);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimeout);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, connect]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/live/nba');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('[LiveUpdates] Manual refresh failed:', e);
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Reconnect function
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setError(null);
    connect();
  }, [connect]);

  return {
    games,
    isConnected,
    lastUpdate,
    error,
    refresh,
    disconnect,
    reconnect,
  };
}

export default useLiveGameUpdates;
