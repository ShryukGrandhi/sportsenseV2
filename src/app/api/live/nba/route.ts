// Live NBA Data API Route - Returns current game states for polling

import { NextResponse } from 'next/server';
import { fetchLiveScores } from '@/services/nba/live-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchLiveScores();
    
    return NextResponse.json({
      games: data.games,
      lastUpdated: data.lastUpdated,
      source: data.source,
    });
  } catch (error) {
    console.error('Failed to fetch live NBA data:', error);
    
    return NextResponse.json({
      games: [],
      lastUpdated: new Date().toISOString(),
      source: 'Error',
      error: (error as Error).message,
    }, { status: 500 });
  }
}
