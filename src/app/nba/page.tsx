// NBA Arena - Live NBA scoreboard and games
// Uses live ESPN data with REAL-TIME updates via SSE

import { Suspense } from 'react';
import Link from 'next/link';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { GameChatWidget } from '@/components/ai/GameChatWidget';
import { ChevronLeft, Calendar, TrendingUp, ExternalLink, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { fetchLiveScores, fetchScoresByDate, type LiveGameData } from '@/services/nba/live-data';
import { LiveScoreboard } from '@/components/games/LiveScoreboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function StaticGameCard({ game }: { game: LiveGameData & { displayDate?: string } }) {
  const isLive = game.status === 'live' || game.status === 'halftime';
  const isFinal = game.status === 'final';

  const statusLabel = isLive
    ? `Live - Quarter ${game.period}, ${game.clock}`
    : game.status === 'halftime'
    ? 'Halftime'
    : isFinal
    ? 'Final'
    : game.clock || 'Scheduled';

  return (
    <Link
      href={`/nba/games/${game.gameId}`}
      className={`glass rounded-xl p-4 card-hover block transition-all hover:scale-[1.02] hover:shadow-xl ${isLive ? 'live-pulse' : ''}`}
      aria-label={`${game.awayTeam.name} ${game.awayTeam.score} at ${game.homeTeam.name} ${game.homeTeam.score}, ${statusLabel}`}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
          isLive ? 'bg-red-500/20 text-red-400' :
          isFinal ? 'bg-white/10 text-[var(--text-secondary)]' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {isLive && <span aria-hidden="true">🔴</span>}
          {isFinal && <span aria-hidden="true">✓</span>}
          {!isLive && !isFinal && <span aria-hidden="true">⏰</span>}
          <span>
            {isLive ? `Q${game.period} ${game.clock}` :
             game.status === 'halftime' ? 'HALFTIME' :
             isFinal ? 'FINAL' :
             game.clock || 'Scheduled'}
          </span>
        </span>
        {game.broadcast && (
          <span className="text-xs text-[var(--text-muted)]">{game.broadcast}</span>
        )}
      </div>

      {/* Away Team */}
      <div className={`flex items-center justify-between py-2 ${
        isFinal && game.awayTeam.score > game.homeTeam.score ? 'opacity-100' : isFinal ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-3">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`}
            alt=""
            width={40}
            height={40}
            className="object-contain"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{game.awayTeam.abbreviation}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{game.awayTeam.record}</p>
          </div>
        </div>
        <strong className={`text-2xl font-bold tabular-nums ${
          isFinal && game.awayTeam.score > game.homeTeam.score ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
        }`} aria-label={`${game.awayTeam.name} score: ${game.awayTeam.score}`}>
          {game.awayTeam.score}
        </strong>
      </div>

      {/* Home Team */}
      <div className={`flex items-center justify-between py-2 ${
        isFinal && game.homeTeam.score > game.awayTeam.score ? 'opacity-100' : isFinal ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-3">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`}
            alt=""
            width={40}
            height={40}
            className="object-contain"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{game.homeTeam.abbreviation}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{game.homeTeam.record}</p>
          </div>
        </div>
        <strong className={`text-2xl font-bold tabular-nums ${
          isFinal && game.homeTeam.score > game.awayTeam.score ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
        }`} aria-label={`${game.homeTeam.name} score: ${game.homeTeam.score}`}>
          {game.homeTeam.score}
        </strong>
      </div>

      {/* Venue */}
      {game.venue && (
        <p className="text-xs text-[var(--text-muted)] mt-2 text-center">{game.venue}</p>
      )}

      <div className="mt-3 pt-3 border-t border-white/10 text-center">
        <span className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          View full stats & analytics →
        </span>
      </div>
    </Link>
  );
}

function GameCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-20 mb-3"></div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
            <div className="space-y-1">
              <div className="h-4 bg-white/10 rounded w-12"></div>
              <div className="h-3 bg-white/10 rounded w-8"></div>
            </div>
          </div>
          <div className="h-8 bg-white/10 rounded w-8"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
            <div className="space-y-1">
              <div className="h-4 bg-white/10 rounded w-12"></div>
              <div className="h-3 bg-white/10 rounded w-8"></div>
            </div>
          </div>
          <div className="h-8 bg-white/10 rounded w-8"></div>
        </div>
      </div>
    </div>
  );
}

