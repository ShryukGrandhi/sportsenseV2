// NBA Data Sync Service - Populates and updates the database from external APIs

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import * as nbaClient from './client';
import type { BDLTeam, BDLPlayer, BDLGame, BDLStats } from '@/types/nba';
// Game status and play types are now strings (SQLite compatibility)

// ============================================
// SYNC STATE TRACKING
// ============================================

async function startSync(syncType: string): Promise<string> {
  const log = await prisma.syncLog.create({
    data: {
      syncType,
      status: 'started',
    },
  });
  return log.id;
}

async function completeSync(
  logId: string,
  recordsProcessed: number,
  errors?: unknown[]
): Promise<void> {
  await prisma.syncLog.update({
    where: { id: logId },
    data: {
      status: errors?.length ? 'completed_with_errors' : 'completed',
      recordsProcessed,
      errors: errors?.length ? JSON.stringify(errors) : undefined,
      completedAt: new Date(),
    },
  });
}

async function failSync(logId: string, error: Error): Promise<void> {
  await prisma.syncLog.update({
    where: { id: logId },
    data: {
      status: 'failed',
      errors: JSON.stringify([{ message: error.message, stack: error.stack }]),
      completedAt: new Date(),
    },
  });
}

// ============================================
// LEAGUE INITIALIZATION
// ============================================

export async function ensureLeagueExists(): Promise<string> {
  const existing = await prisma.league.findUnique({
    where: { externalId: 'nba' },
  });

  if (existing) return existing.id;

  const league = await prisma.league.create({
    data: {
      externalId: 'nba',
      name: 'National Basketball Association',
      abbreviation: 'NBA',
      sport: 'basketball',
      country: 'USA',
      logoUrl: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
    },
  });

  logger.info('Created NBA league', { leagueId: league.id });
  return league.id;
}

export async function ensureSeasonExists(year: number): Promise<string> {
  const leagueId = await ensureLeagueExists();
  const seasonName = nbaClient.getSeasonString(year);

  const existing = await prisma.season.findUnique({
    where: { externalId: seasonName },
  });

  if (existing) return existing.id;

  // Estimate season dates
  const startDate = new Date(year, 9, 22); // Oct 22
  const endDate = new Date(year + 1, 5, 20); // June 20

  const season = await prisma.season.create({
    data: {
      externalId: seasonName,
      leagueId,
      year,
      name: seasonName,
      startDate,
      endDate,
      isCurrent: year === nbaClient.getCurrentSeason(),
    },
  });

  logger.info('Created season', { seasonId: season.id, name: seasonName });
  return season.id;
}

// ============================================
// TEAM SYNC
// ============================================

// Team colors mapping (not available from API)
const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  ATL: { primary: '#E03A3E', secondary: '#C1D32F' },
  BOS: { primary: '#007A33', secondary: '#BA9653' },
  BKN: { primary: '#000000', secondary: '#FFFFFF' },
  CHA: { primary: '#1D1160', secondary: '#00788C' },
  CHI: { primary: '#CE1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#FDBB30' },
  DAL: { primary: '#00538C', secondary: '#002B5E' },
  DEN: { primary: '#0E2240', secondary: '#FEC524' },
  DET: { primary: '#C8102E', secondary: '#1D42BA' },
  GSW: { primary: '#1D428A', secondary: '#FFC72C' },
  HOU: { primary: '#CE1141', secondary: '#000000' },
  IND: { primary: '#002D62', secondary: '#FDBB30' },
  LAC: { primary: '#C8102E', secondary: '#1D428A' },
  LAL: { primary: '#552583', secondary: '#FDB927' },
  MEM: { primary: '#5D76A9', secondary: '#12173F' },
  MIA: { primary: '#98002E', secondary: '#F9A01B' },
  MIL: { primary: '#00471B', secondary: '#EEE1C6' },
  MIN: { primary: '#0C2340', secondary: '#236192' },
  NOP: { primary: '#0C2340', secondary: '#C8102E' },
  NYK: { primary: '#006BB6', secondary: '#F58426' },
  OKC: { primary: '#007AC1', secondary: '#EF3B24' },
  ORL: { primary: '#0077C0', secondary: '#C4CED4' },
  PHI: { primary: '#006BB6', secondary: '#ED174C' },
  PHX: { primary: '#1D1160', secondary: '#E56020' },
  POR: { primary: '#E03A3E', secondary: '#000000' },
  SAC: { primary: '#5A2D81', secondary: '#63727A' },
  SAS: { primary: '#C4CED4', secondary: '#000000' },
  TOR: { primary: '#CE1141', secondary: '#000000' },
  UTA: { primary: '#002B5C', secondary: '#00471B' },
  WAS: { primary: '#002B5C', secondary: '#E31837' },
};

