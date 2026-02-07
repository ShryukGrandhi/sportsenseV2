'use client';

import { useState, useCallback } from 'react';

interface PlayerAIInsightProps {
  playerName: string;
  playerId: string;
  stats?: {
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    fgPct: number;
    fg3Pct: number;
  };
  team?: {
    name: string;
    abbreviation: string;
  };
}

export function PlayerAIInsight({ playerName, playerId, stats, team }: PlayerAIInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build context for the AI
      const context = stats
        ? `${playerName} (${team?.abbreviation || 'NBA'}) averages ${stats.pointsPerGame.toFixed(1)} PPG, ${stats.reboundsPerGame.toFixed(1)} RPG, ${stats.assistsPerGame.toFixed(1)} APG with ${stats.fgPct.toFixed(1)}% FG and ${stats.fg3Pct.toFixed(1)}% 3PT.`
        : `${playerName} plays for ${team?.name || 'an NBA team'}.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me a quick scouting report on ${playerName}. What makes them special? What are their strengths and weaknesses?`,
          personality: 'analyst',
          length: 'medium',
          context: {
            type: 'player_profile',
            playerName,
            playerId,
            stats: context,
          },
        }),
      });

      const data = await response.json();
      
      // API returns { response: "..." } directly, not wrapped in { success, data }
      if (data.response) {
        setInsight(data.response);
      } else if (data.error) {
        setError(data.error?.message || data.error || 'Failed to generate insight');
      } else {
        setError('No response received');
      }
    } catch (err) {
      setError('Failed to generate AI insight');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, playerName, playerId, stats, team]);

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Scouting Report
        </h3>
        {!insight && !isLoading && (
          <button
            onClick={generateInsight}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Generate Report
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing {playerName}&apos;s game...</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">
          {error}
          <button
            onClick={generateInsight}
            className="ml-2 text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {insight && (
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{insight}</p>
          <button
            onClick={generateInsight}
            className="mt-4 text-sm text-blue-400 hover:underline"
          >
            Regenerate
          </button>
        </div>
      )}

      {!insight && !isLoading && !error && (
        <p className="text-gray-500 text-sm">
          Click &quot;Generate Report&quot; to get an AI-powered scouting analysis of {playerName}.
        </p>
      )}
    </div>
  );
}
