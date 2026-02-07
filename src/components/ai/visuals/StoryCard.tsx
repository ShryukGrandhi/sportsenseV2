'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BookOpen, Trophy, Star, ChevronRight } from 'lucide-react';
import type { StoryCardVisual } from '@/types/chat-visuals';

export function StoryCard({ data }: { data: StoryCardVisual }) {
  const { headline, homeTeam, awayTeam, quarters, mvp, turningPoint, status } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b border-white/10",
        status === 'live' && "bg-red-500/10",
        status === 'final' && "bg-green-500/10"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Game Story</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            status === 'live' ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
          )}>
            {status === 'live' ? 'LIVE' : status === 'halftime' ? 'HALFTIME' : 'FINAL'}
          </span>
        </div>
        <p className="text-white font-bold text-lg">{headline}</p>
      </div>

      {/* Score */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Image src={awayTeam.logo} alt={awayTeam.abbreviation} width={28} height={28} className="object-contain" unoptimized />
          <span className="font-bold text-white">{awayTeam.abbreviation}</span>
          <span className="text-2xl font-bold text-white tabular-nums">{awayTeam.score}</span>
        </div>
        <span className="text-white/30 text-sm">FINAL</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white tabular-nums">{homeTeam.score}</span>
          <span className="font-bold text-white">{homeTeam.abbreviation}</span>
          <Image src={homeTeam.logo} alt={homeTeam.abbreviation} width={28} height={28} className="object-contain" unoptimized />
        </div>
      </div>

      {/* Quarter Timeline */}
      <div className="px-4 py-3">
        <div className="space-y-3">
          {quarters.map((q, i) => (
            <div key={i} className="flex gap-3">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  i === quarters.length - 1
                    ? "border-orange-500 bg-orange-500/20 text-orange-400"
                    : "border-white/20 bg-white/5 text-white/50"
                )}>
                  {q.quarter}
                </div>
                {i < quarters.length - 1 && (
                  <div className="w-px h-full bg-white/10 mt-1" />
                )}
              </div>

              {/* Quarter content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white">
                    {awayTeam.abbreviation} {q.awayPoints} - {q.homePoints} {homeTeam.abbreviation}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{q.summary}</p>
                {q.keyPlay && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400">
                    <ChevronRight className="w-3 h-3" />
                    <span>{q.keyPlay}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Turning Point */}
      {turningPoint && (
        <div className="px-4 py-3 bg-orange-500/5 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs">
            <Star className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-white/50">Turning Point (Q{turningPoint.period}):</span>
            <span className="text-white/80">{turningPoint.description}</span>
          </div>
        </div>
      )}

      {/* MVP */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <div className="flex items-center gap-2">
          {mvp.headshot && (
            <Image src={mvp.headshot} alt={mvp.name} width={28} height={28} className="rounded-full" unoptimized />
          )}
          <div>
            <p className="text-xs font-medium text-white">{mvp.name} ({mvp.team})</p>
            <p className="text-[10px] text-white/40">
              {mvp.points} PTS / {mvp.rebounds} REB / {mvp.assists} AST
            </p>
          </div>
        </div>
        <span className="text-[10px] text-yellow-400 font-medium ml-auto">Game MVP</span>
      </div>
    </div>
  );
}
