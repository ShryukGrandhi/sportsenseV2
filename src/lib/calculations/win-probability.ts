/**
 * Win Probability Estimation
 * Uses a logistic model based on score differential and time remaining.
 * Label as "Estimated" - this is a simplified model.
 */

export interface PlayData {
  sequenceNumber: number;
  period: number;
  clock: string;
  homeScore: number;
  awayScore: number;
  scoringPlay: boolean;
  description?: string;
}

/**
 * Estimate win probability for the home team.
 * Uses logistic model: 1 / (1 + exp(-scoreDiff / (3.5 * sqrt(minutesRemaining))))
 * @returns 0-100 probability for home team winning
 */
export function estimateWinProbability(scoreDiff: number, minutesRemaining: number): number {
  if (minutesRemaining <= 0) {
    return scoreDiff > 0 ? 100 : scoreDiff < 0 ? 0 : 50;
  }

  const exponent = -scoreDiff / (3.5 * Math.sqrt(minutesRemaining));
  const probability = 1 / (1 + Math.exp(exponent));
  return Math.round(probability * 100);
}

/**
 * Convert period + clock string to total minutes remaining in regulation.
 */
export function getMinutesRemaining(period: number, clock: string): number {
  const parts = clock.split(':');
  const minutes = parseInt(parts[0] || '0', 10);
  const seconds = parseInt(parts[1] || '0', 10);
  const clockMinutes = minutes + seconds / 60;

  // NBA: 4 periods of 12 minutes each (48 total)
  const periodsRemaining = Math.max(0, 4 - period);
  return periodsRemaining * 12 + clockMinutes;
}

/**
 * Build a win probability timeline from play-by-play data.
 */
export function buildWinProbTimeline(plays: PlayData[]): Array<{
  minute: number;
  period: number;
  homeProb: number;
  scoreDiff: number;
  label?: string;
}> {
  const timeline: Array<{
    minute: number;
    period: number;
    homeProb: number;
    scoreDiff: number;
    label?: string;
  }> = [];

  // Start at 50/50
  timeline.push({ minute: 0, period: 1, homeProb: 50, scoreDiff: 0 });

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const minutesRemaining = getMinutesRemaining(play.period, play.clock);
    const gameMinute = 48 - minutesRemaining;
    const scoreDiff = play.homeScore - play.awayScore;
    const homeProb = estimateWinProbability(scoreDiff, minutesRemaining);

    timeline.push({
      minute: Math.round(gameMinute * 10) / 10,
      period: play.period,
      homeProb,
      scoreDiff,
    });
  }

  return timeline;
}

/**
 * Find pivotal moments where win probability swings significantly.
 */
export function findPivotalMoments(
  plays: PlayData[],
  threshold: number = 10
): Array<{
  minute: number;
  period: number;
  description: string;
  probSwing: number;
}> {
  const moments: Array<{
    minute: number;
    period: number;
    description: string;
    probSwing: number;
  }> = [];

  let prevProb = 50;

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const minutesRemaining = getMinutesRemaining(play.period, play.clock);
    const gameMinute = 48 - minutesRemaining;
    const scoreDiff = play.homeScore - play.awayScore;
    const currentProb = estimateWinProbability(scoreDiff, minutesRemaining);
    const swing = Math.abs(currentProb - prevProb);

    if (swing >= threshold) {
      moments.push({
        minute: Math.round(gameMinute * 10) / 10,
        period: play.period,
        description: play.description || `Score: ${play.homeScore}-${play.awayScore}`,
        probSwing: currentProb - prevProb,
      });
    }

    prevProb = currentProb;
  }

  return moments;
}
