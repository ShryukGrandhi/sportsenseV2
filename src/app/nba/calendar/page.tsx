// NBA Calendar Page - Week and Month Calendar Views
// Default: Shows the previous 7 days with clear date headers

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink, LayoutGrid, List } from 'lucide-react';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { fetchScoresByDate, fetchScoresForDateRange, type LiveGameData } from '@/services/nba/live-data';
import { WeekView, type WeekViewGame } from '@/components/calendar/WeekView';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes since calendar data doesn't change frequently

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string; view?: 'week' | 'month' }>;
}

interface GameWithDate extends LiveGameData {
  date?: string;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay(); // 0 = Sunday
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add padding days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function GameMiniCard({ game }: { game: LiveGameData }) {
  const isLive = game.status === 'live' || game.status === 'halftime';
  const isFinal = game.status === 'final';

  return (
    <Link
      href={`/nba/games/${game.gameId}`}
      className={`block p-1.5 rounded-lg text-xs transition-all hover:scale-105 ${
        isLive
          ? 'bg-red-500/20 border border-red-500/30 hover:bg-red-500/30'
          : isFinal
            ? 'bg-white/5 hover:bg-white/10'
            : 'bg-blue-500/10 hover:bg-blue-500/20'
      }`}
      aria-label={`${game.awayTeam.abbreviation} ${game.awayTeam.score} at ${game.homeTeam.abbreviation} ${game.homeTeam.score}${isLive ? ', live' : isFinal ? ', final' : ''}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`}
            alt={`${game.awayTeam.abbreviation} logo`}
            width={14}
            height={14}
            className="object-contain flex-shrink-0"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className={`truncate ${isFinal && game.awayTeam.score > game.homeTeam.score ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {game.awayTeam.abbreviation}
          </span>
        </div>
        <span className="text-[var(--text-secondary)] tabular-nums">{game.awayTeam.score}</span>
      </div>
      <div className="flex items-center justify-between gap-1 mt-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`}
            alt={`${game.homeTeam.abbreviation} logo`}
            width={14}
            height={14}
            className="object-contain flex-shrink-0"
            unoptimized
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className={`truncate ${isFinal && game.homeTeam.score > game.awayTeam.score ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {game.homeTeam.abbreviation}
          </span>
        </div>
        <span className="text-[var(--text-secondary)] tabular-nums">{game.homeTeam.score}</span>
      </div>
      {isLive && (
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] text-red-400 font-medium">Q{game.period}</span>
        </div>
      )}
      {!isLive && !isFinal && (
        <div className="text-center mt-0.5">
          <span className="text-[10px] text-blue-400">{game.clock || 'TBD'}</span>
        </div>
      )}
    </Link>
  );
}

function DayCell({
  date,
  games,
  isCurrentMonth,
  isToday
}: {
  date: Date;
  games: LiveGameData[];
  isCurrentMonth: boolean;
  isToday: boolean;
}) {
  const dayNumber = date.getDate();
  const hasGames = games.length > 0;
  const liveGames = games.filter(g => g.status === 'live' || g.status === 'halftime');
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const gamesDescription = hasGames ? `, ${games.length} game${games.length > 1 ? 's' : ''}` : ', no games';

  return (
    <div
      role="gridcell"
      aria-label={`${dateLabel}${gamesDescription}`}
      {...(isToday ? { 'aria-current': 'date' as const } : {})}
      className={`min-h-[120px] border border-white/5 p-1 transition-colors ${
        isCurrentMonth
          ? 'bg-white/[0.02]'
          : 'bg-black/20'
      } ${isToday ? 'ring-2 ring-orange-500/50 ring-inset' : ''} ${
        hasGames ? 'hover:bg-white/[0.04]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1 px-1">
        <span className={`text-sm font-medium ${
          isToday
            ? 'text-orange-400 font-bold'
            : isCurrentMonth
              ? 'text-[var(--text-primary)]/80'
              : 'text-[var(--text-muted)]'
        }`}>
          {dayNumber}
        </span>
        {liveGames.length > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-[10px] text-red-400">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-1 overflow-y-auto max-h-[90px]">
        {games.slice(0, 3).map(game => (
          <GameMiniCard key={game.gameId} game={game} />
        ))}
        {games.length > 3 && (
          <p className="text-[10px] text-[var(--text-tertiary)] text-center py-0.5">
            +{games.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}

export default async function NBACalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Get view mode (default to 'week' per requirements)
  const view = params.view || 'week';

  // Get current date or from params
  const today = new Date();
  const year = params.year ? parseInt(params.year) : today.getFullYear();
  const month = params.month ? parseInt(params.month) - 1 : today.getMonth(); // 0-indexed

  // Calculate date ranges based on view
  const gamesByDate = new Map<string, LiveGameData[]>();

  if (view === 'week') {
    // Fetch last 7 days for week view
    const weekPromises: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const dateKey = date.toISOString().split('T')[0];

      weekPromises.push(
        fetchScoresByDate(dateStr).then(({ games }) => {
          gamesByDate.set(dateKey, games);
        }).catch(() => {
          gamesByDate.set(dateKey, []);
        })
      );
    }
    await Promise.all(weekPromises);
  } else {
    // Calculate month boundaries for month view
    const calendarDays = getMonthDays(year, month);
    const startDate = calendarDays[0];
    const endDate = calendarDays[calendarDays.length - 1];

    // Fetch games for each day in the month
    const monthPromises: Promise<void>[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
      const dateKey = d.toISOString().split('T')[0];

      monthPromises.push(
        fetchScoresByDate(dateStr).then(({ games }) => {
          gamesByDate.set(dateKey, games);
        }).catch(() => {
          gamesByDate.set(dateKey, []);
        })
      );
    }
    await Promise.all(monthPromises);
  }

  // Calculate month boundaries for header/navigation
  const firstDayOfMonth = new Date(year, month, 1);
  const calendarDays = getMonthDays(year, month);

  // Navigation
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;

  const monthName = firstDayOfMonth.toLocaleDateString('en-US', { month: 'long' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count total games
  let totalGames = 0;
  let liveGames = 0;
  gamesByDate.forEach((games) => {
    totalGames += games.length;
    liveGames += games.filter(g => g.status === 'live' || g.status === 'halftime').length;
  });

  // Convert Map to Record for WeekView component
  const gamesByDateRecord: Record<string, WeekViewGame[]> = {};
  gamesByDate.forEach((games, key) => {
    gamesByDateRecord[key] = games.map(g => ({
      gameId: g.gameId,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      status: g.status,
      venue: g.venue,
      broadcast: g.broadcast,
      clock: g.clock,
      period: g.period,
    }));
  });

  return (
    <div className="min-h-screen">
      <NBAHeader />

      <main id="main-content" className="container mx-auto px-4 py-6">
        <Link
          href="/nba"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-6 transition-colors min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to Scoreboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-10 h-10 text-orange-400" aria-hidden="true" />
            <div>
              <h1 id="page-title" className="text-3xl font-bold text-[var(--text-primary)] font-display">
                {view === 'week' ? 'THIS WEEK' : `${monthName.toUpperCase()} ${year}`}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {totalGames} games {view === 'week' ? 'this week' : 'this month'}
                {liveGames > 0 && (
                  <span className="ml-2 text-red-400">• {liveGames} LIVE</span>
                )}
              </p>
            </div>
          </div>

          {/* View Toggle + Navigation */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg p-1" role="group" aria-label="View mode">
              <Link
                href="/nba/calendar?view=week"
                className={`p-2 rounded-md flex items-center gap-1.5 text-sm transition-colors min-h-[44px] ${
                  view === 'week'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="Week view"
              >
                <List className="w-4 h-4" aria-hidden="true" />
                Week
              </Link>
              <Link
                href={`/nba/calendar?view=month&month=${month + 1}&year=${year}`}
                className={`p-2 rounded-md flex items-center gap-1.5 text-sm transition-colors min-h-[44px] ${
                  view === 'month'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="Month view"
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                Month
              </Link>
            </div>

            {/* Month Navigation (only for month view) */}
            {view === 'month' && (
              <nav aria-label="Calendar navigation" className="flex items-center gap-2">
                <Link
                  href={`/nba/calendar?view=month&month=${prevMonth}&year=${prevYear}`}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Link>

                <Link
                  href="/nba/calendar?view=month"
                  className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 font-medium text-sm transition-colors min-h-[44px] flex items-center"
                  aria-label="Go to current month"
                >
                  Today
                </Link>

                <Link
                  href={`/nba/calendar?view=month&month=${nextMonth}&year=${nextYear}`}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </nav>
            )}
          </div>
        </div>

        {/* Week View (default) */}
        {view === 'week' && (
          <WeekView gamesByDate={gamesByDateRecord} />
        )}

        {/* Month Calendar Grid */}
        {view === 'month' && (
          <div className="glass rounded-2xl overflow-hidden" role="grid" aria-label={`${monthName} ${year} NBA schedule`}>
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 bg-white/5 border-b border-white/10" role="row">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center" role="columnheader">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, idx) => {
                const dateKey = formatDateKey(date);
                const games = gamesByDate.get(dateKey) || [];
                const isCurrentMonth = date.getMonth() === month;
                const isToday = formatDateKey(date) === formatDateKey(today);

                return (
                  <DayCell
                    key={idx}
                    date={date}
                    games={games}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Legend (month view only) */}
        {view === 'month' && (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" aria-hidden="true"></div>
              <span className="text-[var(--text-secondary)]">Live</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20" aria-hidden="true"></div>
              <span className="text-[var(--text-secondary)]">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white/10" aria-hidden="true"></div>
              <span className="text-[var(--text-secondary)]">Final</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded ring-2 ring-orange-500/50" aria-hidden="true"></div>
              <span className="text-[var(--text-secondary)]">Today</span>
            </div>
          </div>
        )}

        {/* Source Footer */}
        <footer role="contentinfo" className="mt-8 text-center">
          <a
            href="https://www.espn.com/nba/schedule"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 text-sm transition-colors min-h-[44px]"
          >
            <span aria-hidden="true">📊</span> View Full Schedule on ESPN <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}
