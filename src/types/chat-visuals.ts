// ============================================
// TYPE DEFINITIONS for AI Chat Visuals
// Single source of truth for all visual response types
// ============================================

export interface VisualGameData {
  gameId: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: number;
    record?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: number;
    record?: string;
  };
  status: 'scheduled' | 'live' | 'halftime' | 'final';
  period?: number;
  clock?: string;
  venue?: string;
  broadcast?: string;
  date?: string;
}

export interface VisualPlayerData {
  id: string;
  name: string;
  team: string;
  teamLogo: string;
  headshot: string;
  position: string;
  number?: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    spg?: number;
    bpg?: number;
    fgPct?: number;
    fg3Pct?: number;
    ftPct?: number;
    mpg?: number;
    gp?: number;
    gamesPlayed?: number;
  };
  careerStats?: {
    ppg: number;
    rpg: number;
    apg: number;
    games: number;
  };
  gameStats?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    minutes: string;
    fgm: number;
    fga: number;
    fg3m: number;
    fg3a: number;
  };
}

export interface VisualStandingsData {
  conference: 'East' | 'West';
  teams: Array<{
    rank: number;
    name: string;
    abbreviation: string;
    logo: string;
    wins: number;
    losses: number;
    winPct: string;
    gamesBehind: string;
    streak?: string;
    isPlayoff?: boolean;
    isPlayIn?: boolean;
  }>;
}

export interface VisualStatsTable {
  title: string;
  headers: string[];
  rows: Array<{
    label: string;
    values: (string | number)[];
    highlight?: 'home' | 'away' | 'none';
  }>;
  homeTeam?: string;
  awayTeam?: string;
}

export interface VisualLeadersData {
  category: string;
  players: Array<{
    rank: number;
    name: string;
    team: string;
    teamLogo: string;
    headshot: string;
    value: number | string;
    trend?: 'up' | 'down' | 'same';
  }>;
}

export interface GameRecapTopPlayer {
  name: string;
  headshot?: string;
  minutes: string;
  points: number;
  rebounds: number;
  assists: number;
  fg3m: number;
  fg3a: number;
  fgm?: number;
  fga?: number;
  plusMinus?: string;
}

export interface RecapTeamTotals {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
}

export interface GameRecapVisual {
  gameId: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: number;
    record?: string;
    topPlayers: GameRecapTopPlayer[];
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: number;
    record?: string;
    topPlayers: GameRecapTopPlayer[];
  };
  homeTotals?: RecapTeamTotals;
  awayTotals?: RecapTeamTotals;
  status: 'scheduled' | 'live' | 'halftime' | 'final';
  venue?: string;
  broadcast?: string;
  date?: string;
}

export interface PlayerComparisonVisual {
  player1: VisualPlayerData;
  player2: VisualPlayerData;
  verdict: string;
  categories: Array<{
    name: string;
    player1Value: number | string;
    player2Value: number | string;
    winner: 'player1' | 'player2' | 'tie';
  }>;
}

export interface TeamComparisonVisualData {
  team1: {
    name: string;
    abbreviation: string;
    logo: string;
    record: { wins: number; losses: number; winPct: string };
    stats: { ppg: number; oppg: number; rpg: number; apg: number; fgPct: number; fg3Pct: number; ftPct: number };
  };
  team2: {
    name: string;
    abbreviation: string;
    logo: string;
    record: { wins: number; losses: number; winPct: string };
    stats: { ppg: number; oppg: number; rpg: number; apg: number; fgPct: number; fg3Pct: number; ftPct: number };
  };
  categories: Array<{
    name: string;
    team1Value: string | number;
    team2Value: string | number;
    winner: 'team1' | 'team2' | 'tie';
  }>;
}

// ============================================
// NEW VISUAL TYPES (Phase 1-4)
// ============================================

export interface WinProbabilityVisual {
  gameId: string;
  homeTeam: { name: string; abbreviation: string; logo: string };
  awayTeam: { name: string; abbreviation: string; logo: string };
  currentProbability: number; // 0-100 for home team
  timeline: Array<{
    minute: number;
    period: number;
    homeProb: number;
    scoreDiff: number;
    label?: string;
  }>;
  pivotalMoments: Array<{
    minute: number;
    period: number;
    description: string;
    probSwing: number;
  }>;
  status: 'live' | 'halftime' | 'final';
}

