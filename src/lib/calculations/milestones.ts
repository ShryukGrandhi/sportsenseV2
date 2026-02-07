/**
 * Career Milestone Calculations
 * Tracks how close players are to career milestones.
 */

export interface CareerTotals {
  points: number;
  rebounds: number;
  assists: number;
  games: number;
}

export interface SeasonAverages {
  ppg: number;
  rpg: number;
  apg: number;
  gamesPlayed: number;
}

export interface MilestoneInfo {
  name: string;
  target: number;
  current: number;
  remaining: number;
  estimatedGames: number;
  percentComplete: number;
  category: 'points' | 'rebounds' | 'assists' | 'games';
}

// Common NBA career milestones
const POINT_MILESTONES = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000];
const REBOUND_MILESTONES = [3000, 5000, 7500, 10000, 12500, 15000];
const ASSIST_MILESTONES = [2000, 3000, 5000, 7500, 10000, 12500];
const GAME_MILESTONES = [500, 750, 1000, 1200, 1500];

/**
 * Find the next milestone for a given stat.
 */
function findNextMilestone(current: number, milestones: number[]): number | null {
  for (const milestone of milestones) {
    if (current < milestone) return milestone;
  }
  return null;
}

/**
 * Find all approaching milestones (>50% progress to next milestone).
 */
export function findApproachingMilestones(
  career: CareerTotals,
  seasonAvg: SeasonAverages
): MilestoneInfo[] {
  const milestones: MilestoneInfo[] = [];

  const checks: Array<{
    category: MilestoneInfo['category'];
    current: number;
    avgPerGame: number;
    thresholds: number[];
  }> = [
    { category: 'points', current: career.points, avgPerGame: seasonAvg.ppg, thresholds: POINT_MILESTONES },
    { category: 'rebounds', current: career.rebounds, avgPerGame: seasonAvg.rpg, thresholds: REBOUND_MILESTONES },
    { category: 'assists', current: career.assists, avgPerGame: seasonAvg.apg, thresholds: ASSIST_MILESTONES },
    { category: 'games', current: career.games, avgPerGame: 1, thresholds: GAME_MILESTONES },
  ];

  for (const { category, current, avgPerGame, thresholds } of checks) {
    const nextMilestone = findNextMilestone(current, thresholds);
    if (!nextMilestone) continue;

    const remaining = nextMilestone - current;
    const percentComplete = Math.round((current / nextMilestone) * 100);

    // Only include milestones that are >40% complete (more interesting to track)
    if (percentComplete < 40) continue;

    const estimatedGames = avgPerGame > 0 ? Math.ceil(remaining / avgPerGame) : 999;

    milestones.push({
      name: `${(nextMilestone / 1000).toFixed(0)}K Career ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      target: nextMilestone,
      current,
      remaining,
      estimatedGames,
      percentComplete,
      category,
    });
  }

  // Sort by closest to completion
  milestones.sort((a, b) => b.percentComplete - a.percentComplete);

  return milestones;
}