export async function syncTeams(): Promise<number> {
  const logId = await startSync('teams');
  
  try {
    const leagueId = await ensureLeagueExists();
    const teams = await nbaClient.getAllTeams();
    
    let processed = 0;
    
    for (const team of teams) {
      const colors = TEAM_COLORS[team.abbreviation] || { primary: null, secondary: null };
      
      await prisma.team.upsert({
        where: { externalId: String(team.id) },
        update: {
          name: team.name,
          fullName: team.full_name,
          abbreviation: team.abbreviation,
          city: team.city,
          conference: team.conference,
          division: team.division,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/global/L/logo.svg`,
        },
        create: {
          externalId: String(team.id),
          leagueId,
          name: team.name,
          fullName: team.full_name,
          abbreviation: team.abbreviation,
          city: team.city,
          conference: team.conference,
          division: team.division,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/global/L/logo.svg`,
        },
      });
      
      processed++;
    }
    
    await completeSync(logId, processed);
    logger.info('Teams sync complete', { count: processed });
    
    return processed;
  } catch (error) {
    await failSync(logId, error as Error);
    logger.error('Teams sync failed', {}, error as Error);
    throw error;
  }
}

// ============================================
// PLAYER SYNC
// ============================================

export async function syncPlayers(maxPages: number = 50): Promise<number> {
  const logId = await startSync('players');
  
  try {
    let page = 1;
    let totalProcessed = 0;
    const errors: unknown[] = [];
    
    // Get team mapping
    const teams = await prisma.team.findMany({
      select: { id: true, externalId: true },
    });
    const teamMap = new Map(teams.map((t) => [t.externalId, t.id]));
    
    while (page <= maxPages) {
      const response = await nbaClient.getPlayers(page, 100);
      
      if (response.data.length === 0) break;
      
      for (const player of response.data) {
        try {
          const teamId = player.team
            ? teamMap.get(String(player.team.id))
            : null;
          
          await prisma.player.upsert({
            where: { externalId: String(player.id) },
            update: {
              teamId,
              firstName: player.first_name,
              lastName: player.last_name,
              fullName: `${player.first_name} ${player.last_name}`,
              position: player.position || null,
              height: player.height || null,
              weight: player.weight ? parseInt(player.weight) : null,
              jerseyNumber: player.jersey_number || null,
              country: player.country || null,
              college: player.college || null,
              draftYear: player.draft_year || null,
              draftRound: player.draft_round || null,
              draftPick: player.draft_number || null,
              headshotUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`,
            },
            create: {
              externalId: String(player.id),
              teamId,
              firstName: player.first_name,
              lastName: player.last_name,
              fullName: `${player.first_name} ${player.last_name}`,
              position: player.position || null,
              height: player.height || null,
              weight: player.weight ? parseInt(player.weight) : null,
              jerseyNumber: player.jersey_number || null,
              country: player.country || null,
              college: player.college || null,
              draftYear: player.draft_year || null,
              draftRound: player.draft_round || null,
              draftPick: player.draft_number || null,
              headshotUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`,
            },
          });
          
          totalProcessed++;
        } catch (err) {
          errors.push({ playerId: player.id, error: (err as Error).message });
        }
      }
      
      logger.info(`Players sync page ${page}`, { 
        processed: response.data.length,
        total: totalProcessed,
      });
      
      if (!response.meta.next_page) break;
      page++;
    }
    
    await completeSync(logId, totalProcessed, errors.length ? errors : undefined);
    logger.info('Players sync complete', { count: totalProcessed, errors: errors.length });
    
    return totalProcessed;
  } catch (error) {
    await failSync(logId, error as Error);
    logger.error('Players sync failed', {}, error as Error);
    throw error;
  }
}

