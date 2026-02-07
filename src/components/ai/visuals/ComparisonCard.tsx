'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { StatBox } from './StatBox';
import type { PlayerComparisonVisual, VisualPlayerData } from '@/types/chat-visuals';

export function ComparisonCard({ comparison }: { comparison: PlayerComparisonVisual }) {
  const { player1, player2, verdict } = comparison;

  const renderPlayerCard = (player: VisualPlayerData) => {
    const ppg = player.stats?.ppg ?? 0;
    const rpg = player.stats?.rpg ?? 0;
    const apg = player.stats?.apg ?? 0;
    const spg = player.stats?.spg ?? 0;
    const bpg = player.stats?.bpg ?? 0;
    const mpg = player.stats?.mpg ?? 0;
    const gamesPlayed = player.stats?.gamesPlayed ?? 0;
    const formatPct = (val: number | undefined): number => {
      if (val === undefined || val === null) return 0;
      return val > 1 ? val : val * 100;
    };

    const fgPct = formatPct(player.stats?.fgPct);
    const fg3Pct = formatPct(player.stats?.fg3Pct);
    const ftPct = formatPct(player.stats?.ftPct);

    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0.3) 100%)`,
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {player.headshot ? (
                <Image
                  src={player.headshot}
                  alt={player.name}
                  width={72}
                  height={72}
                  className="rounded-xl object-cover bg-white/10"
                  unoptimized
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-xl font-bold text-white bg-white/10">
                  {player.number ? `#${player.number}` : '?'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white truncate">{player.name}</h4>
                {player.number && <span className="text-xs text-white/40">#{player.number}</span>}
              </div>
              <p className="text-sm text-white/50">{player.position}</p>

              <div className="flex items-center gap-3 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{ppg.toFixed(1)}</p>
                  <p className="text-[10px] text-white/40 uppercase">PPG</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white/80">{rpg.toFixed(1)}</p>
                  <p className="text-[10px] text-white/40 uppercase">RPG</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white/80">{apg.toFixed(1)}</p>
                  <p className="text-[10px] text-white/40 uppercase">APG</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 border-t border-white/10">
          <div className="mt-4 grid grid-cols-3 gap-3">
            {gamesPlayed > 0 && (
              <StatBox label="Games" value={gamesPlayed.toString()} />
            )}
            <StatBox label="MPG" value={mpg.toFixed(1)} />
            <StatBox label="PPG" value={ppg.toFixed(1)} highlight />
            <StatBox label="RPG" value={rpg.toFixed(1)} />
            <StatBox label="APG" value={apg.toFixed(1)} />
            <StatBox label="SPG" value={spg.toFixed(1)} />
            <StatBox label="BPG" value={bpg.toFixed(1)} />
            <StatBox label="FG%" value={`${fgPct.toFixed(1)}%`} />
            <StatBox label="3P%" value={`${fg3Pct.toFixed(1)}%`} />
            <StatBox label="FT%" value={`${ftPct.toFixed(1)}%`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-4 animate-fade-in">
      {/* Team Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          {player1.teamLogo && (
            <Image
              src={player1.teamLogo}
              alt={player1.team}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
          )}
          <span className="font-semibold text-white">{player1.team}</span>
        </div>
        <div className="flex items-center gap-2">
          {player2.teamLogo && (
            <Image
              src={player2.teamLogo}
              alt={player2.team}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
          )}
          <span className="font-semibold text-white">{player2.team}</span>
        </div>
      </div>

      {/* Two Player Cards Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderPlayerCard(player1)}
        {renderPlayerCard(player2)}
      </div>

      {/* AI Verdict */}
      {verdict && (
        <div className="mt-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-blue-500/20">
              <Star className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">AI Verdict</p>
              <p className="text-white/90 text-sm leading-relaxed">{verdict}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
