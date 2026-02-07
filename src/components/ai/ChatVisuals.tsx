'use client';

// Rich Visual Components for AI Chat Responses
// Thin orchestrator: imports components and routes visual types to renderers

import { TopPlayerComparison } from './TopPlayerComparison';
import { TeamComparisonCard } from './TeamComparisonVisual';
import { EnhancedGameRecap } from './EnhancedGameRecap';
import {
  GameCard,
  GamesGrid,
  PlayerCard,
  PlayersGrid,
  StatsTable,
  StandingsTable,
  LeadersTable,
  ComparisonCard,
  // New visual intelligence components
  WinProbabilityCard,
  GamePredictionCard,
  PlayerProjectionCard,
  MomentumChartCard,
  StreakAnalysisCard,
  ClutchPerformanceCard,
  HomeAwaySplitCard,
  ShotChartCard,
  LineupEffectivenessCard,
  PaceAnalysisCard,
  MilestoneTrackerCard,
  HistoricalComparisonCard,
  TrendingQuestionsCard,
  WatchPriorityCard,
  StoryCard,
  SmartAlertCard,
} from './visuals';

// Re-export types from the single source of truth
export type {
  VisualGameData,
  VisualPlayerData,
  VisualStandingsData,
  VisualStatsTable,
  VisualLeadersData,
  GameRecapTopPlayer,
  RecapTeamTotals,
  GameRecapVisual,
  PlayerComparisonVisual,
  TeamComparisonVisualData,
  AIVisualResponse,
} from '@/types/chat-visuals';

import type { AIVisualResponse } from '@/types/chat-visuals';

// Re-export components for backwards compatibility
export {
  GameCard,
  GamesGrid,
  PlayerCard,
  PlayersGrid,
  StatsTable,
  StandingsTable,
  LeadersTable,
  ComparisonCard,
};
export { StatBox } from './visuals';

// ============================================
// MAIN VISUAL RENDERER
// ============================================

export function AIVisualRenderer({ visual }: { visual: AIVisualResponse }) {
  switch (visual.type) {
    case 'games':
      return <GamesGrid games={visual.data} dateDisplay={visual.dateDisplay} />;
    case 'game':
      return <GameCard game={visual.data} />;
    case 'gameRecap':
      if (visual.data.homeTotals && visual.data.awayTotals) {
        return (
          <EnhancedGameRecap
            gameId={visual.data.gameId}
            homeTeam={{
              name: visual.data.homeTeam.name,
              abbreviation: visual.data.homeTeam.abbreviation,
              score: visual.data.homeTeam.score,
              logo: visual.data.homeTeam.logo,
              record: visual.data.homeTeam.record,
              topPlayers: visual.data.homeTeam.topPlayers,
            }}
            awayTeam={{
              name: visual.data.awayTeam.name,
              abbreviation: visual.data.awayTeam.abbreviation,
              score: visual.data.awayTeam.score,
              logo: visual.data.awayTeam.logo,
              record: visual.data.awayTeam.record,
              topPlayers: visual.data.awayTeam.topPlayers,
            }}
            homeTotals={visual.data.homeTotals}
            awayTotals={visual.data.awayTotals}
            status={visual.data.status}
            venue={visual.data.venue}
            date={visual.data.date}
          />
        );
      }
      return (
        <TopPlayerComparison
          gameId={visual.data.gameId}
          homeTeam={{
            name: visual.data.homeTeam.name,
            abbreviation: visual.data.homeTeam.abbreviation,
            score: visual.data.homeTeam.score,
            logo: visual.data.homeTeam.logo,
            topPlayers: visual.data.homeTeam.topPlayers,
          }}
          awayTeam={{
            name: visual.data.awayTeam.name,
            abbreviation: visual.data.awayTeam.abbreviation,
            score: visual.data.awayTeam.score,
            logo: visual.data.awayTeam.logo,
            topPlayers: visual.data.awayTeam.topPlayers,
          }}
          status={visual.data.status}
        />
      );
    case 'player':
      return <PlayerCard player={visual.data} />;
    case 'players':
      return <PlayersGrid players={visual.data} />;
    case 'standings':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visual.data.map((s) => (
            <StandingsTable key={s.conference} standings={s} />
          ))}
        </div>
      );
    case 'statsTable':
      return <StatsTable table={visual.data} />;
    case 'leaders':
      return <LeadersTable leaders={visual.data} />;
    case 'comparison':
      return <ComparisonCard comparison={visual.data} />;
    case 'teamComparison':
      return <TeamComparisonCard comparison={visual.data} />;

    // ============================================
    // NEW VISUAL INTELLIGENCE COMPONENTS
    // ============================================
    case 'winProbability':
      return <WinProbabilityCard data={visual.data} />;
    case 'gamePrediction':
      return <GamePredictionCard data={visual.data} />;
    case 'playerProjection':
      return <PlayerProjectionCard data={visual.data} />;
    case 'momentumChart':
      return <MomentumChartCard data={visual.data} />;
    case 'streakAnalysis':
      return <StreakAnalysisCard data={visual.data} />;
    case 'clutchPerformance':
      return <ClutchPerformanceCard data={visual.data} />;
    case 'homeAwaySplit':
      return <HomeAwaySplitCard data={visual.data} />;
    case 'shotChart':
      return <ShotChartCard data={visual.data} />;
    case 'lineupEffectiveness':
      return <LineupEffectivenessCard data={visual.data} />;
    case 'paceAnalysis':
      return <PaceAnalysisCard data={visual.data} />;
    case 'milestoneTracker':
      return <MilestoneTrackerCard data={visual.data} />;
    case 'historicalComparison':
      return <HistoricalComparisonCard data={visual.data} />;
    case 'trendingQuestions':
      return <TrendingQuestionsCard data={visual.data} />;
    case 'watchPriority':
      return <WatchPriorityCard data={visual.data} />;
    case 'story':
      return <StoryCard data={visual.data} />;
    case 'smartAlert':
      return <SmartAlertCard data={visual.data} />;

    default:
      return null;
  }
}
