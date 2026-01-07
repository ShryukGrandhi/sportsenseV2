// NBA Calendar Page - Full Month Calendar View (Google Calendar Style)

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink } from 'lucide-react';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { fetchScoresByDate, fetchScoresForDateRange, type LiveGameData } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes since calendar data doesn't change frequently

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
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
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`}
            alt={game.awayTeam.abbreviation}
            width={14}
            height={14}
            className="object-contain flex-shrink-0"
            unoptimized
          />
          <span className={`truncate ${isFinal && game.awayTeam.score > game.homeTeam.score ? 'font-bold text-white' : 'text-white/70'}`}>
            {game.awayTeam.abbreviation}
          </span>
        </div>
        <span className="text-white/60 tabular-nums">{game.awayTeam.score}</span>
      </div>
      <div className="flex items-center justify-between gap-1 mt-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`}
            alt={game.homeTeam.abbreviation}
            width={14}
            height={14}
            className="object-contain flex-shrink-0"
            unoptimized
          />
          <span className={`truncate ${isFinal && game.homeTeam.score > game.awayTeam.score ? 'font-bold text-white' : 'text-white/70'}`}>
            {game.homeTeam.abbreviation}
          </span>
        </div>
        <span className="text-white/60 tabular-nums">{game.homeTeam.score}</span>
      </div>
      {isLive && (
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="relative flex h-1.5 w-1.5">
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
  
  return (
    <div 
      className={`min-h-[120px] border border-white/5 p-1 transition-colors ${
        isCurrentMonth 
          ? 'bg-white/[0.02]' 
          : 'bg-black/20'
      } ${isToday ? 'ring-2 ring-orange-500/50 ring-inset' : ''} ${
        hasGames ? 'hover:bg-white/[0.04]' : ''
      }`}
    >
      <div className={`flex items-center justify-between mb-1 px-1`}>
        <span className={`text-sm font-medium ${
          isToday 
            ? 'text-orange-400 font-bold' 
            : isCurrentMonth 
              ? 'text-white/80' 
              : 'text-white/30'
        }`}>
          {dayNumber}
        </span>
        {liveGames.length > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-[10px] text-red-400">
            <span className="relative flex h-1.5 w-1.5">
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
          <p className="text-[10px] text-white/40 text-center py-0.5">
            +{games.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}

export default async function NBACalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Get current date or from params
  const today = new Date();
  const year = params.year ? parseInt(params.year) : today.getFullYear();
  const month = params.month ? parseInt(params.month) - 1 : today.getMonth(); // 0-indexed
  
  // Calculate month boundaries
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Get all days to display
  const calendarDays = getMonthDays(year, month);
  
  // Fetch games for the entire month
  const allGames: GameWithDate[] = [];
  
  // Fetch games for each day that's visible in the calendar
  const startDate = calendarDays[0];
  const endDate = calendarDays[calendarDays.length - 1];
  
  // Batch fetch by fetching one week at a time
  const promises: Promise<void>[] = [];
  const gamesByDate = new Map<string, LiveGameData[]>();
  
  // We'll fetch games day by day for accuracy (ESPN API doesn't support date ranges well)
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const dateKey = d.toISOString().split('T')[0];
    
    promises.push(
      fetchScoresByDate(dateStr).then(({ games }) => {
        gamesByDate.set(dateKey, games);
      }).catch(() => {
        gamesByDate.set(dateKey, []);
      })
    );
  }
  
  // Wait for all fetches (with a reasonable timeout approach - fetch in batches)
  await Promise.all(promises);
  
  // Navigation
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;
  
  const monthName = firstDayOfMonth.toLocaleDateString('en-US', { month: 'long' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count total games this month
  let totalGames = 0;
  let liveGames = 0;
  gamesByDate.forEach((games) => {
    totalGames += games.length;
    liveGames += games.filter(g => g.status === 'live' || g.status === 'halftime').length;
  });

  return (
    <div className="min-h-screen">
      <NBAHeader />
      
      <main className="container mx-auto px-4 py-6">
        <Link 
          href="/nba"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Scoreboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-10 h-10 text-orange-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">{monthName} {year}</h1>
              <p className="text-white/60 text-sm">
                {totalGames} games this month
                {liveGames > 0 && (
                  <span className="ml-2 text-red-400">• {liveGames} LIVE</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href={`/nba/calendar?month=${prevMonth}&year=${prevYear}`}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            
            <Link
              href="/nba/calendar"
              className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 font-medium text-sm transition-colors"
            >
              Today
            </Link>
            
            <Link
              href={`/nba/calendar?month=${nextMonth}&year=${nextYear}`}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 bg-white/5 border-b border-white/10">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center">
                <span className="text-sm font-medium text-white/60">{day}</span>
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

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></div>
            <span className="text-white/60">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20"></div>
            <span className="text-white/60">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/10"></div>
            <span className="text-white/60">Final</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded ring-2 ring-orange-500/50"></div>
            <span className="text-white/60">Today</span>
          </div>
        </div>

        {/* Source Footer */}
        <div className="mt-8 text-center">
          <a 
            href="https://www.espn.com/nba/schedule"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            📊 View Full Schedule on ESPN <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
