/**
 * Player & Game Projections
 * Predicts player stat lines and game outcomes using weighted averages.
 */

export interface SeasonAverages {
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  fg3Pct: number;
  gamesPlayed: number;
}

export interface RecentGame {
  points: number;
  rebounds: number;
  assists: number;
  opponent?: string;
  date?: string;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ppg: number;
  oppg: number;
  record?: string;
}

export interface ProjectedStat {
  value: number;
  low: number;
  high: number;
}

/**
 * Project a player's stat line using weighted average of season + recent games.
 * Recent games weight: 40%, Season average weight: 60%.
 */
export function projectPlayerStats(
  seasonAvg: SeasonAverages,
  recentGames: RecentGame[]
): {
  points: ProjectedStat;
  rebounds: ProjectedStat;
  assists: ProjectedStat;
  confidence: 'high' | 'medium' | 'low';
} {
  const recentCount = recentGames.length;
  const recentWeight = recentCount >= 5 ? 0.4 : recentCount >= 3 ? 0.3 : 0.2;
  const seasonWeight = 1 - recentWeight;

  const recentAvg = {
    points: recentCount > 0 ? recentGames.reduce((s, g) => s + g.points, 0) / recentCount : seasonAvg.ppg,
    rebounds: recentCount > 0 ? recentGames.reduce((s, g) => s + g.rebounds, 0) / recentCount : seasonAvg.rpg,
    assists: recentCount > 0 ? recentGames.reduce((s, g) => s + g.assists, 0) / recentCount : seasonAvg.apg,
  };

  const projected = {
    points: seasonAvg.ppg * seasonWeight + recentAvg.points * recentWeight,
    rebounds: seasonAvg.rpg * seasonWeight + recentAvg.rebounds * recentWeight,
    assists: seasonAvg.apg * seasonWeight + recentAvg.assists * recentWeight,
  };

  // Calculate variance from recent games for confidence intervals
  const variance = recentCount > 0
    ? recentGames.reduce((s, g) => s + Math.pow(g.points - recentAvg.points, 2), 0) / recentCount
    : Math.pow(seasonAvg.ppg * 0.3, 2);
  const stdDev = Math.sqrt(variance);

  const confidence: 'high' | 'medium' | 'low' =
    recentCount >= 5 && stdDev < seasonAvg.ppg * 0.2 ? 'high' :
    recentCount >= 3 ? 'medium' : 'low';

  return {
    points: {
      value: Math.round(projected.points * 10) / 10,
      low: Math.round(Math.max(0, projected.points - stdDev) * 10) / 10,
      high: Math.round((projected.points + stdDev) * 10) / 10,
    },
    rebounds: {
      value: Math.round(projected.rebounds * 10) / 10,
      low: Math.round(Math.max(0, projected.rebounds - projected.rebounds * 0.3) * 10) / 10,
      high: Math.round((projected.rebounds + projected.rebounds * 0.3) * 10) / 10,
    },
    assists: {
      value: Math.round(projected.assists * 10) / 10,
      low: Math.round(Math.max(0, projected.assists - projected.assists * 0.3) * 10) / 10,
      high: Math.round((projected.assists + projected.assists * 0.3) * 10) / 10,
    },
    confidence,
  };
}

/**
 * Predict a game outcome using team records and scoring averages.
 * Uses a simplified model based on strength of schedule.
 */
export function predictGame(
  homeTeam: TeamRecord,
  awayTeam: TeamRecord
): {
  homePredictedScore: number;
  awayPredictedScore: number;
  homeWinProbability: number;
} {
  // Home court advantage: ~3.5 points in NBA
  const homeAdvantage = 3.5;

  // Average of offensive and defensive ratings
  const homeStrength = homeTeam.ppg - homeTeam.oppg;
  const awayStrength = awayTeam.ppg - awayTeam.oppg;

  // Predicted margin = (homeStrength - awayStrength) / 2 + home advantage
  const predictedMargin = (homeStrength - awayStrength) / 2 + homeAdvantage;

  // Average total points
  const avgTotal = (homeTeam.ppg + awayTeam.ppg + homeTeam.oppg + awayTeam.oppg) / 4;

  const homePredictedScore = Math.round(avgTotal + predictedMargin / 2);
  const awayPredictedScore = Math.round(avgTotal - predictedMargin / 2);

  // Win probability using logistic function
  // Standard deviation of NBA game margins is ~12 points
  const winProb = 1 / (1 + Math.exp(-predictedMargin / 6));
  const homeWinProbability = Math.round(winProb * 100);

  return { homePredictedScore, awayPredictedScore, homeWinProbability };
}

/**
 * Calculate a "watch score" (1-100) indicating how exciting a game might be.
 */
export function calculateWatchScore(
  homeTeam: TeamRecord,
  awayTeam: TeamRecord,
  factors?: {
    isRivalry?: boolean;
    playoffImplications?: boolean;
    starPlayer?: boolean;
  }
): number {
  let score = 50;

  // Close records = more competitive = higher watch score
  const homeWinPct = homeTeam.wins / Math.max(1, homeTeam.wins + homeTeam.losses);
  const awayWinPct = awayTeam.wins / Math.max(1, awayTeam.wins + awayTeam.losses);
  const competitiveness = 1 - Math.abs(homeWinPct - awayWinPct);
  score += competitiveness * 20;

  // Both good teams = higher score
  const avgWinPct = (homeWinPct + awayWinPct) / 2;
  score += avgWinPct * 15;

  // High-scoring teams are more exciting
  const avgPpg = (homeTeam.ppg + awayTeam.ppg) / 2;
  if (avgPpg > 115) score += 8;
  else if (avgPpg > 110) score += 4;

  // Bonus factors
  if (factors?.isRivalry) score += 10;
  if (factors?.playoffImplications) score += 8;
  if (factors?.starPlayer) score += 5;

  return Math.min(100, Math.max(1, Math.round(score)));
}
