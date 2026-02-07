// NBA Game Detail Page - Full analytics with charts, player stats, and AI insights
// Fetches live data from ESPN API with real-time updates

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { NBAHeader } from '@/components/nba/NBAHeader';
import { GameChatSidebar } from '@/components/ai/GameChatSidebar';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { LiveGameHeader } from '@/components/games/LiveGameHeader';
import { LiveGameContent } from '@/components/games/LiveGameContent';
import { fetchGameDetail, fetchTeamPreviousGames } from '@/services/nba/espn-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for real-time data

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;

  let game;
  try {
    game = await fetchGameDetail(id);
  } catch (e) {
    console.error('Failed to fetch game detail:', e);
    notFound();
  }

  if (!game) {
    notFound();
  }

  // Fetch previous games for both teams in parallel
  const [homePreviousGames, awayPreviousGames] = await Promise.all([
    fetchTeamPreviousGames(game.homeTeam.id, 5).catch(() => []),
    fetchTeamPreviousGames(game.awayTeam.id, 5).catch(() => []),
  ]);

  // Use team totals from API, or calculate from player stats as fallback
  const defaultTotals = {
    points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
    fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
  };

  const calculateTeamTotals = (stats: typeof game.homeStats) => {
    if (stats.length === 0) return defaultTotals;
    return stats.reduce((acc, p) => ({
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fgm: acc.fgm + p.fgm,
      fga: acc.fga + p.fga,
      fg3m: acc.fg3m + p.fg3m,
      fg3a: acc.fg3a + p.fg3a,
      ftm: acc.ftm + p.ftm,
      fta: acc.fta + p.fta,
    }), defaultTotals);
  };

  // Prefer API totals, fallback to calculated from player stats
  const homeTotals = game.homeTotals && game.homeTotals.rebounds > 0 
    ? game.homeTotals 
    : calculateTeamTotals(game.homeStats);
  const awayTotals = game.awayTotals && game.awayTotals.rebounds > 0 
    ? game.awayTotals 
    : calculateTeamTotals(game.awayStats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      <ScrollToTop />
      <NBAHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <Link 
          href="/nba"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Scoreboard
        </Link>

        {/* Live Game Header - Real-time score updates */}
        <LiveGameHeader
          gameId={game.id}
          initialHomeScore={game.homeScore}
          initialAwayScore={game.awayScore}
          initialStatus={game.status}
          initialPeriod={game.period}
          initialClock={game.clock}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          venue={game.venue}
          broadcast={game.broadcast}
          date={game.date}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Live Analytics & Stats */}
          <div className="xl:col-span-3">
            <LiveGameContent
              initialGame={game}
              initialHomeTotals={homeTotals}
              initialAwayTotals={awayTotals}
              homePreviousGames={homePreviousGames}
              awayPreviousGames={awayPreviousGames}
            />
          </div>

          {/* Right Column - AI Chat */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <GameChatSidebar 
                gameId={game.id}
                homeTeam={game.homeTeam.displayName}
                awayTeam={game.awayTeam.displayName}
                homeScore={game.homeScore}
                awayScore={game.awayScore}
                status={game.status}
                period={game.period}
                clock={game.clock}
              />
            </div>
          </div>
        </div>

        {/* Source Footer */}
        <div className="mt-8 text-center">
          <a 
            href={`https://www.espn.com/nba/game/_/gameId/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            📊 View on ESPN <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