// ============================================
// GAME SYNC
// ============================================

function mapGameStatus(bdlStatus: string, period: number): string {
  const status = bdlStatus.toUpperCase();
  
  if (status === 'FINAL' || status.includes('FINAL')) {
    return 'FINAL';
  }
  if (status === 'IN PROGRESS' || status.includes('QTR') || status.includes('OT')) {
    return 'LIVE';
  }
  if (status === 'HALFTIME') {
    return 'HALFTIME';
  }
  if (status === 'POSTPONED') {
    return 'POSTPONED';
  }
  if (period === 0 || status === '' || status.includes('PM') || status.includes('AM')) {
    return 'SCHEDULED';
  }
  
  return 'SCHEDULED';
}

export async function syncGames(options: {
  startDate: string;
  endDate: string;
  season?: number;
}): Promise<number> {
  const logId = await startSync('games');
  
  try {
    const season = options.season || nbaClient.getCurrentSeason();
    const seasonId = await ensureSeasonExists(season);
    
    // Get team mapping
    const teams = await prisma.team.findMany({
      select: { id: true, externalId: true },
    });
    const teamMap = new Map(teams.map((t) => [t.externalId, t.id]));
    
    // Generate date range
    const dates: string[] = [];
    const current = new Date(options.startDate);
    const end = new Date(options.endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    let totalProcessed = 0;
    const errors: unknown[] = [];
    
    // Process in batches of 7 days to avoid API limits
    for (let i = 0; i < dates.length; i += 7) {
      const batch = dates.slice(i, i + 7);
      const response = await nbaClient.getGames({ dates: batch, seasons: [season] });
      
      for (const game of response.data) {
        try {
          const homeTeamId = teamMap.get(String(game.home_team.id));
          const awayTeamId = teamMap.get(String(game.visitor_team.id));
          
          if (!homeTeamId || !awayTeamId) {
            errors.push({ gameId: game.id, error: 'Missing team mapping' });
            continue;
          }
          
          const status = mapGameStatus(game.status, game.period);
          
          await prisma.game.upsert({
            where: { externalId: String(game.id) },
            update: {
              homeTeamId,
              awayTeamId,
              scheduledAt: new Date(game.date),
              status,
              period: game.period,
              gameClock: game.time || null,
              homeScore: game.home_team_score,
              awayScore: game.visitor_team_score,
              lastSyncAt: new Date(),
              dataSource: 'balldontlie',
            },
            create: {
              externalId: String(game.id),
              seasonId,
              homeTeamId,
              awayTeamId,
              scheduledAt: new Date(game.date),
              status,
              period: game.period,
              gameClock: game.time || null,
              homeScore: game.home_team_score,
              awayScore: game.visitor_team_score,
              lastSyncAt: new Date(),
              dataSource: 'balldontlie',
            },
          });
          
          totalProcessed++;
        } catch (err) {
          errors.push({ gameId: game.id, error: (err as Error).message });
        }
      }
      
      logger.info(`Games sync batch`, {
        dates: batch,
        processed: response.data.length,
        total: totalProcessed,
      });
    }
    
    await completeSync(logId, totalProcessed, errors.length ? errors : undefined);
    logger.info('Games sync complete', { count: totalProcessed, errors: errors.length });
    
    return totalProcessed;
  } catch (error) {
    await failSync(logId, error as Error);
    logger.error('Games sync failed', {}, error as Error);
    throw error;
  }
}

// ============================================
// BOX SCORE / STATS SYNC
// ============================================

export async function syncGameStats(gameExternalId: number): Promise<number> {
  const logId = await startSync(`stats:${gameExternalId}`);
  
  try {
    const stats = await nbaClient.getGameStats(gameExternalId);
    
    if (stats.length === 0) {
      await completeSync(logId, 0);
      return 0;
    }
    
    // Get game from our DB
    const game = await prisma.game.findUnique({
      where: { externalId: String(gameExternalId) },
    });
    
    if (!game) {
      throw new Error(`Game ${gameExternalId} not found in database`);
    }
    
    // Get player mapping
    const players = await prisma.player.findMany({
      select: { id: true, externalId: true },
    });
    const playerMap = new Map(players.map((p) => [p.externalId, p.id]));
    
    // Get team mapping
    const teams = await prisma.team.findMany({
      select: { id: true, externalId: true },
    });
    const teamMap = new Map(teams.map((t) => [t.externalId, t.id]));
    
    let processed = 0;
    
    for (const stat of stats) {
      const playerId = playerMap.get(String(stat.player.id));
      const teamId = teamMap.get(String(stat.team.id));
      
      if (!playerId || !teamId) continue;
      
      // Parse minutes string to decimal
      let minutesDecimal: number | null = null;
      if (stat.min) {
        const parts = stat.min.split(':');
        if (parts.length === 2) {
          minutesDecimal = parseInt(parts[0]) + parseInt(parts[1]) / 60;
        }
      }
      
      await prisma.playerGameStats.upsert({
        where: {
          gameId_playerId: {
            gameId: game.id,
            playerId,
          },
        },
        update: {
          teamId,
          minutes: stat.min || null,
          minutesDecimal,
          points: stat.pts,
          fgm: stat.fgm,
          fga: stat.fga,
          fg3m: stat.fg3m,
          fg3a: stat.fg3a,
          ftm: stat.ftm,
          fta: stat.fta,
          oreb: stat.oreb,
          dreb: stat.dreb,
          reb: stat.reb,
          ast: stat.ast,
          stl: stat.stl,
          blk: stat.blk,
          tov: stat.turnover,
          pf: stat.pf,
        },
        create: {
          gameId: game.id,
          playerId,
          teamId,
          minutes: stat.min || null,
          minutesDecimal,
          points: stat.pts,
          fgm: stat.fgm,
          fga: stat.fga,
          fg3m: stat.fg3m,
          fg3a: stat.fg3a,
          ftm: stat.ftm,
          fta: stat.fta,
          oreb: stat.oreb,
          dreb: stat.dreb,
          reb: stat.reb,
          ast: stat.ast,
          stl: stat.stl,
          blk: stat.blk,
          tov: stat.turnover,
          pf: stat.pf,
        },
      });
      
      processed++;
    }
    
    await completeSync(logId, processed);
    logger.info('Game stats sync complete', { gameId: gameExternalId, count: processed });
    
    return processed;
  } catch (error) {
    await failSync(logId, error as Error);
    logger.error('Game stats sync failed', { gameId: gameExternalId }, error as Error);
    throw error;
  }
}

// ============================================
// FULL DATA SYNC
// ============================================

export async function runFullSync(): Promise<{
  teams: number;
  players: number;
  games: number;
}> {
  logger.info('Starting full data sync');
  
  // Sync teams first (dependency)
  const teams = await syncTeams();
  
  // Sync players (depends on teams)
  const players = await syncPlayers(100); // Get up to 10,000 players
  
  // Sync current season games
  const season = nbaClient.getCurrentSeason();
  const startDate = `${season}-10-01`;
  const endDate = new Date().toISOString().split('T')[0];
  
  const games = await syncGames({
    startDate,
    endDate,
    season,
  });
  
  logger.info('Full sync complete', { teams, players, games });
  
  return { teams, players, games };
}