export interface GamePredictionVisual {
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    record: string;
    predictedScore: number;
    recentForm: string; // e.g. "W-W-L-W-W"
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    record: string;
    predictedScore: number;
    recentForm: string;
  };
  homeWinProbability: number;
  keyMatchups: Array<{
    category: string;
    homeValue: string | number;
    awayValue: string | number;
    edge: 'home' | 'away' | 'even';
  }>;
  gameTime?: string;
  venue?: string;
}

export interface PlayerProjectionVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
    position: string;
  };
  projectedStats: {
    points: { value: number; low: number; high: number };
    rebounds: { value: number; low: number; high: number };
    assists: { value: number; low: number; high: number };
    fg3m?: { value: number; low: number; high: number };
  };
  seasonAvg: { points: number; rebounds: number; assists: number };
  recentTrend: Array<{
    game: string;
    points: number;
    rebounds: number;
    assists: number;
  }>;
  opponent?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MomentumChartVisual {
  gameId: string;
  homeTeam: { name: string; abbreviation: string; logo: string };
  awayTeam: { name: string; abbreviation: string; logo: string };
  timeline: Array<{
    minute: number;
    period: number;
    scoreDiff: number; // positive = home leading
    homeScore: number;
    awayScore: number;
  }>;
  scoringRuns: Array<{
    team: 'home' | 'away';
    points: number;
    startMinute: number;
    endMinute: number;
    description: string;
  }>;
  leadChanges: number;
  largestLead: { team: 'home' | 'away'; amount: number; period: number };
  status: 'live' | 'halftime' | 'final';
}

export interface StreakAnalysisVisual {
  subject: { name: string; logo?: string; type: 'team' | 'player'; headshot?: string };
  currentStreak: { type: 'W' | 'L'; count: number };
  recentGames: Array<{
    opponent: string;
    opponentLogo: string;
    result: 'W' | 'L';
    score: string;
    points?: number;
    date: string;
    isHome: boolean;
  }>;
  record: { wins: number; losses: number; last10: string };
  trend: 'hot' | 'cold' | 'neutral';
}

export interface ClutchPerformanceVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
  };
  clutchStats: {
    clutchPoints: number;
    clutchFgPct: number;
    clutchGames: number;
    totalCloseGames: number;
    gameWinners: number;
  };
  clutchRating: number; // 0-100
  notableMoments: Array<{
    opponent: string;
    date: string;
    description: string;
    points: number;
  }>;
}

export interface HomeAwaySplitVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
  };
  home: {
    games: number;
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    fg3Pct: number;
    record: string;
  };
  away: {
    games: number;
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    fg3Pct: number;
    record: string;
  };
  biggestDifference: { stat: string; homeDiff: number };
}

export interface ShotChartVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
  };
  zones: {
    paint: { made: number; attempted: number; pct: number };
    midrange: { made: number; attempted: number; pct: number };
    threePoint: { made: number; attempted: number; pct: number };
  };
  totals: { fgm: number; fga: number; fgPct: number; fg3m: number; fg3a: number; fg3Pct: number };
  isEstimated: boolean;
}

export interface LineupEffectivenessVisual {
  gameId: string;
  team: { name: string; abbreviation: string; logo: string };
  starters: Array<{
    name: string;
    headshot?: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: string;
    plusMinus: string;
  }>;
  bench: Array<{
    name: string;
    headshot?: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: string;
    plusMinus: string;
  }>;
  starterPoints: number;
  benchPoints: number;
  starterPlusMinus: number;
  benchPlusMinus: number;
}

export interface PaceAnalysisVisual {
  gameId: string;
  homeTeam: { name: string; abbreviation: string; logo: string; pace: number };
  awayTeam: { name: string; abbreviation: string; logo: string; pace: number };
  leagueAvgPace: number;
  scoringByQuarter: Array<{
    quarter: string;
    homePoints: number;
    awayPoints: number;
  }>;
  totalPossessions: { home: number; away: number };
  pointsPerPossession: { home: number; away: number };
}

