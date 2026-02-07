'use client';

import Image from 'next/image';
import { StatBox } from './StatBox';
import type { VisualPlayerData } from '@/types/chat-visuals';

export function PlayerCard({ player }: { player: VisualPlayerData }) {
  const hasGameStats = !!player.gameStats;
  const useGameStats = hasGameStats;

  const pts = useGameStats ? (player.gameStats?.points || 0) : (player.stats.ppg || 0);
  const reb = useGameStats ? (player.gameStats?.rebounds || 0) : (player.stats.rpg || 0);
  const ast = useGameStats ? (player.gameStats?.assists || 0) : (player.stats.apg || 0);

  const formatPercentage = (val: number | undefined, gameFgm?: number, gameFga?: number): string => {
    if (gameFga && gameFga > 0 && gameFgm !== undefined) {
      const pct = (gameFgm / gameFga) * 100;
      return Math.max(0, Math.min(100, pct)).toFixed(1);
    }
    if (val === undefined || val === null) return '0.0';
    const pct = val > 1 ? val : val * 100;
    return Math.max(0, Math.min(100, pct)).toFixed(1);
  };

  const fgPct = formatPercentage(
    player.stats.fgPct,
    player.gameStats?.fgm,
    player.gameStats?.fga
  );

  const fg3Pct = formatPercentage(
    player.stats.fg3Pct,
    player.gameStats?.fg3m,
    player.gameStats?.fg3a
  );

  const ftPct = formatPercentage(player.stats.ftPct);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 overflow-hidden max-w-md mx-auto">
      {/* Team Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {player.teamLogo && (
          <Image
            src={player.teamLogo}
            alt={player.team}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        )}
        <span className="font-semibold text-white">{player.team}</span>
      </div>

      {/* Player Header Card */}
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
                <p className="text-lg font-bold text-white">{useGameStats ? pts : pts.toFixed(1)}</p>
                <p className="text-[10px] text-white/40 uppercase">{useGameStats ? 'PTS' : 'PPG'}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white/80">{useGameStats ? reb : reb.toFixed(1)}</p>
                <p className="text-[10px] text-white/40 uppercase">{useGameStats ? 'REB' : 'RPG'}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white/80">{useGameStats ? ast : ast.toFixed(1)}</p>
                <p className="text-[10px] text-white/40 uppercase">{useGameStats ? 'AST' : 'APG'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        {useGameStats && player.gameStats ? (
          <>
            <StatBox label="MIN" value={player.gameStats.minutes || '0'} />
            <StatBox label="PTS" value={player.gameStats.points?.toString() || '0'} highlight />
            <StatBox label="REB" value={player.gameStats.rebounds?.toString() || '0'} />
            <StatBox label="AST" value={player.gameStats.assists?.toString() || '0'} />
            <StatBox label="STL" value={player.gameStats.steals?.toString() || '0'} />
            <StatBox label="BLK" value={player.gameStats.blocks?.toString() || '0'} />
            <StatBox
              label="FG"
              value={`${player.gameStats.fgm || 0}-${player.gameStats.fga || 0}`}
              subtext={fgPct + '%'}
            />
            <StatBox
              label="3PT"
              value={`${player.gameStats.fg3m || 0}-${player.gameStats.fg3a || 0}`}
              subtext={fg3Pct + '%'}
            />
            <StatBox label="FG%" value={fgPct + '%'} />
            <StatBox label="3P%" value={fg3Pct + '%'} />
            <StatBox label="FT%" value={ftPct + '%'} />
          </>
        ) : (
          <>
            <StatBox label="PPG" value={player.stats.ppg?.toFixed(1) || '0.0'} highlight />
            <StatBox label="RPG" value={player.stats.rpg?.toFixed(1) || '0.0'} />
            <StatBox label="APG" value={player.stats.apg?.toFixed(1) || '0.0'} />
            <StatBox label="SPG" value={player.stats.spg?.toFixed(1) || '0.0'} />
            <StatBox label="BPG" value={player.stats.bpg?.toFixed(1) || '0.0'} />
            <StatBox label="MPG" value={player.stats.mpg?.toFixed(1) || '0.0'} />
            <StatBox label="FG%" value={fgPct + '%'} />
            <StatBox label="3P%" value={fg3Pct + '%'} />
            <StatBox label="FT%" value={ftPct + '%'} />
            {player.stats.gamesPlayed && (
              <StatBox label="GP" value={player.stats.gamesPlayed.toString()} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
