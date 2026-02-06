'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { ShotChartVisual } from '@/types/chat-visuals';

function getHeatColor(pct: number): string {
  if (pct >= 50) return '#22C55E'; // green - hot
  if (pct >= 40) return '#EAB308'; // yellow - warm
  if (pct >= 30) return '#F97316'; // orange - cool
  return '#EF4444'; // red - cold
}

function getHeatBg(pct: number): string {
  if (pct >= 50) return 'rgba(34,197,94,0.15)';
  if (pct >= 40) return 'rgba(234,179,8,0.15)';
  if (pct >= 30) return 'rgba(249,115,22,0.15)';
  return 'rgba(239,68,68,0.15)';
}

export function ShotChartCard({ data }: { data: ShotChartVisual }) {
  const { player, zones, totals, isEstimated } = data;

  return (
    <div className="w-full my-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-white/5">
        {player.headshot && (
          <Image src={player.headshot} alt={player.name} width={36} height={36} className="rounded-full" unoptimized />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-white/50">Shot Distribution</p>
        </div>
        {isEstimated && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Estimated
          </span>
        )}
      </div>

      {/* Court SVG */}
      <div className="px-4 py-4 flex justify-center">
        <svg viewBox="0 0 300 180" className="w-full max-w-sm">
          {/* Court outline */}
          <rect x="0" y="0" width="300" height="180" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" rx="4" />

          {/* 3-point arc */}
          <path
            d="M 30 180 L 30 60 Q 150 -20 270 60 L 270 180"
            fill={getHeatBg(zones.threePoint.pct)}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Mid-range area */}
          <ellipse
            cx="150" cy="180"
            rx="100" ry="90"
            fill={getHeatBg(zones.midrange.pct)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Paint */}
          <rect
            x="100" y="120" width="100" height="60"
            fill={getHeatBg(zones.paint.pct)}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            rx="2"
          />

          {/* Basket */}
          <circle cx="150" cy="170" r="5" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

          {/* Zone labels - 3PT */}
          <text x="150" y="35" textAnchor="middle" fill={getHeatColor(zones.threePoint.pct)} fontSize="13" fontWeight="bold">
            {zones.threePoint.pct.toFixed(1)}%
          </text>
          <text x="150" y="50" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
            3PT: {zones.threePoint.made}/{zones.threePoint.attempted}
          </text>

          {/* Zone labels - Mid */}
          <text x="150" y="105" textAnchor="middle" fill={getHeatColor(zones.midrange.pct)} fontSize="13" fontWeight="bold">
            {zones.midrange.pct.toFixed(1)}%
          </text>
          <text x="150" y="118" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
            MID: {zones.midrange.made}/{zones.midrange.attempted}
          </text>

          {/* Zone labels - Paint */}
          <text x="150" y="147" textAnchor="middle" fill={getHeatColor(zones.paint.pct)} fontSize="13" fontWeight="bold">
            {zones.paint.pct.toFixed(1)}%
          </text>
          <text x="150" y="160" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
            PAINT: {zones.paint.made}/{zones.paint.attempted}
          </text>
        </svg>
      </div>

      {/* Totals */}
      <div className="px-4 py-3 border-t border-white/10 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-white">{totals.fgm}/{totals.fga}</p>
          <p className="text-[10px] text-white/40">Total FG</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{totals.fgPct.toFixed(1)}%</p>
          <p className="text-[10px] text-white/40">FG%</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{totals.fg3m}/{totals.fg3a}</p>
          <p className="text-[10px] text-white/40">3PT</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{totals.fg3Pct.toFixed(1)}%</p>
          <p className="text-[10px] text-white/40">3P%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] text-white/40">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />50%+</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#EAB308' }} />40-50%</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />30-40%</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />&lt;30%</div>
      </div>
    </div>
  );
}
