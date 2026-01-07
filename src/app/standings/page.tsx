// Standings Page - League standings across all sports
// Uses live ESPN data for accurate, up-to-date standings

import Link from 'next/link';
import { ChevronLeft, Trophy, RefreshCw, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { fetchStandings } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

function TeamLogo({ abbreviation, name, size = 32 }: { abbreviation: string; name: string; size?: number }) {
  return (
    <Image
      src={`https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation.toLowerCase()}.png`}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      unoptimized
    />
  );
}

interface PageProps {
  searchParams: Promise<{ sport?: string }>;
}

export default async function StandingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sport = params.sport || 'nba';

  // Fetch LIVE standings from ESPN
  const standingsData = await fetchStandings();
  const { east: eastTeams, west: westTeams, source, sourceUrl } = standingsData;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 glass-dark">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-black gradient-text">Playmaker</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-white/60 hover:text-white text-sm">Hub</Link>
            <Link href="/nba" className="text-white/60 hover:text-white text-sm">NBA</Link>
            <Link href="/calendar" className="text-white/60 hover:text-white text-sm">Calendar</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Hub
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">League Standings</h1>
          <p className="text-white/60">Current season standings • Live data</p>
          
          {/* Source attribution */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-white/50">
            <RefreshCw className="w-4 h-4" />
            <span>Data from {source}</span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Sport Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {['nba', 'nfl', 'mlb', 'ncaa'].map((s) => (
            <Link
              key={s}
              href={`/standings?sport=${s}`}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                sport === s
                  ? 'bg-gradient-to-r from-orange-500 to-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {s.toUpperCase()}
            </Link>
          ))}
        </div>

        {/* NBA Standings */}
        {sport === 'nba' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Eastern Conference */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-blue-500/10 border-b border-white/10">
                <h2 className="text-lg font-bold text-blue-400">Eastern Conference</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-white/50 border-b border-white/10">
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Team</th>
                      <th className="text-center p-3">W</th>
                      <th className="text-center p-3">L</th>
                      <th className="text-center p-3">PCT</th>
                      <th className="text-center p-3">GB</th>
                      <th className="text-center p-3">STRK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eastTeams.length > 0 ? (
                      eastTeams.map((team, i) => (
                        <tr key={team.abbreviation} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white/50 text-sm">{i + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <TeamLogo abbreviation={team.abbreviation} name={team.name} />
                              <div>
                                <p className="font-medium text-white">{team.name}</p>
                                <p className="text-xs text-white/40">{team.division}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center text-white font-medium">{team.wins}</td>
                          <td className="p-3 text-center text-white/60">{team.losses}</td>
                          <td className="p-3 text-center text-white/60">{team.winPct}</td>
                          <td className="p-3 text-center text-white/40">{team.gamesBehind}</td>
                          <td className="p-3 text-center text-white/40">{team.streak || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-white/40">
                          Loading standings data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Western Conference */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-orange-500/10 border-b border-white/10">
                <h2 className="text-lg font-bold text-orange-400">Western Conference</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-white/50 border-b border-white/10">
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Team</th>
                      <th className="text-center p-3">W</th>
                      <th className="text-center p-3">L</th>
                      <th className="text-center p-3">PCT</th>
                      <th className="text-center p-3">GB</th>
                      <th className="text-center p-3">STRK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {westTeams.length > 0 ? (
                      westTeams.map((team, i) => (
                        <tr key={team.abbreviation} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white/50 text-sm">{i + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <TeamLogo abbreviation={team.abbreviation} name={team.name} />
                              <div>
                                <p className="font-medium text-white">{team.name}</p>
                                <p className="text-xs text-white/40">{team.division}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center text-white font-medium">{team.wins}</td>
                          <td className="p-3 text-center text-white/60">{team.losses}</td>
                          <td className="p-3 text-center text-white/60">{team.winPct}</td>
                          <td className="p-3 text-center text-white/40">{team.gamesBehind}</td>
                          <td className="p-3 text-center text-white/40">{team.streak || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-white/40">
                          Loading standings data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other sports placeholder */}
        {sport !== 'nba' && (
          <div className="text-center py-16 glass rounded-2xl">
            <p className="text-6xl mb-4">🏗️</p>
            <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-white/60">
              {sport.toUpperCase()} standings will be available soon!
            </p>
          </div>
        )}

        {/* Source footer */}
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
