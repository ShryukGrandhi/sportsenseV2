'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, BarChart3, Users, Trophy, Activity } from 'lucide-react';
import type { TrendingQuestionsVisual } from '@/types/chat-visuals';

const categoryIcons: Record<string, React.ReactNode> = {
  game: <Activity className="w-3 h-3" />,
  player: <Users className="w-3 h-3" />,
  team: <Trophy className="w-3 h-3" />,
  standings: <BarChart3 className="w-3 h-3" />,
  analytics: <TrendingUp className="w-3 h-3" />,
};

const categoryColors: Record<string, string> = {
  game: 'bg-red-500/10 text-red-400 border-red-500/20',
  player: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  team: 'bg-green-500/10 text-green-400 border-green-500/20',
  standings: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  analytics: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export function TrendingQuestionsCard({
  data,
  onQuestionClick,
}: {
  data: TrendingQuestionsVisual;
  onQuestionClick?: (question: string) => void;
}) {
  const { questions, context } = data;

  return (
    <div className="w-full my-4">
      {context && (
        <p className="text-xs text-white/40 mb-2">{context}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick?.(q.text)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border transition-all hover:scale-105",
              categoryColors[q.category] || categoryColors.analytics
            )}
          >
            {categoryIcons[q.category]}
            <span>{q.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
