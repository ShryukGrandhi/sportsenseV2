'use client';

interface PlayerStats {
  gamesPlayed: number;
  gamesStarted?: number;
  minutesPerGame: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  plusMinus?: number;
}

interface PlayerStatsDisplayProps {
  stats: PlayerStats;
  className?: string;
}

export function PlayerStatsDisplay({ stats, className = '' }: PlayerStatsDisplayProps) {
  const statGroups = [
    {
      title: 'Scoring',
      stats: [
        { label: 'PPG', value: stats.pointsPerGame.toFixed(1), highlight: true },
        { label: 'FG%', value: `${stats.fgPct.toFixed(1)}%` },
        { label: '3P%', value: `${stats.fg3Pct.toFixed(1)}%` },
        { label: 'FT%', value: `${stats.ftPct.toFixed(1)}%` },
      ],
    },
    {
      title: 'Playmaking',
      stats: [
        { label: 'APG', value: stats.assistsPerGame.toFixed(1), highlight: true },
        { label: 'TOV', value: stats.turnoversPerGame.toFixed(1) },
        { label: 'A/TO', value: stats.turnoversPerGame > 0 
          ? (stats.assistsPerGame / stats.turnoversPerGame).toFixed(2) 
          : '-' 
        },
      ],
    },
    {
      title: 'Rebounding & Defense',
      stats: [
        { label: 'RPG', value: stats.reboundsPerGame.toFixed(1), highlight: true },
        { label: 'SPG', value: stats.stealsPerGame.toFixed(1) },
        { label: 'BPG', value: stats.blocksPerGame.toFixed(1) },
      ],
    },
    {
      title: 'Usage',
      stats: [
        { label: 'GP', value: stats.gamesPlayed.toString() },
        { label: 'GS', value: stats.gamesStarted?.toString() || '-' },
        { label: 'MPG', value: stats.minutesPerGame.toFixed(1) },
        ...(stats.plusMinus !== undefined ? [{ label: '+/-', value: stats.plusMinus > 0 ? `+${stats.plusMinus.toFixed(1)}` : stats.plusMinus.toFixed(1) }] : []),
      ],
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statGroups.map((group) => (
        <div key={group.title} className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            {group.title}
          </h4>
          <div className="space-y-2">
            {group.stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{stat.label}</span>
                <span className={`font-semibold ${stat.highlight ? 'text-xl text-white' : 'text-gray-200'}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Game log table component
interface GameLog {
  gameId: string;
  date: string;
  opponent: string;
  isHome: boolean;
  result: 'W' | 'L';
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
}

interface GameLogTableProps {
  gameLogs: GameLog[];
  className?: string;
}

export function GameLogTable({ gameLogs, className = '' }: GameLogTableProps) {
  if (gameLogs.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center text-gray-400 ${className}`}>
        No recent games available
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700/50 text-gray-400 uppercase text-xs">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Opp</th>
              <th className="px-4 py-3 text-center">Result</th>
              <th className="px-4 py-3 text-right">MIN</th>
              <th className="px-4 py-3 text-right">PTS</th>
              <th className="px-4 py-3 text-right">REB</th>
              <th className="px-4 py-3 text-right">AST</th>
              <th className="px-4 py-3 text-right">STL</th>
              <th className="px-4 py-3 text-right">BLK</th>
              <th className="px-4 py-3 text-right">FG</th>
              <th className="px-4 py-3 text-right">3PT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {gameLogs.map((game, index) => (
              <tr key={game.gameId || index} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 text-gray-300">
                  {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    game.result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {game.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-300">{game.minutes}</td>
                <td className="px-4 py-3 text-right font-medium text-white">{game.points}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.rebounds}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.assists}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.steals}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.blocks}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.fgm}-{game.fga}</td>
                <td className="px-4 py-3 text-right text-gray-300">{game.fg3m}-{game.fg3a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
