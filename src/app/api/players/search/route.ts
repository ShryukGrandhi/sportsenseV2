// Player Search API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { searchPlayers } from '@/services/nba/espn-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 second timeout for Vercel

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: { query, count: 0 },
    });
  }

  try {
    // Try database first, but don't fail if database is unavailable
    let dbPlayers: any[] = [];
    try {
      dbPlayers = await prisma.player.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        include: {
          team: true,
        },
        take: limit,
        orderBy: { fullName: 'asc' },
      });
    } catch (dbError) {
      console.warn('[Player Search] Database query failed, falling back to ESPN:', dbError);
      // Continue to ESPN API fallback
    }

    if (dbPlayers.length > 0) {
      const results = dbPlayers.map((p: any) => ({
        id: p.externalId,
        name: p.fullName,
        displayName: p.fullName,
        shortName: p.lastName,
        position: p.position || '',
        jersey: p.jerseyNumber || '',
        headshot: p.headshotUrl || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${p.externalId}.png&w=350&h=254`,
        team: p.team ? {
          id: p.team.externalId,
          name: p.team.fullName,
          abbreviation: p.team.abbreviation,
          logo: p.team.logoUrl || `https://a.espncdn.com/i/teamlogos/nba/500/${p.team.abbreviation.toLowerCase()}.png`,
        } : undefined,
      }));

      return NextResponse.json({
        success: true,
        data: results,
        meta: { query, count: results.length, source: 'database' },
      });
    }

    // Fall back to ESPN API if no database results
    const espnResults = await searchPlayers(query, limit);

    return NextResponse.json({
      success: true,
      data: espnResults,
      meta: { query, count: espnResults.length, source: 'espn' },
    });

  } catch (error) {
    console.error('[Player Search] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to search players',
      },
    }, { status: 500 });
  }
}
