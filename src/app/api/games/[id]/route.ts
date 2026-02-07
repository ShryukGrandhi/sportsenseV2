// API route to fetch individual game details in real-time
import { NextRequest, NextResponse } from 'next/server';
import { fetchGameDetail } from '@/services/nba/espn-api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const game = await fetchGameDetail(id);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Calculate team totals from player stats as fallback
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

    return NextResponse.json({
      ...game,
      homeTotals,
      awayTotals,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Error fetching game details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
