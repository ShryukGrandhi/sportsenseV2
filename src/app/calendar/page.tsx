// Calendar Page - All sports schedule with filtering
// Uses live ESPN data for current games and fetches multiple days

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, RefreshCw, ExternalLink, Calendar } from 'lucide-react';
import Image from 'next/image';
import { fetchLiveScores, fetchScoresForDateRange, type LiveGameData } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string; sport?: string }>;
}

function GameCard({ game }: { game: LiveGameData }) {
  const isLive = game.status === 'live' || game.status === 'halftime';
  const isFinal = game.status === 'final';
  
  return (
    <div className={`glass rounded-xl p-3 ${isLive ? 'ring-1 ring-red-500/50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isLive ? 'bg-red-500/20 text-red-400' :
          isFinal ? 'bg-white/10 text-white/60' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {isLive ? `Q${game.period} ${game.clock}` :
           game.status === 'halftime' ? 'HALFTIME' :
           isFinal ? 'FINAL' :
           game.clock || 'Scheduled'}
        </span>
        {game.broadcast && (
          <span className="text-[10px] text-white/40">{game.broadcast}</span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`}
              alt={game.awayTeam.name}
              width={24}
              height={24}
              className="object-contain"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-sm text-white font-medium">{game.awayTeam.abbreviation}</span>
          </div>
          <span className="text-lg font-bold text-white">{game.awayTeam.score}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`}
              alt={game.homeTeam.name}
              width={24}
              height={24}
              className="object-contain"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-sm text-white font-medium">{game.homeTeam.abbreviation}</span>
          </div>
          <span className="text-lg font-bold text-white">{game.homeTeam.score}</span>
        </div>
      </div>
    </div>
  );
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth();
  const sportFilter = params.sport || 'all';

  // Fetch games for the next 14 days using the date range function
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 3); // Include past 3 days
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // Include next 14 days

  // Fetch all games in the date range
  const allGames = await fetchScoresForDateRange(startDate, endDate);
  const source = 'ESPN';
  const sourceUrl = 'https://www.espn.com/nba/schedule';
  
  // Filter by sport if specified
  const filteredGames = sportFilter === 'all' || sportFilter === 'nba'
    ? allGames 
    : [];

  const monthName = new Date(year, month).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Navigation URLs
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  // Group games by status
  const liveNow = filteredGames.filter(g => g.status === 'live' || g.status === 'halftime');
  const upcoming = filteredGames.filter(g => g.status === 'scheduled');
  const completed = filteredGames.filter(g => g.status === 'final');
  
  // Group upcoming games by date
  const upcomingByDate = new Map<string, (LiveGameData & { date?: string })[]>();
  upcoming.forEach(game => {
    const gameWithDate = game as LiveGameData & { date?: string };
    const dateKey = gameWithDate.date || 'Unknown';
    if (!upcomingByDate.has(dateKey)) {
      upcomingByDate.set(dateKey, []);
    }
    upcomingByDate.get(dateKey)?.push(gameWithDate);
  });
  
  // Group completed games by date
  const completedByDate = new Map<string, (LiveGameData & { date?: string })[]>();
  completed.forEach(game => {
    const gameWithDate = game as LiveGameData & { date?: string };
    const dateKey = gameWithDate.date || 'Unknown';
    if (!completedByDate.has(dateKey)) {
      completedByDate.set(dateKey, []);
    }
    completedByDate.get(dateKey)?.push(gameWithDate);
  });
  
  // Sort dates
  const sortedUpcomingDates = Array.from(upcomingByDate.keys()).sort();
  const sortedCompletedDates = Array.from(completedByDate.keys()).sort().reverse(); // Most recent first
  
  // Format date for display
  const formatDateStr = (dateStr: string) => {
    if (dateStr === 'Unknown') return 'Date TBD';
    // Handle both YYYY-MM-DD and YYYYMMDD formats
    let year, monthNum, day;
    if (dateStr.includes('-')) {
      [year, monthNum, day] = dateStr.split('-');
    } else {
      year = dateStr.substring(0, 4);
      monthNum = dateStr.substring(4, 6);
      day = dateStr.substring(6, 8);
    }
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Generate calendar days for the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  
  const days: Date[] = [];
  
  // Add days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

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
            <Link href="/standings" className="text-white/60 hover:text-white text-sm">Standings</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Hub
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Game Calendar</h1>
          <p className="text-white/60">Showing games for the next 2 weeks • Live data from ESPN</p>
          
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

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/calendar?year=${prevYear}&month=${prevMonth}&sport=${sportFilter}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Link>
          
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          
          <Link
            href={`/calendar?year=${nextYear}&month=${nextMonth}&sport=${sportFilter}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Sport Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-white/40" />
          {['all', 'nba', 'nfl', 'mlb', 'ncaa'].map((sport) => (
            <Link
              key={sport}
              href={`/calendar?year=${year}&month=${month}&sport=${sport}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sportFilter === sport
                  ? 'bg-gradient-to-r from-orange-500 to-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {sport === 'all' ? 'All Sports' : sport.toUpperCase()}
            </Link>
          ))}
        </div>

        {/* Today's Games Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📅 Today's Games
            <span className="text-sm font-normal text-white/50">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </h3>

          {liveNow.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live Now ({liveNow.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {liveNow.map((game) => (
                  <GameCard key={game.gameId} game={game} />
                ))}
              </div>
            </div>
          )}

          {sortedUpcomingDates.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Games ({upcoming.length} total across {sortedUpcomingDates.length} days)
              </h4>
              <div className="space-y-6">
                {sortedUpcomingDates.map(dateStr => {
                  const gamesForDate = upcomingByDate.get(dateStr) || [];
                  return (
                    <div key={dateStr}>
                      <h5 className="text-white/70 text-sm font-medium mb-2 px-1 border-l-2 border-blue-500 pl-2">
                        {formatDateStr(dateStr)} ({gamesForDate.length} games)
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {gamesForDate.map((game) => (
                          <GameCard key={game.gameId} game={game} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sortedCompletedDates.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white/60 mb-3">Completed ({completed.length} games)</h4>
              <div className="space-y-6">
                {sortedCompletedDates.map(dateStr => {
                  const gamesForDate = completedByDate.get(dateStr) || [];
                  return (
                    <div key={dateStr}>
                      <h5 className="text-white/50 text-sm font-medium mb-2 px-1 border-l-2 border-white/30 pl-2">
                        {formatDateStr(dateStr)} ({gamesForDate.length} games)
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {gamesForDate.map((game) => (
                          <GameCard key={game.gameId} game={game} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredGames.length === 0 && (
            <div className="text-center py-12 glass rounded-xl">
              <p className="text-4xl mb-4">🏀</p>
              <p className="text-white/60">No games scheduled for today</p>
              <a 
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300"
              >
                Check ESPN for the full schedule <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Mini Calendar */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Month View</h3>
          </div>
          
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-white/50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === month;
              const isToday = date.toDateString() === today.toDateString();
              const dayNum = date.getDate();

              return (
                <div
                  key={index}
                  className={`p-2 min-h-[60px] border border-white/5 ${
                    isCurrentMonth ? 'bg-white/[0.02]' : 'bg-transparent opacity-40'
                  } ${isToday ? 'ring-1 ring-blue-500/50 bg-blue-500/10' : ''}`}
                >
                  <span className={`text-sm ${
                    isToday ? 'text-blue-400 font-bold' : isCurrentMonth ? 'text-white/70' : 'text-white/30'
                  }`}>
                    {dayNum}
                  </span>
                  
                  {isToday && liveNow.length > 0 && (
                    <div className="mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                        {liveNow.length} LIVE
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{filteredGames.length}</p>
            <p className="text-sm text-white/50">Total Games</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{liveNow.length}</p>
            <p className="text-sm text-white/50">Live Now</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{upcoming.length}</p>
            <p className="text-sm text-white/50">Upcoming</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{completed.length}</p>
            <p className="text-sm text-white/50">Completed</p>
          </div>
        </div>

        {/* Source footer */}
        <div className="mt-8 text-center">
          <a 
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            📊 View full schedule on ESPN <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
