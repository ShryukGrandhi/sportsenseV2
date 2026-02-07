'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bell, Flame, Trophy, AlertTriangle, TrendingUp, Users, Star } from 'lucide-react';
import type { SmartAlertVisual } from '@/types/chat-visuals';

const priorityStyles = {
  high: { border: 'border-l-red-500', bg: 'bg-red-500/5', icon: 'text-red-400' },
  medium: { border: 'border-l-yellow-500', bg: 'bg-yellow-500/5', icon: 'text-yellow-400' },
  low: { border: 'border-l-blue-500', bg: 'bg-blue-500/5', icon: 'text-blue-400' },
};

const typeIcons: Record<string, React.ReactNode> = {
  streak: <Flame className="w-4 h-4" />,
  milestone: <Trophy className="w-4 h-4" />,
  upset: <AlertTriangle className="w-4 h-4" />,
  injury: <Users className="w-4 h-4" />,
  record: <Star className="w-4 h-4" />,
  standings: <TrendingUp className="w-4 h-4" />,
};

export function SmartAlertCard({ data }: { data: SmartAlertVisual }) {
  const { alerts } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 bg-orange-500/5">
        <Bell className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-white">Smart Alerts</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
          {alerts.length}
        </span>
      </div>

      {/* Alerts */}
      <div className="divide-y divide-white/5">
        {alerts.map((alert) => {
          const styles = priorityStyles[alert.priority];
          return (
            <div
              key={alert.id}
              className={cn(
                "px-4 py-3 border-l-2 flex items-start gap-3",
                styles.border,
                styles.bg
              )}
            >
              {/* Icon */}
              <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>
                {typeIcons[alert.type] || <Bell className="w-4 h-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  {alert.team && (
                    <Image src={alert.team.logo} alt={alert.team.abbreviation} width={16} height={16} className="object-contain" unoptimized />
                  )}
                </div>
                <p className="text-xs text-white/50 mt-0.5">{alert.description}</p>
                {alert.timestamp && (
                  <p className="text-[10px] text-white/30 mt-1">{alert.timestamp}</p>
                )}
              </div>

              {/* Player headshot */}
              {alert.player && (
                <Image src={alert.player.headshot} alt={alert.player.name} width={32} height={32} className="rounded-full flex-shrink-0" unoptimized />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
