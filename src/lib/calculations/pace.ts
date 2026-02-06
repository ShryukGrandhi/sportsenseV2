/**
 * Pace Analysis
 * Estimates possessions using the Dean Oliver formula:
 * Possessions = FGA + 0.44 * FTA - ORB + TOV
 *
 * Simplified version (without offensive rebounds):
 * Possessions ≈ FGA + 0.44 * FTA + TOV
 */

export interface TeamTotals {
  fga: number;
  fta: number;
  turnovers: number;
  offReb?: number;
  fgm: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  points: number;
}

/**
 * Estimate possessions for a team using Dean Oliver formula.
 */
export function estimatePossessions(totals: TeamTotals): number {
  const orb = totals.offReb || 0;
  return totals.fga + 0.44 * totals.fta - orb + totals.turnovers;
}

/**
 * Estimate pace (possessions per 48 minutes).
 * For a full game, pace = possessions. For partial games, extrapolate.
 */
export function estimatePace(totals: TeamTotals, minutesPlayed: number = 48): number {
  const possessions = estimatePossessions(totals);
  if (minutesPlayed <= 0) return 0;
  return Math.round((possessions / minutesPlayed) * 48 * 10) / 10;
}

/**
 * Calculate points per possession (offensive efficiency).
 */
export function pointsPerPossession(points: number, totals: TeamTotals): number {
  const possessions = estimatePossessions(totals);
  if (possessions <= 0) return 0;
  return Math.round((points / possessions) * 1000) / 1000;
}

/**
 * NBA league average pace (approximate for current season).
 */
export const LEAGUE_AVG_PACE = 99.5;

/**
 * Categorize the pace of a game.
 */
export function categorizePace(pace: number): 'fast' | 'average' | 'slow' {
  if (pace > LEAGUE_AVG_PACE + 3) return 'fast';
  if (pace < LEAGUE_AVG_PACE - 3) return 'slow';
  return 'average';
}
