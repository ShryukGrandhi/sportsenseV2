// NBA Arena - Live NBA scoreboard and games
// Uses live ESPN data with REAL-TIME updates via SSE

import { Suspense } from 'react';
import Link from 'next/link';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { GameChatWidget } from '@/components/ai/GameChatWidget';
import { ChevronLeft, Calendar, TrendingUp, RefreshCw, ExternalLink, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { fetchLiveScores, fetchScoresByDate, type LiveGameData } from '@/services/nba/live-data';
import { LiveScoreboard } from '@/components/games/LiveScoreboard';
import { LiveGameCard } from '@/components/games/LiveGameCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache - always fresh for real-time

// Static game card for non-today games (no real-time needed)
function StaticGameCard({ game }: { game: LiveGameData & { displayDate?: string } }) {
  const isLive = game.status === 'live' || game.status === 'halftime';
  const isFinal = game.status === 'final';
  
  return (
    <Link 
      href={`/nba/games/${game.gameId}`}
      className={`glass rounded-xl p-4 card-hover block transition-all hover:scale-[1.02] hover:shadow-xl ${isLive ? 'live-pulse' : ''}`}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
          <span className="text-xs text-white/40">{game.broadcast}</span>
        )}
      </div>

      {/* Away Team */}
      <div className={`flex items-center justify-between py-2 ${
        isFinal && game.awayTeam.score > game.homeTeam.score ? 'opacity-100' : isFinal ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-3">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.awayTeam.abbreviation.toLowerCase()}.png`}
            alt={game.awayTeam.name}
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
          <div>
            <p className="font-semibold text-white">{game.awayTeam.abbreviation}</p>
            <p className="text-xs text-white/40">{game.awayTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${
          isFinal && game.awayTeam.score > game.homeTeam.score ? 'text-white' : 'text-white/80'
        }`}>
          {game.awayTeam.score}
        </span>
      </div>

      {/* Home Team */}
      <div className={`flex items-center justify-between py-2 ${
        isFinal && game.homeTeam.score > game.awayTeam.score ? 'opacity-100' : isFinal ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-3">
          <Image
            src={`https://a.espncdn.com/i/teamlogos/nba/500/${game.homeTeam.abbreviation.toLowerCase()}.png`}
            alt={game.homeTeam.name}
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
          <div>
            <p className="font-semibold text-white">{game.homeTeam.abbreviation}</p>
            <p className="text-xs text-white/40">{game.homeTeam.record}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${
          isFinal && game.homeTeam.score > game.awayTeam.score ? 'text-white' : 'text-white/80'
        }`}>
          {game.homeTeam.score}
        </span>
      </div>

      {/* Venue */}
      {game.venue && (
        <p className="text-xs text-white/30 mt-2 text-center">{game.venue}</p>
      )}

      {/* View Details hint */}
      <div className="mt-3 pt-3 border-t border-white/10 text-center">
        <span className="text-xs text-white/40 hover:text-white/60 transition-colors">
          Click for full stats & analytics →
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
  // Fetch LIVE scores from ESPN (today's games)
  const { games: todayGames, lastUpdated, source, sourceUrl } = await fetchLiveScores();
  
  // Also fetch tomorrow's and day after tomorrow's games for a more complete view
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  const formatDateStr = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
  
  // Fetch additional days in parallel
  const [tomorrowData, dayAfterData] = await Promise.all([
    fetchScoresByDate(formatDateStr(tomorrow)),
    fetchScoresByDate(formatDateStr(dayAfter)),
  ]);
  
  // Mark games with their date for display
  const tomorrowGames = tomorrowData.games.map(g => ({ ...g, displayDate: 'Tomorrow' }));
  const dayAfterGames = dayAfterData.games.map(g => ({ 
    ...g, 
    displayDate: dayAfter.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }));
  
  // Debug: Log games to server console
  console.log('[NBAPage] Today games:', todayGames.length);
  console.log('[NBAPage] Tomorrow games:', tomorrowGames.length);
  console.log('[NBAPage] Day after games:', dayAfterGames.length);

  const displayDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Convert to GameInfo format for the chat widget
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
      
      <main className="container mx-auto px-4 py-6">
        {/* Back to Hub */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Hub
        </Link>

        {/* Hero */}
        <div className="text-center space-y-4 py-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 text-5xl">
            🏀
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text-orange">NBA</span>
            <span className="text-white"> Arena</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            <span className="text-green-400 font-semibold">REAL-TIME</span> scores, live clock, and AI-powered insights
          </p>
          
          {/* Date display */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <p className="text-lg text-white/80">{displayDate}</p>
            <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full font-medium">
              Today
            </span>
          </div>

          {/* Source attribution */}
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-white/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Real-time updates from {source}</span>
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/nba/calendar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Full Schedule
            </Link>
            <Link
              href="/nba/standings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Standings
            </Link>
          </div>
        </div>

        {/* Today's Games - REAL-TIME with LiveScoreboard */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            Today&apos;s Games
            <span className="text-xs font-normal px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
              ⚡ Real-Time Updates
            </span>
          </h2>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
            </div>
          }>
            <LiveScoreboard initialGames={todayGames} />
          </Suspense>
        </div>

        {/* Tomorrow's Games - Static (no real-time needed for future games) */}
        {tomorrowGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                <ChevronRight className="w-5 h-5" />
                Tomorrow
              </h2>
              <span className="text-sm text-white/40">{tomorrowGames.length} games</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tomorrowGames.map((game) => (
                <StaticGameCard key={game.gameId} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Day After Tomorrow's Games */}
        {dayAfterGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                <ChevronRight className="w-5 h-5" />
                {dayAfterGames[0]?.displayDate || 'Upcoming'}
              </h2>
              <span className="text-sm text-white/40">{dayAfterGames.length} games</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayAfterGames.map((game) => (
                <StaticGameCard key={game.gameId} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* View Full Calendar Link */}
        <div className="text-center mb-8">
          <Link
            href="/nba/calendar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 text-white font-medium hover:from-orange-500/30 hover:to-purple-500/30 transition-all"
          >
            <Calendar className="w-5 h-5" />
            View Full Month Calendar
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Empty state */}
        {todayGames.length === 0 && tomorrowGames.length === 0 && (
          <div className="text-center py-16 space-y-6 animate-fade-in">
            <div className="text-6xl">🏀</div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">No games today</h2>
              <p className="text-white/60 max-w-md mx-auto">
                Check out the calendar for upcoming matchups or view the full schedule on ESPN.
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Link
                href="/nba/calendar"
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                View Full Calendar
              </Link>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-2"
              >
                ESPN Scoreboard <ExternalLink className="w-4 h-4" />
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            📊 View full scoreboard on ESPN <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Floating AI Chat Widget for Live Games */}
        {liveGameInfos.length > 0 && (
          <GameChatWidget games={liveGameInfos} sport="NBA" />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>
            <span className="gradient-text font-semibold">Playmaker</span> — NBA Arena
          </p>
          <p className="mt-2 text-xs">
            Real-time data from {source}. Not affiliated with the NBA.
          </p>
        </div>
      </footer>
    </div>
  );
}
