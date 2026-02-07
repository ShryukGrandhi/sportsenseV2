// NBA Standings Page - Live standings from ESPN

import Link from 'next/link';
import { ChevronLeft, Trophy, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { TeamLogo } from '@/components/ui/TeamLogo';
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
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group even:bg-white/[0.02]">
      <td className="px-2 py-2">
        <span className={`
          text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center
          ${isPlayoff ? 'bg-green-500/20 text-green-400' : isPlayIn ? 'bg-yellow-500/20 text-yellow-400' : 'text-[var(--text-tertiary)]'}
        `}>
          {rank}
          {isPlayoff && <span className="sr-only"> Playoff</span>}
          {isPlayIn && <span className="sr-only"> Play-In</span>}
        </span>
      </td>
      <td className="px-2 py-2">
        <Link
          href={`/nba/teams/${team.abbreviation.toLowerCase()}`}
          className="flex items-center gap-2 hover:text-orange-400 transition-colors min-h-[44px]"
        >
          <TeamLogo abbreviation={team.abbreviation} alt={`${team.name} logo`} size={28} className="object-contain group-hover:scale-110 transition-transform flex-shrink-0" />
          <span className="font-medium text-[var(--text-primary)] text-sm truncate max-w-[100px]">{team.name}</span>
        </Link>
      </td>
      <td className="px-2 py-2 text-center">
        <strong className="text-[var(--text-primary)] font-bold">{team.wins}</strong>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[var(--text-secondary)]">{team.losses}</span>
      </td>
      <td className="px-2 py-2 text-center hidden xl:table-cell">
        <span className="text-[var(--text-secondary)] font-mono text-sm">{team.winPct || pct}</span>
      </td>
      <td className="px-2 py-2 text-center">
        <span className="text-[var(--text-secondary)] text-sm">{team.gamesBehind || gb}</span>
      </td>
      <td className="px-2 py-2 text-center hidden lg:table-cell">
        <span className={`
          px-1.5 py-0.5 rounded text-xs font-medium
          ${isWinStreak ? 'bg-green-500/20 text-green-400' :
            isLossStreak ? 'bg-red-500/20 text-red-400' :
            'text-[var(--text-tertiary)]'}
        `}>
          {streakDisplay}
        </span>
      </td>
      <td className="px-2 py-2 text-center hidden xl:table-cell">
        <span className="text-[var(--text-tertiary)] text-xs">{team.lastTen || '-'}</span>
      </td>
    </tr>
  );
}

export default async function NBAStandingsPage() {
  let east: TeamStanding[] = [];
  let west: TeamStanding[] = [];
  let source = 'ESPN';
  let sourceUrl = 'https://www.espn.com/nba/standings';

  try {
    const result = await fetchStandings();
    east = result.east;
    west = result.west;
    source = result.source;
    sourceUrl = result.sourceUrl;
  } catch (e) {
    console.error('Failed to fetch standings:', e);
  }

  return (
    <div className="min-h-screen">
      <NBAHeader />

      <main id="main-content" className="container mx-auto px-4 py-6">
        <Link
          href="/nba"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-6 transition-colors min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to NBA
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" aria-hidden="true" />
          </div>
          <h1 id="page-title" className="text-4xl md:text-5xl font-bold mb-2 font-display">
            <span className="gradient-text-orange">NBA</span>
            <span className="text-[var(--text-primary)]"> STANDINGS</span>
          </h1>
          <p className="text-[var(--text-secondary)]">2024-25 Regular Season</p>

          {/* Source */}
          <div className="mt-4">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px]"
            >
              Data from {source} <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50" aria-hidden="true"></span>
            <span className="text-[var(--text-secondary)]">Playoff Position (1-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/50" aria-hidden="true"></span>
            <span className="text-[var(--text-secondary)]">Play-In Tournament (7-10)</span>
          </div>
        </div>

        {/* Standings Tables - Side by Side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Eastern Conference */}
          <section aria-labelledby="east-heading" className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-transparent border-b border-white/10">
              <h2 id="east-heading" className="text-lg font-bold text-blue-400 flex items-center gap-2">
                <span aria-hidden="true">🏀</span> Eastern Conference
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Eastern Conference Standings">
                <thead>
                  <tr className="text-[10px] text-[var(--text-secondary)] border-b border-white/10 uppercase tracking-wider">
                    <th className="text-left px-2 py-2 w-8" scope="col">#</th>
                    <th className="text-left px-2 py-2" scope="col">Team</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">W</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">L</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell" scope="col" aria-sort="none">PCT</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">GB</th>
                    <th className="text-center px-2 py-2 hidden lg:table-cell" scope="col">STRK</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell" scope="col">L10</th>
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
                      <td colSpan={8} className="p-8 text-center text-[var(--text-tertiary)]">
                        Loading standings...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Western Conference */}
          <section aria-labelledby="west-heading" className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-500/20 to-transparent border-b border-white/10">
              <h2 id="west-heading" className="text-lg font-bold text-orange-400 flex items-center gap-2">
                <span aria-hidden="true">🏀</span> Western Conference
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Western Conference Standings">
                <thead>
                  <tr className="text-[10px] text-[var(--text-secondary)] border-b border-white/10 uppercase tracking-wider">
                    <th className="text-left px-2 py-2 w-8" scope="col">#</th>
                    <th className="text-left px-2 py-2" scope="col">Team</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">W</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">L</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell" scope="col" aria-sort="none">PCT</th>
                    <th className="text-center px-2 py-2" scope="col" aria-sort="none">GB</th>
                    <th className="text-center px-2 py-2 hidden lg:table-cell" scope="col">STRK</th>
                    <th className="text-center px-2 py-2 hidden xl:table-cell" scope="col">L10</th>
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
                      <td colSpan={8} className="p-8 text-center text-[var(--text-tertiary)]">
                        Loading standings...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Stats Summary */}
        <section aria-labelledby="stats-heading" className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <h2 id="stats-heading" className="sr-only">Standings Summary</h2>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400"><strong>{east.length}</strong></p>
            <p className="text-sm text-[var(--text-secondary)]">Eastern Teams</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-400"><strong>{west.length}</strong></p>
            <p className="text-sm text-[var(--text-secondary)]">Western Teams</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {east[0]?.name?.split(' ').pop() || '-'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">East Leader</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {west[0]?.name?.split(' ').pop() || '-'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">West Leader</p>
          </div>
        </section>

        {/* Source Footer */}
        <footer role="contentinfo" className="mt-8 text-center">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 text-sm transition-colors min-h-[44px]"
          >
            <span aria-hidden="true">📊</span> View full standings on ESPN <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}
