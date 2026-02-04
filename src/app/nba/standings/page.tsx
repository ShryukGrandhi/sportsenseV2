// NBA Standings Page - Live standings from ESPN

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Trophy, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { fetchStandings, type TeamStanding } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

function TeamRow({ 
  team, 
  rank, 
  firstPlaceTeam 
}: { 
  team: TeamStanding; 
  rank: number;
  firstPlaceTeam: TeamStanding;
}) {
  const pct = team.wins + team.losses > 0 
    ? (team.wins / (team.wins + team.losses || 1)).toFixed(3).slice(1)
    : '.000';
  
  const gb = rank === 1 
    ? '-' 
    : (((firstPlaceTeam.wins - team.wins) + (team.losses - firstPlaceTeam.losses)) / 2).toFixed(1);
  
  const isPlayoff = rank <= 6;
  const isPlayIn = rank > 6 && rank <= 10;

  // Parse streak for display
  const streakDisplay = team.streak || '-';
  const isWinStreak = streakDisplay.toLowerCase().startsWith('w');
  const isLossStreak = streakDisplay.toLowerCase().startsWith('l');

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
      <td className="px-2 py-2">
        <span className={`
          text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center
          ${isPlayoff ? 'bg-green-500/20 text-green-400' : isPlayIn ? 'bg-yellow-500/20 text-yellow-400' : 'text-white/40'}
        `}>
          {rank}
        </span>
      </td>
      <td className="px-2 py-2">
        <Link 
          href={`/nba/teams/${team.abbreviation.toLowerCase()}`}
          className="flex items-center gap-2 hover:text-orange-400 transition-colors"
        >
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`}
            alt={team.name}
            width={28}
            height={28}
            className="object-contain group-hover:scale-110 transition-transform flex-shrink-0"
            unoptimized
          />
          <span className="font-medium text-white text-sm truncate max-w-[100px]">{team.name}</span>
        </Link>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-white font-bold">{team.wins}</span>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-white/60">{team.losses}</span>
      </td>
      <td className="px-2 py-2 text-center hidden xl:table-cell">
        <span className="text-white/70 font-mono text-sm">{team.winPct || pct}</span>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-white/50 text-sm">{team.gamesBehind || gb}</span>
      </td>
      <td className="px-2 py-2 text-center hidden lg:table-cell">
        <span className={`
          px-1.5 py-0.5 rounded text-xs font-medium
          ${isWinStreak ? 'bg-green-500/20 text-green-400' : 
            isLossStreak ? 'bg-red-500/20 text-red-400' : 
            'text-white/40'}
        `}>
          {streakDisplay}
        </span>
      </td>
      <td className="px-2 py-2 text-center hidden xl:table-cell">
        <span className="text-white/40 text-xs">{team.lastTen || '-'}</span>
      </td>
    </tr>
  );
}

function getSeasonLabel(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const seasonStartYear = month >= 10 ? year : year - 1;
  return `${seasonStartYear}-${String(seasonStartYear + 1).slice(-2)}`;
}

export default async function NBAStandingsPage() {
  const { east, west, source, sourceUrl } = await fetchStandings();
  const seasonLabel = getSeasonLabel();

  return (
    <div className="min-h-screen">
      <NBAHeader />
      
      <main className="container mx-auto px-4 py-6">
        <Link 
          href="/nba"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to NBA
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text-orange">NBA</span>
            <span className="text-white"> Standings</span>
          </h1>
          <p className="text-white/60">{seasonLabel} Regular Season</p>
          
          {/* Source */}
          <div className="mt-4">
            <a 
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70"
            >
              Data from {source} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50"></span>
            <span className="text-white/60">Playoff Position (1-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
            <span className="text-white/60">Play-In Tournament (7-10)</span>
          </div>
        </div>

        {/* Standings Tables - Side by Side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Eastern Conference */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-transparent border-b border-white/10">
              <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                🏀 Eastern Conference
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-white/50 border-b border-white/10 uppercase tracking-wider">
                    <th className="text-left px-2 py-2 w-8">#</th>
                    <th className="text-left px-2 py-2">Team</th>
                    <th className="text-center px-2 py-2">W</th>
                    <th className="text-center px-2 py-2">L</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell">PCT</th>
                    <th className="text-center px-2 py-2">GB</th>
                    <th className="text-center px-2 py-2 hidden lg:table-cell">STRK</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell">L10</th>
                  </tr>
                </thead>
                <tbody>
                  {east.length > 0 ? (
                    east.map((team, i) => (
                      <TeamRow 
                        key={team.abbreviation} 
                        team={team} 
                        rank={i + 1}
                        firstPlaceTeam={east[0]}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-white/40">
                        Loading standings...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Western Conference */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-500/20 to-transparent border-b border-white/10">
              <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                🏀 Western Conference
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-white/50 border-b border-white/10 uppercase tracking-wider">
                    <th className="text-left px-2 py-2 w-8">#</th>
                    <th className="text-left px-2 py-2">Team</th>
                    <th className="text-center px-2 py-2">W</th>
                    <th className="text-center px-2 py-2">L</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell">PCT</th>
                    <th className="text-center px-2 py-2">GB</th>
                    <th className="text-center px-2 py-2 hidden lg:table-cell">STRK</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell">L10</th>
                  </tr>
                </thead>
                <tbody>
                  {west.length > 0 ? (
                    west.map((team, i) => (
                      <TeamRow 
                        key={team.abbreviation} 
                        team={team} 
                        rank={i + 1}
                        firstPlaceTeam={west[0]}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-white/40">
                        Loading standings...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{east.length}</p>
            <p className="text-sm text-white/50">Eastern Teams</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{west.length}</p>
            <p className="text-sm text-white/50">Western Teams</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {east[0]?.name?.split(' ').pop() || '-'}
            </p>
            <p className="text-sm text-white/50">East Leader</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {west[0]?.name?.split(' ').pop() || '-'}
            </p>
            <p className="text-sm text-white/50">West Leader</p>
          </div>
        </div>

        {/* Source Footer */}
        <div className="mt-8 text-center">
          <a 
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            📊 View full standings on ESPN <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
