/**
 * Momentum Analysis
 * Detects scoring runs, lead changes, and largest leads from play-by-play data.
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

export interface ScoringRun {
  team: 'home' | 'away';
  points: number;
  startMinute: number;
  endMinute: number;
  description: string;
}

/**
 * Convert period + clock to game minute elapsed (0-48).
 */
function toGameMinute(period: number, clock: string): number {
  const parts = clock.split(':');
  const minutes = parseInt(parts[0] || '0', 10);
  const seconds = parseInt(parts[1] || '0', 10);
  const clockMinutes = minutes + seconds / 60;
  return (period - 1) * 12 + (12 - clockMinutes);
}

/**
 * Detect significant scoring runs (one team scoring X+ unanswered points).
 */
export function detectScoringRuns(plays: PlayData[], threshold: number = 7): ScoringRun[] {
  const runs: ScoringRun[] = [];
  const scoringPlays = plays.filter(p => p.scoringPlay);

  if (scoringPlays.length < 2) return runs;

  let runTeam: 'home' | 'away' | null = null;
  let runPoints = 0;
  let runStart = 0;
  let prevHomeScore = 0;
  let prevAwayScore = 0;

  for (const play of scoringPlays) {
    const homeScored = play.homeScore > prevHomeScore;
    const awayScored = play.awayScore > prevAwayScore;
    const scoringTeam: 'home' | 'away' = homeScored ? 'home' : 'away';
    const pointsScored = homeScored
      ? play.homeScore - prevHomeScore
      : play.awayScore - prevAwayScore;

    if (scoringTeam === runTeam) {
      runPoints += pointsScored;
    } else {
      // End previous run if it met threshold
      if (runTeam && runPoints >= threshold) {
        runs.push({
          team: runTeam,
          points: runPoints,
          startMinute: Math.round(runStart * 10) / 10,
          endMinute: Math.round(toGameMinute(play.period, play.clock) * 10) / 10,
          description: `${runPoints}-0 ${runTeam === 'home' ? 'home' : 'away'} run`,
        });
      }
      runTeam = scoringTeam;
      runPoints = pointsScored;
      runStart = toGameMinute(play.period, play.clock);
    }

    prevHomeScore = play.homeScore;
    prevAwayScore = play.awayScore;
  }

  // Check final run
  if (runTeam && runPoints >= threshold) {
    const lastPlay = scoringPlays[scoringPlays.length - 1];
    runs.push({
      team: runTeam,
      points: runPoints,
      startMinute: Math.round(runStart * 10) / 10,
      endMinute: Math.round(toGameMinute(lastPlay.period, lastPlay.clock) * 10) / 10,
      description: `${runPoints}-0 ${runTeam === 'home' ? 'home' : 'away'} run`,
    });
  }

  return runs;
}

/**
 * Count lead changes in the game.
 */
export function calculateLeadChanges(plays: PlayData[]): number {
  let leadChanges = 0;
  let previousLeader: 'home' | 'away' | 'tied' = 'tied';

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const diff = play.homeScore - play.awayScore;
    const currentLeader: 'home' | 'away' | 'tied' =
      diff > 0 ? 'home' : diff < 0 ? 'away' : 'tied';

    if (
      currentLeader !== 'tied' &&
      previousLeader !== 'tied' &&
      currentLeader !== previousLeader
    ) {
      leadChanges++;
    }

    previousLeader = currentLeader;
  }

  return leadChanges;
}

/**
 * Find the largest lead in the game.
 */
export function getLargestLead(plays: PlayData[]): {
  team: 'home' | 'away';
  amount: number;
  period: number;
} {
  let maxLead = 0;
  let leadTeam: 'home' | 'away' = 'home';
  let leadPeriod = 1;

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const diff = Math.abs(play.homeScore - play.awayScore);
    if (diff > maxLead) {
      maxLead = diff;
      leadTeam = play.homeScore > play.awayScore ? 'home' : 'away';
      leadPeriod = play.period;
    }
  }

  return { team: leadTeam, amount: maxLead, period: leadPeriod };
}

/**
 * Build a score differential timeline for charting.
 */
export function buildScoreDiffTimeline(plays: PlayData[]): Array<{
  minute: number;
  period: number;
  scoreDiff: number;
  homeScore: number;
  awayScore: number;
}> {
  const timeline: Array<{
    minute: number;
    period: number;
    scoreDiff: number;
    homeScore: number;
    awayScore: number;
  }> = [];

  // Start at 0-0
  timeline.push({ minute: 0, period: 1, scoreDiff: 0, homeScore: 0, awayScore: 0 });

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const minute = toGameMinute(play.period, play.clock);
    timeline.push({
      minute: Math.round(minute * 10) / 10,
      period: play.period,
      scoreDiff: play.homeScore - play.awayScore,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
    });
  }

  return timeline;
}
