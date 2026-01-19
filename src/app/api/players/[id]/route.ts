// Player Detail API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlayerDetail, fetchPlayerStats, fetchPlayerGameLogs } from '@/services/nba/espn-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 second timeout for Vercel

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  if (!playerId) {
    return NextResponse.json({
      success: false,
      error: { code: 'MISSING_ID', message: 'Player ID is required' },
    }, { status: 400 });
  }

  try {
    // Fetch player detail, stats, and game logs in parallel
    const [playerDetail, playerStats, gameLogs] = await Promise.all([
      fetchPlayerDetail(playerId),
      fetchPlayerStats(playerId),
      fetchPlayerGameLogs(playerId, 10),
    ]);

    if (!playerDetail) {
      // Try to find in database (with error handling)
      let dbPlayer = null;
      try {
        dbPlayer = await prisma.player.findFirst({
          where: {
            OR: [
              { externalId: playerId },
              { id: playerId },
            ],
          },
          include: { team: true },
        });
      } catch (dbError) {
        console.warn('[Player Detail] Database query failed:', dbError);
      }

      if (dbPlayer) {
        return NextResponse.json({
          success: true,
          data: {
            player: {
              id: dbPlayer.externalId,
              name: dbPlayer.fullName,
              displayName: dbPlayer.fullName,
              firstName: dbPlayer.firstName,
              lastName: dbPlayer.lastName,
              position: dbPlayer.position || '',
              jersey: dbPlayer.jerseyNumber || '',
              height: dbPlayer.height || '',
              weight: dbPlayer.weight ? `${dbPlayer.weight} lbs` : '',
              birthDate: dbPlayer.birthDate?.toISOString() || '',
              birthPlace: dbPlayer.country || '',
              college: dbPlayer.college || '',
              draft: dbPlayer.draftYear ? `${dbPlayer.draftYear} Round ${dbPlayer.draftRound}, Pick ${dbPlayer.draftPick}` : 'Undrafted',
              experience: 0,
              headshot: dbPlayer.headshotUrl || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${dbPlayer.externalId}.png&w=350&h=254`,
              team: dbPlayer.team ? {
                id: dbPlayer.team.externalId,
                name: dbPlayer.team.fullName,
                abbreviation: dbPlayer.team.abbreviation,
                logo: dbPlayer.team.logoUrl,
                color: dbPlayer.team.primaryColor || '#333',
              } : undefined,
            },
            stats: null,
            gameLogs: [],
          },
          meta: { source: 'database' },
        });
      }

      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Player not found' },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        player: playerDetail,
        stats: playerStats,
        gameLogs,
      },
      meta: { source: 'espn', timestamp: new Date().toISOString() },
    });

  } catch (error) {
    console.error('[Player Detail] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch player details',
      },
    }, { status: 500 });
  }
}
