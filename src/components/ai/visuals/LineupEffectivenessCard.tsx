'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Users, Star } from 'lucide-react';
import type { LineupEffectivenessVisual } from '@/types/chat-visuals';

function PlayerRow({ player, isStarter }: {
  player: LineupEffectivenessVisual['starters'][0];
  isStarter: boolean;
}) {
  const plusMinus = parseFloat(player.plusMinus) || 0;
  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      {player.headshot ? (
        <Image src={player.headshot} alt={player.name} width={24} height={24} className="rounded-full" unoptimized />
      ) : (
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/40">
          {player.name.charAt(0)}
        </div>
      )}
      <span className="text-white/80 flex-1 truncate">{player.name}</span>
      <span className="text-white/40 tabular-nums w-8 text-right">{player.minutes}</span>
      <span className="text-white font-medium tabular-nums w-8 text-right">{player.points}</span>
      <span className="text-white/60 tabular-nums w-6 text-right">{player.rebounds}</span>
      <span className="text-white/60 tabular-nums w-6 text-right">{player.assists}</span>
      <span className={cn(
        "tabular-nums w-10 text-right font-medium",
        plusMinus > 0 ? "text-green-400" : plusMinus < 0 ? "text-red-400" : "text-white/40"
      )}>
        {plusMinus > 0 ? '+' : ''}{player.plusMinus}
      </span>
    </div>
  );
}

export function LineupEffectivenessCard({ data }: { data: LineupEffectivenessVisual }) {
  const { team, starters, bench, starterPoints, benchPoints, starterPlusMinus, benchPlusMinus } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 bg-white/5">
        <Image src={team.logo} alt={team.abbreviation} width={28} height={28} className="object-contain" unoptimized />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{team.name}</h3>
          <p className="text-xs text-white/50">Lineup Effectiveness</p>
        </div>
        <Users className="w-5 h-5 text-blue-400" />
      </div>

      {/* Summary */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 text-center">
          <p className="text-xs text-green-400 font-medium mb-1 flex items-center justify-center gap-1">
            <Star className="w-3 h-3" /> Starters
          </p>
          <p className="text-2xl font-bold text-white">{starterPoints}</p>
          <p className="text-[10px] text-white/40">points</p>
          <p className={cn(
            "text-xs font-medium mt-1",
            starterPlusMinus > 0 ? "text-green-400" : starterPlusMinus < 0 ? "text-red-400" : "text-white/40"
          )}>
            {starterPlusMinus > 0 ? '+' : ''}{starterPlusMinus} +/-
          </p>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 text-center">
          <p className="text-xs text-blue-400 font-medium mb-1">Bench</p>
          <p className="text-2xl font-bold text-white">{benchPoints}</p>
          <p className="text-[10px] text-white/40">points</p>
          <p className={cn(
            "text-xs font-medium mt-1",
            benchPlusMinus > 0 ? "text-green-400" : benchPlusMinus < 0 ? "text-red-400" : "text-white/40"
          )}>
            {benchPlusMinus > 0 ? '+' : ''}{benchPlusMinus} +/-
          </p>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-1 flex items-center gap-2 text-[10px] text-white/30 uppercase">
        <span className="w-6" />
        <span className="flex-1">Player</span>
        <span className="w-8 text-right">MIN</span>
        <span className="w-8 text-right">PTS</span>
        <span className="w-6 text-right">REB</span>
        <span className="w-6 text-right">AST</span>
        <span className="w-10 text-right">+/-</span>
      </div>

      {/* Starters */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-green-400 font-medium mb-1">STARTERS</p>
        {starters.map((p, i) => (
          <PlayerRow key={i} player={p} isStarter />
        ))}
      </div>

      {/* Bench */}
      <div className="px-4 py-2 border-t border-white/10">
        <p className="text-[10px] text-blue-400 font-medium mb-1">BENCH</p>
        {bench.map((p, i) => (
          <PlayerRow key={i} player={p} isStarter={false} />
        ))}
      </div>
    </div>
  );
}
