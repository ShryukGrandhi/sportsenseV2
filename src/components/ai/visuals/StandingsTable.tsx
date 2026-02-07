'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import type { VisualStandingsData } from '@/types/chat-visuals';

export function StandingsTable({ standings }: { standings: VisualStandingsData }) {
  return (
    <div className="w-full my-4 bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b border-white/10",
        standings.conference === 'East'
          ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20"
          : "bg-gradient-to-r from-red-500/20 to-red-600/20"
      )}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">{standings.conference}ern Conference</h3>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-xs text-white/60">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Team</th>
              <th className="px-3 py-2 text-center">W</th>
              <th className="px-3 py-2 text-center">L</th>
              <th className="px-3 py-2 text-center">PCT</th>
              <th className="px-3 py-2 text-center">GB</th>
              <th className="px-3 py-2 text-center">STRK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.teams.map((team) => (
              <tr
                key={team.abbreviation}
                className={cn(
                  "hover:bg-white/5 transition-colors",
                  team.isPlayoff && "bg-green-500/5",
                  team.isPlayIn && "bg-yellow-500/5"
                )}
              >
                <td className="px-3 py-2">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                    team.rank <= 6 ? "bg-green-500/20 text-green-400" :
                    team.rank <= 10 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-white/10 text-white/60"
                  )}>
                    {team.rank}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={team.logo}
                      alt={team.abbreviation}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                    <span className="text-white font-medium">{team.abbreviation}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-white tabular-nums">{team.wins}</td>
                <td className="px-3 py-2 text-center text-white/60 tabular-nums">{team.losses}</td>
                <td className="px-3 py-2 text-center text-white tabular-nums">{team.winPct}</td>
                <td className="px-3 py-2 text-center text-white/60 tabular-nums">{team.gamesBehind}</td>
                <td className="px-3 py-2 text-center">
                  {team.streak && (
                    <span className={cn(
                      "text-xs font-medium",
                      team.streak.startsWith('W') ? "text-green-400" : "text-red-400"
                    )}>
                      {team.streak}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-white/10 flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500/40" />
          <span>Playoff</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
          <span>Play-In</span>
        </div>
      </div>
    </div>
  );
}