export interface MilestoneTrackerVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
  };
  milestones: Array<{
    name: string;
    target: number;
    current: number;
    remaining: number;
    estimatedGames: number;
    percentComplete: number;
    category: 'points' | 'rebounds' | 'assists' | 'games';
  }>;
  careerTotals: {
    points: number;
    rebounds: number;
    assists: number;
    games: number;
  };
}

export interface HistoricalComparisonVisual {
  player: {
    name: string;
    headshot: string;
    team: string;
    teamLogo: string;
  };
  currentSeason: {
    year: string;
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    fg3Pct: number;
    gamesPlayed: number;
  };
  comparisonSeason: {
    year: string;
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    fg3Pct: number;
    gamesPlayed: number;
  };
  changes: Array<{
    stat: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    improved: boolean;
  }>;
}

export interface TrendingQuestionsVisual {
  questions: Array<{
    text: string;
    category: 'game' | 'player' | 'team' | 'standings' | 'analytics';
    icon?: string;
  }>;
  context?: string;
}

export interface WatchPriorityVisual {
  games: Array<{
    gameId: string;
    homeTeam: { name: string; abbreviation: string; logo: string; record: string };
    awayTeam: { name: string; abbreviation: string; logo: string; record: string };
    watchScore: number; // 1-100
    reasons: string[];
    gameTime: string;
    status: 'scheduled' | 'live' | 'halftime' | 'final';
    tags: string[];
  }>;
}

export interface StoryCardVisual {
  gameId: string;
  headline: string;
  homeTeam: { name: string; abbreviation: string; logo: string; score: number };
  awayTeam: { name: string; abbreviation: string; logo: string; score: number };
  quarters: Array<{
    quarter: string;
    summary: string;
    homePoints: number;
    awayPoints: number;
    keyPlay?: string;
  }>;
  mvp: {
    name: string;
    headshot?: string;
    team: string;
    points: number;
    rebounds: number;
    assists: number;
  };
  turningPoint?: {
    period: number;
    description: string;
  };
  status: 'live' | 'halftime' | 'final';
}

export interface SmartAlertVisual {
  alerts: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    type: 'streak' | 'milestone' | 'upset' | 'injury' | 'record' | 'standings';
    title: string;
    description: string;
    team?: { name: string; abbreviation: string; logo: string };
    player?: { name: string; headshot: string };
    timestamp?: string;
  }>;
}

// ============================================
// DISCRIMINATED UNION - All Visual Response Types
// ============================================

export type AIVisualResponse =
  | { type: 'games'; data: VisualGameData[]; dateDisplay?: string }
  | { type: 'game'; data: VisualGameData }
  | { type: 'gameRecap'; data: GameRecapVisual }
  | { type: 'player'; data: VisualPlayerData }
  | { type: 'players'; data: VisualPlayerData[] }
  | { type: 'standings'; data: VisualStandingsData[] }
  | { type: 'statsTable'; data: VisualStatsTable }
  | { type: 'leaders'; data: VisualLeadersData }
  | { type: 'comparison'; data: PlayerComparisonVisual }
  | { type: 'teamComparison'; data: TeamComparisonVisualData }
  // New visual types
  | { type: 'winProbability'; data: WinProbabilityVisual }
  | { type: 'gamePrediction'; data: GamePredictionVisual }
  | { type: 'playerProjection'; data: PlayerProjectionVisual }
  | { type: 'momentumChart'; data: MomentumChartVisual }
  | { type: 'streakAnalysis'; data: StreakAnalysisVisual }
  | { type: 'clutchPerformance'; data: ClutchPerformanceVisual }
  | { type: 'homeAwaySplit'; data: HomeAwaySplitVisual }
  | { type: 'shotChart'; data: ShotChartVisual }
  | { type: 'lineupEffectiveness'; data: LineupEffectivenessVisual }
  | { type: 'paceAnalysis'; data: PaceAnalysisVisual }
  | { type: 'milestoneTracker'; data: MilestoneTrackerVisual }
  | { type: 'historicalComparison'; data: HistoricalComparisonVisual }
  | { type: 'trendingQuestions'; data: TrendingQuestionsVisual }
  | { type: 'watchPriority'; data: WatchPriorityVisual }
  | { type: 'story'; data: StoryCardVisual }
  | { type: 'smartAlert'; data: SmartAlertVisual };