export default async function NBAPage() {
  const { games: todayGames, lastUpdated, source, sourceUrl } = await fetchLiveScores();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDateStr = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

  const [tomorrowData, dayAfterData] = await Promise.all([
    fetchScoresByDate(formatDateStr(tomorrow)),
    fetchScoresByDate(formatDateStr(dayAfter)),
  ]);

  const tomorrowGames = tomorrowData.games.map(g => ({ ...g, displayDate: 'Tomorrow' }));
  const dayAfterGames = dayAfterData.games.map(g => ({
    ...g,
    displayDate: dayAfter.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }));

  const displayDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const liveGames = todayGames.filter(g => g.status === 'live' || g.status === 'halftime');
  const liveGameInfos = liveGames.map(game => ({
    id: game.gameId,
    externalId: game.gameId,
    homeTeam: {
      id: game.homeTeam.abbreviation,
      externalId: game.homeTeam.abbreviation,
      name: game.homeTeam.name,
      fullName: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      city: '',
      conference: '',
      division: '',
      logoUrl: `https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`,
      primaryColor: null,
      secondaryColor: null,
    },
    awayTeam: {
      id: game.awayTeam.abbreviation,
      externalId: game.awayTeam.abbreviation,
      name: game.awayTeam.name,
      fullName: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      city: '',
      conference: '',
      division: '',
      logoUrl: `https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`,
      primaryColor: null,
      secondaryColor: null,
    },
    homeScore: game.homeTeam.score,
    awayScore: game.awayTeam.score,
    status: 'LIVE' as const,
    period: game.period,
    gameClock: game.clock,
    scheduledAt: new Date(),
    venue: game.venue || null,
    nationalTv: game.broadcast || null,
  }));

  return (
    <div className="min-h-screen">
      <NBAHeader />

      <main id="main-content" className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back to Hub
          </Link>
        </nav>

        {/* Hero */}
        <section className="text-center space-y-4 py-8 animate-fade-in" aria-labelledby="nba-heading">
          <div className="text-5xl" aria-hidden="true">🏀</div>
          <h1 id="nba-heading" className="text-4xl md:text-5xl font-bold">
            <span className="font-display text-5xl md:text-6xl tracking-wide gradient-text-orange">NBA</span>
            <span className="text-[var(--text-primary)]"> Arena</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            <span className="text-green-400 font-semibold">REAL-TIME</span> scores, live clock, and AI-powered insights
          </p>

          {/* Date display */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <time dateTime={today.toISOString().split('T')[0]} className="text-lg text-[var(--text-secondary)]">
              {displayDate}
            </time>
            <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full font-medium">
              Today
            </span>
          </div>

          {/* Live status bar */}
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-[var(--text-tertiary)]" role="status" aria-live="polite">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Live updates from {source}</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              aria-label={`View source data on ${source} (opens in new tab)`}
            >
              View Source <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/nba/calendar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors min-h-[44px]"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Full Schedule
            </Link>
            <Link
              href="/nba/standings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors min-h-[44px]"
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              Standings
            </Link>
          </div>
        </section>

        {/* Today's Games */}
        <section className="mb-12" aria-labelledby="todays-games">
          <div className="flex items-center justify-between mb-4">
            <h2 id="todays-games" className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              Today&apos;s Games
              <span className="text-xs font-normal px-2 py-1 bg-green-500/20 text-green-400 rounded-full inline-flex items-center gap-1">
                <span aria-hidden="true">⚡</span> Real-Time Updates
              </span>
            </h2>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
            </div>
          }>
            <LiveScoreboard initialGames={todayGames} />
          </Suspense>
        </section>

        {/* Tomorrow's Games */}
        {tomorrowGames.length > 0 && (
          <section className="mb-8" aria-labelledby="tomorrow-games">
            <div className="flex items-center justify-between mb-4">
              <h2 id="tomorrow-games" className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
                Tomorrow
              </h2>
              <span className="text-sm text-[var(--text-muted)]">{tomorrowGames.length} games</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tomorrowGames.map((game) => (
                <StaticGameCard key={game.gameId} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Day After Tomorrow */}
        {dayAfterGames.length > 0 && (
          <section className="mb-8" aria-labelledby="dayafter-games">
            <div className="flex items-center justify-between mb-4">
              <h2 id="dayafter-games" className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
                {dayAfterGames[0]?.displayDate || 'Upcoming'}
              </h2>
              <span className="text-sm text-[var(--text-muted)]">{dayAfterGames.length} games</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayAfterGames.map((game) => (
                <StaticGameCard key={game.gameId} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* View Full Calendar */}
        <div className="text-center mb-8">
          <Link
            href="/nba/calendar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 text-[var(--text-primary)] font-medium hover:from-orange-500/30 hover:to-purple-500/30 transition-all min-h-[48px]"
          >
            <Calendar className="w-5 h-5" aria-hidden="true" />
            View Full Month Calendar
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Empty state */}
        {todayGames.length === 0 && tomorrowGames.length === 0 && (
          <div className="text-center py-16 space-y-6 animate-fade-in">
            <div className="text-6xl" aria-hidden="true">🏀</div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">No games today</h2>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                Check out the calendar for upcoming matchups or view the full schedule on ESPN.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                href="/nba/calendar"
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors min-h-[48px] inline-flex items-center"
              >
                View Full Calendar
              </Link>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[var(--text-primary)] font-medium transition-colors flex items-center gap-2 min-h-[48px]"
              >
                ESPN Scoreboard <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}

        {/* Source footer */}
        <div className="mt-8 text-center">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 text-sm transition-colors min-h-[44px]"
            aria-label={`View full scoreboard on ESPN (opens in new tab)`}
          >
            View full scoreboard on ESPN <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        {/* Floating AI Chat Widget */}
        {liveGameInfos.length > 0 && (
          <GameChatWidget games={liveGameInfos} sport="NBA" />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-[var(--text-tertiary)] text-sm">
          <p>
            <strong className="text-[var(--text-secondary)] font-semibold">Playmaker</strong> — NBA Arena
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Real-time data from {source}. Not affiliated with the NBA.
          </p>
        </div>
      </footer>
    </div>
  );
}
