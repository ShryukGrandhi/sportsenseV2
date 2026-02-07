// NBA Teams Page - All NBA teams overview

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Users, ExternalLink } from 'lucide-react';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { fetchAllTeams, type ESPNTeam } from '@/services/nba/espn-api';
import { fetchStandings } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

// NBA team conference/division mapping
const TEAM_DIVISIONS: Record<string, { conference: string; division: string }> = {
  'BOS': { conference: 'East', division: 'Atlantic' },
  'BKN': { conference: 'East', division: 'Atlantic' },
  'NYK': { conference: 'East', division: 'Atlantic' },
  'PHI': { conference: 'East', division: 'Atlantic' },
  'TOR': { conference: 'East', division: 'Atlantic' },
  'CHI': { conference: 'East', division: 'Central' },
  'CLE': { conference: 'East', division: 'Central' },
  'DET': { conference: 'East', division: 'Central' },
  'IND': { conference: 'East', division: 'Central' },
  'MIL': { conference: 'East', division: 'Central' },
  'ATL': { conference: 'East', division: 'Southeast' },
  'CHA': { conference: 'East', division: 'Southeast' },
  'MIA': { conference: 'East', division: 'Southeast' },
  'ORL': { conference: 'East', division: 'Southeast' },
  'WAS': { conference: 'East', division: 'Southeast' },
  'DEN': { conference: 'West', division: 'Northwest' },
  'MIN': { conference: 'West', division: 'Northwest' },
  'OKC': { conference: 'West', division: 'Northwest' },
  'POR': { conference: 'West', division: 'Northwest' },
  'UTA': { conference: 'West', division: 'Northwest' },
  'GSW': { conference: 'West', division: 'Pacific' },
  'LAC': { conference: 'West', division: 'Pacific' },
  'LAL': { conference: 'West', division: 'Pacific' },
  'PHX': { conference: 'West', division: 'Pacific' },
  'SAC': { conference: 'West', division: 'Pacific' },
  'DAL': { conference: 'West', division: 'Southwest' },
  'HOU': { conference: 'West', division: 'Southwest' },
  'MEM': { conference: 'West', division: 'Southwest' },
  'NOP': { conference: 'West', division: 'Southwest' },
  'NO': { conference: 'West', division: 'Southwest' },
  'SAS': { conference: 'West', division: 'Southwest' },
  'SA': { conference: 'West', division: 'Southwest' },
};

function TeamCard({ team, record }: { team: ESPNTeam; record?: string }) {
  const division = TEAM_DIVISIONS[team.abbreviation];

  return (
    <Link
      href={`/nba/teams/${team.id}`}
      className="glass rounded-xl p-6 hover:bg-white/5 transition-all hover:scale-[1.02] group min-h-[44px]"
      aria-label={`${team.displayName}${record ? `, record: ${record}` : ''}`}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
          style={{ backgroundColor: team.color ? `#${team.color}22` : 'rgba(255,255,255,0.05)' }}
        >
          <Image
            src={team.logo}
            alt={`${team.displayName} logo`}
            width={60}
            height={60}
            className="object-contain"
            unoptimized
          />
        </div>

        <h3 className="font-bold text-[var(--text-primary)] text-lg">{team.name}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{team.displayName}</p>

        {record && (
          <p className="text-sm text-[var(--text-tertiary)] mt-2">{record}</p>
        )}

        {division && (
          <div className="mt-3 flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              division.conference === 'East' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {division.conference}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-[var(--text-secondary)]">
              {division.division}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function NBATeamsPage() {
  const [teams, standings] = await Promise.all([
    fetchAllTeams().catch(() => [] as ESPNTeam[]),
    fetchStandings().catch(() => ({ east: [], west: [], source: 'ESPN', sourceUrl: '' })),
  ]);

  // Create record lookup from standings
  const recordLookup: Record<string, string> = {};
  [...standings.east, ...standings.west].forEach(team => {
    recordLookup[team.abbreviation] = `${team.wins}-${team.losses}`;
  });

  // Separate teams by conference
  const eastTeams = teams.filter(t => TEAM_DIVISIONS[t.abbreviation]?.conference === 'East');
  const westTeams = teams.filter(t => TEAM_DIVISIONS[t.abbreviation]?.conference === 'West');

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
            <Users className="w-10 h-10 text-orange-400" aria-hidden="true" />
          </div>
          <h1 id="page-title" className="text-4xl md:text-5xl font-bold mb-2 font-display">
            <span className="gradient-text-orange">NBA</span>
            <span className="text-[var(--text-primary)]"> TEAMS</span>
          </h1>
          <p className="text-[var(--text-secondary)]">All 30 NBA franchises</p>
        </div>

        {/* Eastern Conference */}
        <section aria-labelledby="east-conf-heading" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" aria-hidden="true" />
            <h2 id="east-conf-heading" className="text-xl font-bold text-blue-400">Eastern Conference</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {eastTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                record={recordLookup[team.abbreviation]}
              />
            ))}
          </div>
        </section>

        {/* Western Conference */}
        <section aria-labelledby="west-conf-heading" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" aria-hidden="true" />
            <h2 id="west-conf-heading" className="text-xl font-bold text-orange-400">Western Conference</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-orange-500/50 to-transparent" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {westTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                record={recordLookup[team.abbreviation]}
              />
            ))}
          </div>
        </section>

        {/* Stats */}
        <section aria-labelledby="team-stats-heading" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <h2 id="team-stats-heading" className="sr-only">Team Statistics</h2>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--text-primary)]">{teams.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Total Teams</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{eastTeams.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Eastern</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{westTeams.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Western</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">6</p>
            <p className="text-sm text-[var(--text-secondary)]">Divisions</p>
          </div>
        </section>

        {/* Source Footer */}
        <footer role="contentinfo" className="mt-8 text-center">
          <a
            href="https://www.espn.com/nba/teams"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 text-sm transition-colors min-h-[44px]"
          >
            <span aria-hidden="true">📊</span> View on ESPN <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}
