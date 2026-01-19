'use client';

import Image from 'next/image';
import Link from 'next/link';

interface PlayerCardProps {
  id: string;
  name: string;
  position?: string;
  jersey?: string;
  headshot?: string;
  team?: {
    name: string;
    abbreviation: string;
    logo?: string;
    color?: string;
  };
  stats?: {
    ppg?: number;
    rpg?: number;
    apg?: number;
  };
}

export function PlayerCard({
  id,
  name,
  position,
  jersey,
  headshot,
  team,
  stats,
}: PlayerCardProps) {
  return (
    <Link
      href={`/nba/players/${id}`}
      className="group block bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
    >
      {/* Header with team color */}
      <div
        className="h-2"
        style={{ backgroundColor: team?.color ? `#${team.color}` : '#4B5563' }}
      />

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Player headshot */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
            {headshot ? (
              <Image
                src={headshot}
                alt={name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-lg truncate group-hover:text-blue-400 transition-colors">
                {name}
              </h3>
              {jersey && (
                <span className="text-sm text-gray-400">#{jersey}</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              {position && <span>{position}</span>}
              {team && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {team.logo && (
                      <div className="relative w-4 h-4">
                        <Image
                          src={team.logo}
                          alt={team.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span>{team.abbreviation}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick stats */}
            {stats && (
              <div className="flex items-center gap-4 mt-3">
                {stats.ppg !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.ppg.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">PPG</div>
                  </div>
                )}
                {stats.rpg !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.rpg.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">RPG</div>
                  </div>
                )}
                {stats.apg !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{stats.apg.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 uppercase">APG</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
