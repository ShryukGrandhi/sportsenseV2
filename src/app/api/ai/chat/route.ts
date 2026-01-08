// AI Chat API Route - Enhanced with live data, rich visuals, and player comparisons
// Uses Google Gemini with real-time ESPN data and generates structured visual responses

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '@/lib/logger';
import { fetchAllLiveData, buildAIContext, fetchStandings, fetchAllBoxscores, LiveGameData, fetchScoresByDate, fetchGameBoxscore } from '@/services/nba/live-data';
import { fetchPlayerStats, fetchGameDetail } from '@/services/nba/espn-api';

// ============================================
// TYPE DEFINITIONS FOR VISUAL RESPONSES
// ============================================

interface VisualGameData {
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
}

interface VisualPlayerData {
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

interface VisualStandingsData {
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

interface VisualStatsTable {
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

interface VisualLeadersData {
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

interface PlayerComparisonVisual {
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

type AIVisualResponse =
  | { type: 'games'; data: VisualGameData[] }
  | { type: 'game'; data: VisualGameData }
  | { type: 'game_recap'; data: VisualGameData & { boxscore?: any; topPerformers?: any } }
  | { type: 'player'; data: VisualPlayerData }
  | { type: 'players'; data: VisualPlayerData[] }
  | { type: 'standings'; data: VisualStandingsData[] }
  | { type: 'statsTable'; data: VisualStatsTable }
  | { type: 'leaders'; data: VisualLeadersData }
  | { type: 'comparison'; data: PlayerComparisonVisual };

// ============================================
// PLAYER NAME MAPPINGS
// ============================================

const PLAYER_NAME_MAP: Record<string, string> = {
  // LeBron James - all variations
  'lebron': 'LeBron James',
  'lebron james': 'LeBron James',
  'lbj': 'LeBron James',
  'lebrun': 'LeBron James',
  'lebrun james': 'LeBron James',
  'le bron': 'LeBron James',
  'king james': 'LeBron James',

  // Stephen Curry - all variations
  'curry': 'Stephen Curry',
  'steph': 'Stephen Curry',
  'steph curry': 'Stephen Curry',
  'stephen curry': 'Stephen Curry',
  'chef curry': 'Stephen Curry',
  'currey': 'Stephen Curry',
  'stephan curry': 'Stephen Curry',

  // Kevin Durant
  'kd': 'Kevin Durant',
  'durant': 'Kevin Durant',
  'kevin durant': 'Kevin Durant',
  'durantula': 'Kevin Durant',

  // Giannis Antetokounmpo - many misspellings
  'giannis': 'Giannis Antetokounmpo',
  'greek freak': 'Giannis Antetokounmpo',
  'gianis': 'Giannis Antetokounmpo',
  'gianni': 'Giannis Antetokounmpo',
  'antetokounmpo': 'Giannis Antetokounmpo',
  'giannis antetokounmpo': 'Giannis Antetokounmpo',
  'antetokoumpo': 'Giannis Antetokounmpo',

  // Luka Dončić
  'luka': 'Luka Dončić',
  'luka doncic': 'Luka Dončić',
  'doncic': 'Luka Dončić',
  'luka magic': 'Luka Dončić',
  'wonder boy': 'Luka Dončić',

  // Nikola Jokić
  'jokic': 'Nikola Jokić',
  'nikola jokic': 'Nikola Jokić',
  'the joker': 'Nikola Jokić',
  'joker': 'Nikola Jokić',
  'jokitch': 'Nikola Jokić',

  // Jayson Tatum
  'tatum': 'Jayson Tatum',
  'jayson tatum': 'Jayson Tatum',
  'jt': 'Jayson Tatum',
  'jason tatum': 'Jayson Tatum',

  // Joel Embiid
  'embiid': 'Joel Embiid',
  'joel embiid': 'Joel Embiid',
  'the process': 'Joel Embiid',
  'embid': 'Joel Embiid',
  'embieed': 'Joel Embiid',

  // Anthony Edwards
  'ant': 'Anthony Edwards',
  'anthony edwards': 'Anthony Edwards',
  'ant man': 'Anthony Edwards',
  'a1': 'Anthony Edwards',
  'edwards': 'Anthony Edwards',

  // Shai Gilgeous-Alexander
  'sga': 'Shai Gilgeous-Alexander',
  'shai': 'Shai Gilgeous-Alexander',
  'gilgeous': 'Shai Gilgeous-Alexander',
  'gilgeous-alexander': 'Shai Gilgeous-Alexander',
  'shai gilgeous alexander': 'Shai Gilgeous-Alexander',

  // Devin Booker
  'booker': 'Devin Booker',
  'devin booker': 'Devin Booker',
  'book': 'Devin Booker',
  'd book': 'Devin Booker',

  // Ja Morant
  'morant': 'Ja Morant',
  'ja morant': 'Ja Morant',
  'ja': 'Ja Morant',
  'temetrius': 'Ja Morant',

  // Donovan Mitchell
  'donovan mitchell': 'Donovan Mitchell',
  'spida': 'Donovan Mitchell',
  'mitchell': 'Donovan Mitchell',
  'don mitchell': 'Donovan Mitchell',

  // Jalen Brunson
  'brunson': 'Jalen Brunson',
  'jalen brunson': 'Jalen Brunson',
  'jb': 'Jalen Brunson',

  // De'Aaron Fox
  'fox': 'De\'Aaron Fox',
  'deaaron fox': 'De\'Aaron Fox',
  'de aaron fox': 'De\'Aaron Fox',
  'swipa': 'De\'Aaron Fox',

  // Kawhi Leonard
  'kawhi': 'Kawhi Leonard',
  'kawhi leonard': 'Kawhi Leonard',
  'the claw': 'Kawhi Leonard',
  'klaw': 'Kawhi Leonard',

  // Paul George
  'pg': 'Paul George',
  'paul george': 'Paul George',
  'pg13': 'Paul George',

  // James Harden
  'harden': 'James Harden',
  'james harden': 'James Harden',
  'the beard': 'James Harden',

  // Damian Lillard
  'dame': 'Damian Lillard',
  'damian lillard': 'Damian Lillard',
  'lillard': 'Damian Lillard',
  'dame time': 'Damian Lillard',
  'dame dolla': 'Damian Lillard',

  // Bam Adebayo
  'bam': 'Bam Adebayo',
  'bam adebayo': 'Bam Adebayo',
  'adebayo': 'Bam Adebayo',

  // Jimmy Butler
  'jimmy butler': 'Jimmy Butler',
  'jimmy': 'Jimmy Butler',
  'jimmy buckets': 'Jimmy Butler',
  'butler': 'Jimmy Butler',

  // Victor Wembanyama
  'wemby': 'Victor Wembanyama',
  'wembanyama': 'Victor Wembanyama',
  'victor wembanyama': 'Victor Wembanyama',
  'alien': 'Victor Wembanyama',
  'wembanyana': 'Victor Wembanyama',

  // Jaylen Brown
  'jaylen brown': 'Jaylen Brown',
  'jaylen': 'Jaylen Brown',
  'jb celtics': 'Jaylen Brown',

  // Tyrese Haliburton
  'haliburton': 'Tyrese Haliburton',
  'tyrese haliburton': 'Tyrese Haliburton',
  'hali': 'Tyrese Haliburton',

  // Tyrese Maxey
  'maxey': 'Tyrese Maxey',
  'tyrese maxey': 'Tyrese Maxey',

  // Paolo Banchero
  'paolo': 'Paolo Banchero',
  'paolo banchero': 'Paolo Banchero',
  'banchero': 'Paolo Banchero',

  // Chet Holmgren
  'chet': 'Chet Holmgren',
  'chet holmgren': 'Chet Holmgren',
  'holmgren': 'Chet Holmgren',

  // Trae Young
  'trae': 'Trae Young',
  'trae young': 'Trae Young',
  'ice trae': 'Trae Young',
  'trey young': 'Trae Young',

  // Zion Williamson
  'zion': 'Zion Williamson',
  'zion williamson': 'Zion Williamson',

  // Karl-Anthony Towns
  'kat': 'Karl-Anthony Towns',
  'karl anthony towns': 'Karl-Anthony Towns',
  'towns': 'Karl-Anthony Towns',

  // Domantas Sabonis
  'sabonis': 'Domantas Sabonis',
  'domantas sabonis': 'Domantas Sabonis',

  // Lauri Markkanen
  'lauri': 'Lauri Markkanen',
  'markkanen': 'Lauri Markkanen',
  'lauri markkanen': 'Lauri Markkanen',

  // DeMar DeRozan
  'demar': 'DeMar DeRozan',
  'derozan': 'DeMar DeRozan',
  'demar derozan': 'DeMar DeRozan',

  // Kyrie Irving
  'kyrie': 'Kyrie Irving',
  'kyrie irving': 'Kyrie Irving',
  'uncle drew': 'Kyrie Irving',

  // Russell Westbrook
  'westbrook': 'Russell Westbrook',
  'russ': 'Russell Westbrook',
  'russell westbrook': 'Russell Westbrook',
  'brodie': 'Russell Westbrook',

  // Chris Paul
  'cp3': 'Chris Paul',
  'chris paul': 'Chris Paul',

  // Draymond Green
  'draymond': 'Draymond Green',
  'draymond green': 'Draymond Green',
  'dpoy dray': 'Draymond Green',

  // Klay Thompson
  'klay': 'Klay Thompson',
  'klay thompson': 'Klay Thompson',

  // Rudy Gobert
  'gobert': 'Rudy Gobert',
  'rudy gobert': 'Rudy Gobert',
  'stifle tower': 'Rudy Gobert',

  // LaMelo Ball
  'lamelo': 'LaMelo Ball',
  'lamelo ball': 'LaMelo Ball',
  'melo ball': 'LaMelo Ball',

  // Jaren Jackson Jr
  'jjj': 'Jaren Jackson Jr.',
  'jaren jackson': 'Jaren Jackson Jr.',
  'jaren jackson jr': 'Jaren Jackson Jr.',

  // Austin Reaves
  'reaves': 'Austin Reaves',
  'austin reaves': 'Austin Reaves',
  'ar15': 'Austin Reaves',
  'hillbilly kobe': 'Austin Reaves',

  // Anthony Davis
  'ad': 'Anthony Davis',
  'anthony davis': 'Anthony Davis',
  'the brow': 'Anthony Davis',
  'davis': 'Anthony Davis',
};

// ============================================
// TEAM MAPPINGS
// ============================================

const NBA_TEAMS: Record<string, { id: string; name: string; abbreviation: string; logo: string }> = {
  'lakers': { id: '13', name: 'Los Angeles Lakers', abbreviation: 'LAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
  'celtics': { id: '2', name: 'Boston Celtics', abbreviation: 'BOS', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' },
  'warriors': { id: '9', name: 'Golden State Warriors', abbreviation: 'GSW', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png' },
  'bulls': { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
  'heat': { id: '14', name: 'Miami Heat', abbreviation: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' },
  'nets': { id: '17', name: 'Brooklyn Nets', abbreviation: 'BKN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' },
  'knicks': { id: '18', name: 'New York Knicks', abbreviation: 'NYK', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png' },
  'nuggets': { id: '7', name: 'Denver Nuggets', abbreviation: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' },
  'suns': { id: '21', name: 'Phoenix Suns', abbreviation: 'PHX', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' },
  'mavericks': { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' },
  'mavs': { id: '6', name: 'Dallas Mavericks', abbreviation: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' },
  'bucks': { id: '15', name: 'Milwaukee Bucks', abbreviation: 'MIL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' },
  '76ers': { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' },
  'sixers': { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' },
  'clippers': { id: '12', name: 'Los Angeles Clippers', abbreviation: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' },
  'thunder': { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' },
  'okc': { id: '25', name: 'Oklahoma City Thunder', abbreviation: 'OKC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' },
  'cavaliers': { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' },
  'cavs': { id: '5', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' },
  'timberwolves': { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' },
  'wolves': { id: '16', name: 'Minnesota Timberwolves', abbreviation: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' },
  'kings': { id: '23', name: 'Sacramento Kings', abbreviation: 'SAC', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' },
  'hawks': { id: '1', name: 'Atlanta Hawks', abbreviation: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' },
  'hornets': { id: '30', name: 'Charlotte Hornets', abbreviation: 'CHA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' },
  'pistons': { id: '8', name: 'Detroit Pistons', abbreviation: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' },
  'pacers': { id: '11', name: 'Indiana Pacers', abbreviation: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' },
  'magic': { id: '19', name: 'Orlando Magic', abbreviation: 'ORL', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' },
  'raptors': { id: '28', name: 'Toronto Raptors', abbreviation: 'TOR', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' },
  'wizards': { id: '27', name: 'Washington Wizards', abbreviation: 'WAS', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png' },
  'grizzlies': { id: '29', name: 'Memphis Grizzlies', abbreviation: 'MEM', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' },
  'pelicans': { id: '3', name: 'New Orleans Pelicans', abbreviation: 'NOP', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png' },
  'spurs': { id: '24', name: 'San Antonio Spurs', abbreviation: 'SAS', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png' },
  'rockets': { id: '10', name: 'Houston Rockets', abbreviation: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' },
  'jazz': { id: '26', name: 'Utah Jazz', abbreviation: 'UTA', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png' },
  'blazers': { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' },
  'trailblazers': { id: '22', name: 'Portland Trail Blazers', abbreviation: 'POR', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' },
};

// ============================================
// INTENT DETECTION
// ============================================

// Current date for context (updated on each request)
function getCurrentDateStr(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Parse date from user message - supports various formats
function parseDateFromMessage(message: string): { date: Date; dateStr: string } | null {
  const lowerMsg = message.toLowerCase();
  const today = new Date();

  // Yesterday
  if (lowerMsg.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      date: yesterday,
      dateStr: formatDateForESPN(yesterday)
    };
  }

  // Last night / last game
  if (lowerMsg.includes('last night') || lowerMsg.includes('last game')) {
    const lastNight = new Date(today);
    lastNight.setDate(lastNight.getDate() - 1);
    return {
      date: lastNight,
      dateStr: formatDateForESPN(lastNight)
    };
  }

  // X days ago
  const daysAgoMatch = lowerMsg.match(/(\d+)\s*days?\s*ago/);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - daysAgo);
    return {
      date: pastDate,
      dateStr: formatDateForESPN(pastDate)
    };
  }

  // Specific date patterns: January 5, Jan 5, 1/5/2026, etc.
  const datePatterns = [
    // Month Day, Year (January 5, 2026)
    /(?:on\s+)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/i,
    // MM/DD/YYYY or MM-DD-YYYY
    /(?:on\s+)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    // Month Day (January 5) - assume current/previous year
    /(?:on\s+)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\d)/i,
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      try {
        let dateStr: string;
        if (match[0].includes('/') || match[0].includes('-')) {
          // Numeric format
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          let year = match[3] ? parseInt(match[3]) : today.getFullYear();
          if (year < 100) year += 2000;
          dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
          return { date: new Date(year, month - 1, day), dateStr };
        } else {
          // Text format (January 5, 2026)
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];
          const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

          const monthStr = match[1].toLowerCase();
          let month = monthNames.indexOf(monthStr);
          if (month === -1) month = monthShort.indexOf(monthStr.substring(0, 3));
          if (month === -1) continue;

          const day = parseInt(match[2]);
          let year = match[3] ? parseInt(match[3]) : today.getFullYear();

          const parsed = new Date(year, month, day);
          return { date: parsed, dateStr: formatDateForESPN(parsed) };
        }
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function formatDateForESPN(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

type UserIntent =
  | { type: 'games'; filter?: 'live' | 'today' | 'upcoming' | 'team'; team?: string }
  | { type: 'game_recap'; team: string; date?: string; dateStr?: string }
  | { type: 'standings'; conference?: 'east' | 'west' | 'both' }
  | { type: 'player'; name: string }
  | { type: 'comparison'; player1: string; player2: string }
  | { type: 'team'; name: string }
  | { type: 'leaders'; category?: string }
  | { type: 'general' };

function detectUserIntent(message: string): UserIntent {
  const lowerMsg = message.toLowerCase();

  // Check for player comparison first
  const comparisonPatterns = [
    /compare\s+(.+?)\s+(?:vs?\.?|versus|and|to|with)\s+(.+)/i,
    /(.+?)\s+vs?\.?\s+(.+)/i,
    /who(?:'s| is)\s+better[,:]?\s+(.+?)\s+or\s+(.+)/i,
    /(.+?)\s+or\s+(.+?)\s+who(?:'s| is)\s+better/i,
    /between\s+(.+?)\s+and\s+(.+)/i,
    /would you take\s+(.+?)\s+or\s+(.+)/i,
    /pick\s+(.+?)\s+or\s+(.+)/i,
  ];

  for (const pattern of comparisonPatterns) {
    const match = lowerMsg.match(pattern);
    if (match) {
      let player1 = match[1].trim().replace(/[?!.,]/g, '');
      let player2 = match[2].trim().replace(/[?!.,]/g, '');
      player1 = PLAYER_NAME_MAP[player1.toLowerCase()] || player1;
      player2 = PLAYER_NAME_MAP[player2.toLowerCase()] || player2;
      return { type: 'comparison', player1, player2 };
    }
  }

  // Check for standings
  if (lowerMsg.includes('standing') || lowerMsg.includes('rank') || lowerMsg.includes('playoff') ||
    lowerMsg.includes('seeding') || lowerMsg.includes('conference rank')) {
    if (lowerMsg.includes('east')) return { type: 'standings', conference: 'east' };
    if (lowerMsg.includes('west')) return { type: 'standings', conference: 'west' };
    return { type: 'standings', conference: 'both' };
  }

  // Check for specific player info BEFORE checking for games
  // This ensures player queries get player visuals even if they mention "game" or "today"
  const playerQueryPatterns = [
    /how (?:many|did|is|was|does|has)\s+(?:\w+\s+){0,3}(\w+(?:\s+\w+)?)\s+(?:score|play|do|perform|have|average)/i,
    /(?:tell me about|show me|what about|who is|stats for|statistics for|info on|information on)\s+(.+?)(?:\?|$)/i,
    /(\w+(?:\s+\w+)?(?:'s)?)\s+(?:stats|statistics|performance|numbers|averages|season|career)/i,
    /how\s+(?:is|was|did)\s+(.+?)\s+(?:playing|doing|perform)/i,
    /what(?:'s| is| are)\s+(.+?)'?s?\s+(?:stats|numbers|averages|ppg|rpg|apg)/i,
    /give me\s+(.+?)'?s?\s+(?:stats|numbers|info)/i,
    /(\w+(?:\s+\w+)?)\s+(?:scoring|averaging|putting up|getting)/i,
  ];

  for (const pattern of playerQueryPatterns) {
    const match = lowerMsg.match(pattern);
    if (match) {
      let playerName = match[1].trim().replace(/[?!.,\'s]/g, '').trim();
      // Check if it's a known player (exact match first)
      const fullName = PLAYER_NAME_MAP[playerName.toLowerCase()];
      if (fullName) {
        return { type: 'player', name: fullName };
      }
      // Check partial matches in player map
      for (const [nickname, full] of Object.entries(PLAYER_NAME_MAP)) {
        if (playerName.toLowerCase().includes(nickname) || nickname.includes(playerName.toLowerCase())) {
          return { type: 'player', name: full };
        }
      }
      // Use fuzzy matching for misspellings
      for (const [nickname, full] of Object.entries(PLAYER_NAME_MAP)) {
        if (levenshteinDistance(playerName.toLowerCase(), nickname) <= 2) {
          console.log(`[Intent] Fuzzy matched "${playerName}" to "${full}"`);
          return { type: 'player', name: full };
        }
      }
    }
  }

  // Check for known player names directly (including fuzzy matching)
  for (const [nickname, fullName] of Object.entries(PLAYER_NAME_MAP)) {
    if (lowerMsg.includes(nickname)) {
      return { type: 'player', name: fullName };
    }
  }

  // Fuzzy match player names in the message
  const words = lowerMsg.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    // Check single words and two-word combinations
    const singleWord = words[i].replace(/[?!.,]/g, '');
    const twoWords = i < words.length - 1 ? `${singleWord} ${words[i + 1].replace(/[?!.,]/g, '')}` : '';

    for (const [nickname, fullName] of Object.entries(PLAYER_NAME_MAP)) {
      if (levenshteinDistance(singleWord, nickname) <= 2 && singleWord.length > 3) {
        console.log(`[Intent] Fuzzy matched word "${singleWord}" to "${fullName}"`);
        return { type: 'player', name: fullName };
      }
      if (twoWords && levenshteinDistance(twoWords, nickname) <= 2) {
        console.log(`[Intent] Fuzzy matched phrase "${twoWords}" to "${fullName}"`);
        return { type: 'player', name: fullName };
      }
    }
  }

  // Check for game recap requests (specific game on specific date)
  // This should come BEFORE general game checks
  const recapKeywords = ['recap', 'summary', 'how did', 'what happened', 'result', 'highlights'];
  const hasRecapKeyword = recapKeywords.some(kw => lowerMsg.includes(kw));
  const parsedDate = parseDateFromMessage(message);

  // If there's a date reference and a team mention, it's likely a game recap request
  if ((hasRecapKeyword || parsedDate) && (lowerMsg.includes('game') || hasRecapKeyword)) {
    for (const [key, team] of Object.entries(NBA_TEAMS)) {
      if (lowerMsg.includes(key)) {
        const dateInfo = parsedDate || { dateStr: formatDateForESPN(new Date()), date: new Date() };
        console.log(`[Intent] Game recap detected for ${team.name} on ${dateInfo.dateStr}`);
        return {
          type: 'game_recap',
          team: team.name,
          date: dateInfo.date.toDateString(),
          dateStr: dateInfo.dateStr
        };
      }
    }
  }

  // Check for games/scores (after player check)
  // Be more specific about game-related queries
  const gameKeywords = ['score', 'playing tonight', 'playing today', 'live game', 'current game',
    'what games', 'any games', 'games tonight', 'games today', 'games on'];
  const hasGameKeyword = gameKeywords.some(kw => lowerMsg.includes(kw));

  if (hasGameKeyword || (lowerMsg.includes('live') && !lowerMsg.includes('live up to'))) {
    // Check for specific team
    for (const [key, team] of Object.entries(NBA_TEAMS)) {
      if (lowerMsg.includes(key)) {
        return { type: 'games', filter: 'team', team: team.abbreviation };
      }
    }

    if (lowerMsg.includes('live')) return { type: 'games', filter: 'live' };
    return { type: 'games', filter: 'today' };
  }

  // Check for team info
  for (const [key, team] of Object.entries(NBA_TEAMS)) {
    if (lowerMsg.includes(key)) {
      return { type: 'team', name: team.name };
    }
  }

  // Check for leaders/stats
  if (lowerMsg.includes('leader') || lowerMsg.includes('top scorer') ||
    lowerMsg.includes('mvp') || lowerMsg.includes('who leads') ||
    lowerMsg.includes('scoring leader') || lowerMsg.includes('best player')) {
    return { type: 'leaders' };
  }

  return { type: 'general' };
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

async function searchPlayer(playerName: string): Promise<{ id: string; name: string; team: string; teamLogo: string; position: string } | null> {
  try {
    console.log(`[Player Search] Searching for: "${playerName}"`);
    const searchUrl = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(playerName)}&limit=10&type=player`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.log(`[Player Search] Search request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // ESPN API returns 'items' not 'results'
    const results = data.items || data.results || [];
    console.log(`[Player Search] Found ${results.length} total results`);

    // Log all results for debugging
    results.forEach((r: any, i: number) => {
      console.log(`[Player Search] Result ${i}: ${r.displayName} (type: ${r.type}, league: ${r.league}, sport: ${r.sport})`);
    });

    // First pass: exact NBA match (league can be string 'nba' or object)
    for (const result of results) {
      const isNBA = result.league === 'nba' ||
        result.league?.toLowerCase?.() === 'nba' ||
        result.league?.abbreviation === 'NBA' ||
        result.defaultLeagueSlug === 'nba';

      if (result.type === 'player' && isNBA) {
        // Get team info from teamRelationships
        const teamRel = result.teamRelationships?.[0]?.core || result.team;
        const teamName = teamRel?.displayName || result.teamRelationships?.[0]?.displayName || 'Unknown';
        const teamAbbr = teamRel?.abbreviation || 'nba';
        const teamLogo = teamRel?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${teamAbbr.toLowerCase()}.png`;

        console.log(`[Player Search] Found NBA player: ${result.displayName} (ID: ${result.id}, Team: ${teamName})`);
        return {
          id: result.id,
          name: result.displayName || playerName,
          team: teamName,
          teamLogo: teamLogo,
          position: result.position || 'N/A',
        };
      }
    }

    // Second pass: any basketball player
    for (const result of results) {
      if (result.type === 'player' && result.sport === 'basketball') {
        const teamRel = result.teamRelationships?.[0]?.core || result.team;
        const teamName = teamRel?.displayName || result.teamRelationships?.[0]?.displayName || 'Unknown';
        const teamAbbr = teamRel?.abbreviation || 'nba';
        const teamLogo = teamRel?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${teamAbbr.toLowerCase()}.png`;

        console.log(`[Player Search] Found basketball player (fallback): ${result.displayName} (ID: ${result.id})`);
        return {
          id: result.id,
          name: result.displayName || playerName,
          team: teamName,
          teamLogo: teamLogo,
          position: result.position || 'N/A',
        };
      }
    }

    console.log(`[Player Search] No NBA player found for "${playerName}"`);
    return null;
  } catch (error) {
    console.error('[Player Search] Error:', error);
    return null;
  }
}

type ExtendedPlayerStats = VisualPlayerData['stats'] & {
  gamesPlayed?: number;
  careerPpg?: number;
  careerRpg?: number;
  careerApg?: number;
  careerGames?: number;
};

async function fetchPlayerSeasonStats(playerId: string): Promise<ExtendedPlayerStats | null> {
  try {
    // Use the same function that the game analytics page uses
    const seasonStats = await fetchPlayerStats(playerId);

    if (!seasonStats) {
      console.log(`[Player Stats] No stats found for player ${playerId}`);
      return null;
    }

    console.log(`[Player Stats] Raw stats for ${playerId}:`, {
      pointsPerGame: seasonStats.pointsPerGame,
      reboundsPerGame: seasonStats.reboundsPerGame,
      assistsPerGame: seasonStats.assistsPerGame,
      fgPct: seasonStats.fgPct,
    });

    // Convert ESPNPlayerSeasonStats to ExtendedPlayerStats format
    // Note: ESPN returns percentages as whole numbers (e.g., 51.26 not 0.5126)
    const converted = {
      ppg: seasonStats.pointsPerGame || 0,
      rpg: seasonStats.reboundsPerGame || 0,
      apg: seasonStats.assistsPerGame || 0,
      spg: seasonStats.stealsPerGame || 0,
      bpg: seasonStats.blocksPerGame || 0,
      fgPct: seasonStats.fgPct || 0, // Already a percentage (51.26 = 51.26%)
      fg3Pct: seasonStats.fg3Pct || 0,
      ftPct: seasonStats.ftPct || 0,
      mpg: seasonStats.minutesPerGame || 0,
      gamesPlayed: seasonStats.gamesPlayed || 0,
    };

    console.log(`[Player Stats] Converted stats for ${playerId}:`, converted);

    return converted;
  } catch (error) {
    console.error('[Player Stats] Error:', error);
    return null;
  }
}

async function fetchFullPlayerData(playerName: string): Promise<VisualPlayerData | null> {
  console.log(`[Player Data] Fetching full data for: ${playerName}`);

  const playerInfo = await searchPlayer(playerName);
  if (!playerInfo) {
    console.log(`[Player Data] Player not found: ${playerName}`);
    return null;
  }

  console.log(`[Player Data] Found player: ${playerInfo.name} (${playerInfo.id})`);

  // Fetch player stats directly - this is the same function used by game analytics
  const fullPlayerStats = await fetchPlayerStats(playerInfo.id);

  console.log(`[Player Data] Full player stats for ${playerInfo.name}:`, fullPlayerStats);

  if (!fullPlayerStats) {
    console.log(`[Player Data] WARNING: No stats found for ${playerInfo.name} (${playerInfo.id})`);
  } else {
    console.log(`[Player Data] Stats found - PPG: ${fullPlayerStats.pointsPerGame}, RPG: ${fullPlayerStats.reboundsPerGame}, APG: ${fullPlayerStats.assistsPerGame}`);
  }

  // Convert ESPNPlayerSeasonStats to our format
  // Note: ESPN returns percentages as whole numbers (e.g., 51.26 not 0.5126)
  const finalStats: ExtendedPlayerStats = fullPlayerStats ? {
    ppg: fullPlayerStats.pointsPerGame || 0,
    rpg: fullPlayerStats.reboundsPerGame || 0,
    apg: fullPlayerStats.assistsPerGame || 0,
    spg: fullPlayerStats.stealsPerGame || 0,
    bpg: fullPlayerStats.blocksPerGame || 0,
    fgPct: fullPlayerStats.fgPct || 0, // Already a percentage (51.26 = 51.26%)
    fg3Pct: fullPlayerStats.fg3Pct || 0,
    ftPct: fullPlayerStats.ftPct || 0,
    mpg: fullPlayerStats.minutesPerGame || 0,
    gamesPlayed: fullPlayerStats.gamesPlayed || 0,
  } : { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0, mpg: 0, gamesPlayed: 0 };

  console.log(`[Player Data] Final converted stats for ${playerInfo.name}:`, finalStats);

  const result: VisualPlayerData = {
    id: playerInfo.id,
    name: playerInfo.name,
    team: playerInfo.team,
    teamLogo: playerInfo.teamLogo,
    headshot: fullPlayerStats?.headshot || `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${playerInfo.id}.png&w=350&h=254`,
    position: fullPlayerStats?.position || playerInfo.position,
    number: fullPlayerStats?.jersey || undefined,
    stats: finalStats,
  };

  console.log(`[Player Data] Returning player data for ${playerInfo.name} with stats:`, result.stats);

  return result;
}

// Search for player stats in today's games boxscores
function findPlayerInBoxscores(playerName: string, liveContext: string): string | null {
  const normalizedName = playerName.toLowerCase();

  // Search through the context for player stats
  const lines = liveContext.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if this line contains the player's stats
    // Format: "    PlayerName: Xpts, Xreb, Xast, ..."
    const namePart = lowerLine.split(':')[0]?.trim();
    if (namePart && (
      namePart.includes(normalizedName) ||
      normalizedName.includes(namePart) ||
      levenshteinDistance(namePart, normalizedName) <= 3
    )) {
      return line.trim();
    }
  }

  return null;
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function convertGameToVisual(game: LiveGameData): VisualGameData {
  const getTeamLogo = (abbr: string) =>
    `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;

  return {
    gameId: game.gameId,
    homeTeam: {
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      logo: getTeamLogo(game.homeTeam.abbreviation),
      score: game.homeTeam.score,
      record: game.homeTeam.record,
    },
    awayTeam: {
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      logo: getTeamLogo(game.awayTeam.abbreviation),
      score: game.awayTeam.score,
      record: game.awayTeam.record,
    },
    status: game.status,
    period: game.period,
    clock: game.clock,
    venue: game.venue,
    broadcast: game.broadcast,
  };
}

// ============================================
// VISUAL RESPONSE GENERATION
// ============================================

async function generateVisualResponse(intent: UserIntent, liveData: any): Promise<AIVisualResponse | null> {
  try {
    switch (intent.type) {
      case 'games': {
        let games = liveData.games as LiveGameData[];

        if (intent.filter === 'live') {
          games = games.filter(g => g.status === 'live' || g.status === 'halftime');
        } else if (intent.filter === 'team' && intent.team) {
          games = games.filter(g =>
            g.homeTeam.abbreviation === intent.team ||
            g.awayTeam.abbreviation === intent.team
          );
        }

        if (games.length === 0) return null;

        return {
          type: 'games',
          data: games.map(convertGameToVisual),
        };
      }

      case 'standings': {
        const standingsData = await fetchStandings();
        const result: VisualStandingsData[] = [];

        if (intent.conference !== 'west' && standingsData.east.length > 0) {
          result.push({
            conference: 'East',
            teams: standingsData.east.map((team, i) => ({
              rank: i + 1,
              name: team.name,
              abbreviation: team.abbreviation,
              logo: `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`,
              wins: team.wins,
              losses: team.losses,
              winPct: team.winPct,
              gamesBehind: team.gamesBehind,
              streak: team.streak,
              isPlayoff: i < 6,
              isPlayIn: i >= 6 && i < 10,
            })),
          });
        }

        if (intent.conference !== 'east' && standingsData.west.length > 0) {
          result.push({
            conference: 'West',
            teams: standingsData.west.map((team, i) => ({
              rank: i + 1,
              name: team.name,
              abbreviation: team.abbreviation,
              logo: `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`,
              wins: team.wins,
              losses: team.losses,
              winPct: team.winPct,
              gamesBehind: team.gamesBehind,
              streak: team.streak,
              isPlayoff: i < 6,
              isPlayIn: i >= 6 && i < 10,
            })),
          });
        }

        if (result.length === 0) return null;

        return { type: 'standings', data: result };
      }

      case 'player': {
        const player = await fetchFullPlayerData(intent.name);
        if (!player) {
          // Always return a visual for player queries, even if data fetch fails
          // Return a minimal player object so the visual can still be shown
          return {
            type: 'player',
            data: {
              id: '',
              name: intent.name,
              team: 'Unknown',
              teamLogo: '',
              headshot: '',
              position: '',
              stats: { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0, mpg: 0 },
            },
          };
        }

        // Check if player has game stats from today
        const boxscores = await fetchAllBoxscores(liveData.games as LiveGameData[]);
        for (const game of boxscores) {
          const allPlayers = [...game.homePlayers, ...game.awayPlayers];
          const playerStats = allPlayers.find(p =>
            p.name.toLowerCase().includes(player.name.toLowerCase().split(' ')[1] || player.name.toLowerCase()) ||
            player.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[1] || p.name.toLowerCase())
          );

          if (playerStats) {
            player.gameStats = {
              points: playerStats.points,
              rebounds: playerStats.rebounds,
              assists: playerStats.assists,
              steals: playerStats.steals,
              blocks: playerStats.blocks,
              minutes: playerStats.minutes,
              fgm: playerStats.fgm,
              fga: playerStats.fga,
              fg3m: playerStats.fg3m,
              fg3a: playerStats.fg3a,
            };
            break;
          }
        }

        return { type: 'player', data: player };
      }

      case 'comparison': {
        const [player1, player2] = await Promise.all([
          fetchFullPlayerData(intent.player1),
          fetchFullPlayerData(intent.player2),
        ]);

        // Always return a visual for comparison queries, even if data fetch fails
        // Use fetched data or create minimal placeholder objects
        const p1 = player1 || {
          id: '',
          name: intent.player1,
          team: 'Unknown',
          teamLogo: '',
          headshot: '',
          position: '',
          stats: { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0, mpg: 0 },
        };

        const p2 = player2 || {
          id: '',
          name: intent.player2,
          team: 'Unknown',
          teamLogo: '',
          headshot: '',
          position: '',
          stats: { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0, mpg: 0 },
        };

        // Format percentages correctly - stats come as percentages already (e.g., 51.26 not 0.5126)
        const formatPct = (val: number) => val > 1 ? val.toFixed(1) + '%' : (val * 100).toFixed(1) + '%';

        const categories: PlayerComparisonVisual['categories'] = [
          { name: 'PPG', player1Value: p1.stats.ppg?.toFixed(1) || '0.0', player2Value: p2.stats.ppg?.toFixed(1) || '0.0', winner: (p1.stats.ppg || 0) > (p2.stats.ppg || 0) ? 'player1' : (p2.stats.ppg || 0) > (p1.stats.ppg || 0) ? 'player2' : 'tie' },
          { name: 'RPG', player1Value: p1.stats.rpg?.toFixed(1) || '0.0', player2Value: p2.stats.rpg?.toFixed(1) || '0.0', winner: (p1.stats.rpg || 0) > (p2.stats.rpg || 0) ? 'player1' : (p2.stats.rpg || 0) > (p1.stats.rpg || 0) ? 'player2' : 'tie' },
          { name: 'APG', player1Value: p1.stats.apg?.toFixed(1) || '0.0', player2Value: p2.stats.apg?.toFixed(1) || '0.0', winner: (p1.stats.apg || 0) > (p2.stats.apg || 0) ? 'player1' : (p2.stats.apg || 0) > (p1.stats.apg || 0) ? 'player2' : 'tie' },
          { name: 'SPG', player1Value: p1.stats.spg?.toFixed(1) || '0.0', player2Value: p2.stats.spg?.toFixed(1) || '0.0', winner: (p1.stats.spg || 0) > (p2.stats.spg || 0) ? 'player1' : (p2.stats.spg || 0) > (p1.stats.spg || 0) ? 'player2' : 'tie' },
          { name: 'BPG', player1Value: p1.stats.bpg?.toFixed(1) || '0.0', player2Value: p2.stats.bpg?.toFixed(1) || '0.0', winner: (p1.stats.bpg || 0) > (p2.stats.bpg || 0) ? 'player1' : (p2.stats.bpg || 0) > (p1.stats.bpg || 0) ? 'player2' : 'tie' },
          { name: 'FG%', player1Value: formatPct(p1.stats.fgPct || 0), player2Value: formatPct(p2.stats.fgPct || 0), winner: (p1.stats.fgPct || 0) > (p2.stats.fgPct || 0) ? 'player1' : (p2.stats.fgPct || 0) > (p1.stats.fgPct || 0) ? 'player2' : 'tie' },
          { name: '3P%', player1Value: formatPct(p1.stats.fg3Pct || 0), player2Value: formatPct(p2.stats.fg3Pct || 0), winner: (p1.stats.fg3Pct || 0) > (p2.stats.fg3Pct || 0) ? 'player1' : (p2.stats.fg3Pct || 0) > (p1.stats.fg3Pct || 0) ? 'player2' : 'tie' },
          { name: 'FT%', player1Value: formatPct(p1.stats.ftPct || 0), player2Value: formatPct(p2.stats.ftPct || 0), winner: (p1.stats.ftPct || 0) > (p2.stats.ftPct || 0) ? 'player1' : (p2.stats.ftPct || 0) > (p1.stats.ftPct || 0) ? 'player2' : 'tie' },
        ];

        return {
          type: 'comparison',
          data: {
            player1: p1,
            player2: p2,
            verdict: '', // Will be filled by AI
            categories,
          },
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('[Visual Response] Error generating visual:', error);
    return null;
  }
}

// ============================================
// GEMINI AI CONFIGURATION
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
try {
  genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
} catch (e) {
  console.error('[AI Module] Failed to initialize GoogleGenerativeAI:', e);
}

const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro-latest',
  'gemini-1.0-pro',
];

let currentModelIndex = 0;

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const PERSONALITY_PROMPTS: Record<string, string> = {
  default: `You are Playmaker AI, a knowledgeable sports companion who gets straight to the point.
Lead with FACTS and STATS. Skip filler phrases like "Great question!" or "That's interesting!"
Be conversational but substantive. Every sentence should add value.`,

  hype: `You are PLAYMAKER AI and you are HYPED! 🔥
Lead with the stats that matter, then bring the energy!
Use emphasis and emojis but ALWAYS include real numbers.
Every response needs SUBSTANCE behind the hype!`,

  drunk: `You're Playmaker AI at the bar after a few beers 🍺
You're chill and have hot takes, but you still know your stats.
Casual language, some slang, but keep it informative...`,

  announcer: `You are PLAYMAKER AI, the legendary sports broadcaster.
Lead with key stats and context before painting the picture.
Use broadcaster phrases but anchor them in real data.`,

  analyst: `You are Playmaker AI in full analyst mode.
Lead with advanced statistics: efficiency, plus/minus, pace, shot selection.
Every claim needs data backing. Be direct and analytical.`,
};

const LENGTH_CONFIG: Record<string, { maxTokens: number; instruction: string }> = {
  short: { maxTokens: 150, instruction: 'Keep your response very brief - 1-2 sentences max. No filler phrases.' },
  medium: { maxTokens: 350, instruction: 'Give a moderate response - 3-4 sentences. Lead with facts, skip pleasantries.' },
  long: { maxTokens: 600, instruction: 'Provide a detailed response with full context. Stay substantive throughout.' },
};

// ============================================
// API REQUEST HANDLER
// ============================================

interface ChatRequest {
  message: string;
  personality?: 'default' | 'hype' | 'drunk' | 'announcer' | 'analyst';
  length?: 'short' | 'medium' | 'long';
  type?: 'general' | 'game';
  requestVisuals?: boolean;
  gameContext?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    period: number | null;
    gameClock: string | null;
    status: string;
  };
}

export async function POST(request: Request) {
  console.log('[AI Chat] Received request');

  let parsedMessage = '';

  try {
    let body: ChatRequest;
    try {
      body = await request.json();
      parsedMessage = body.message || '';
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        response: "I couldn't understand your request. Please try again!"
      }, { status: 400 });
    }

    const {
      message,
      personality = 'default',
      length = 'medium',
      type = 'general',
      requestVisuals = true,
      gameContext
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Detect user intent
    const intent = detectUserIntent(message);
    console.log('[AI Chat] Detected intent:', intent.type);

    // Reinitialize genAI if needed
    let ai = genAI;
    if (!ai && GEMINI_API_KEY) {
      try {
        ai = new GoogleGenerativeAI(GEMINI_API_KEY);
      } catch (initError) {
        console.error('[AI Chat] Failed to reinitialize genAI:', initError);
      }
    }

    // Fetch live data and boxscores
    console.log('[AI Chat] Fetching live NBA data and boxscores...');
    let liveData;
    let liveContext;
    try {
      liveData = await fetchAllLiveData();

      // Fetch detailed boxscores for live/final games to get individual player stats
      const boxscores = await fetchAllBoxscores(liveData.games);
      console.log(`[AI Chat] Fetched ${boxscores.length} game boxscores with individual player stats`);

      liveContext = buildAIContext(liveData, boxscores);
    } catch (dataError) {
      console.error('[AI Chat] Failed to fetch live data:', dataError);
      liveData = { games: [], lastUpdated: new Date().toISOString(), source: 'ESPN (unavailable)', sourceUrl: 'https://www.espn.com/nba/' };
      liveContext = 'Live data unavailable.';
    }

    // Generate visual response based on intent
    let visualResponse: AIVisualResponse | null = null;
    let historicalGameContext = '';

    if (requestVisuals && intent.type !== 'general') {
      console.log('[AI Chat] Generating visual response for intent:', intent.type);

      // Special handling for game_recap - fetch historical data
      if (intent.type === 'game_recap' && intent.dateStr) {
        console.log(`[AI Chat] Fetching historical game for ${intent.team} on ${intent.dateStr}`);
        try {
          const historicalData = await fetchScoresByDate(intent.dateStr);
          console.log(`[AI Chat] Found ${historicalData.games.length} games on ${intent.dateStr}`);

          // Find the team's game
          const teamGame = historicalData.games.find(g =>
            g.homeTeam.name.toLowerCase().includes(intent.team.toLowerCase().split(' ').pop() || '') ||
            g.awayTeam.name.toLowerCase().includes(intent.team.toLowerCase().split(' ').pop() || '')
          );

          if (teamGame) {
            console.log(`[AI Chat] Found game: ${teamGame.awayTeam.name} @ ${teamGame.homeTeam.name}`);

            // Fetch detailed boxscore for this game
            const boxscore = await fetchGameBoxscore(teamGame.gameId);

            const getTeamLogo = (abbr: string) =>
              `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;

            visualResponse = {
              type: 'game_recap',
              data: {
                gameId: teamGame.gameId,
                homeTeam: {
                  name: teamGame.homeTeam.name,
                  abbreviation: teamGame.homeTeam.abbreviation,
                  logo: getTeamLogo(teamGame.homeTeam.abbreviation),
                  score: teamGame.homeTeam.score,
                  record: teamGame.homeTeam.record,
                },
                awayTeam: {
                  name: teamGame.awayTeam.name,
                  abbreviation: teamGame.awayTeam.abbreviation,
                  logo: getTeamLogo(teamGame.awayTeam.abbreviation),
                  score: teamGame.awayTeam.score,
                  record: teamGame.awayTeam.record,
                },
                status: teamGame.status,
                period: teamGame.period,
                venue: teamGame.venue,
                boxscore: boxscore,
              }
            };

            // Build context for AI with detailed game info
            historicalGameContext = `\n\n===== HISTORICAL GAME DATA (${intent.date}) =====\n`;
            historicalGameContext += `${teamGame.awayTeam.name} ${teamGame.awayTeam.score} @ ${teamGame.homeTeam.name} ${teamGame.homeTeam.score} (${teamGame.status})\n`;
            historicalGameContext += `Venue: ${teamGame.venue || 'Unknown'}\n`;

            if (boxscore) {
              historicalGameContext += `\n--- TOP PERFORMERS ---\n`;
              historicalGameContext += `${teamGame.homeTeam.abbreviation}:\n`;
              boxscore.homePlayers.slice(0, 3).forEach((p: any) => {
                historicalGameContext += `  ${p.name}: ${p.points}pts, ${p.rebounds}reb, ${p.assists}ast\n`;
              });
              historicalGameContext += `${teamGame.awayTeam.abbreviation}:\n`;
              boxscore.awayPlayers.slice(0, 3).forEach((p: any) => {
                historicalGameContext += `  ${p.name}: ${p.points}pts, ${p.rebounds}reb, ${p.assists}ast\n`;
              });
            }
            historicalGameContext += `===== END HISTORICAL DATA =====`;
          } else {
            console.log(`[AI Chat] No game found for ${intent.team} on ${intent.dateStr}`);
            // Provide context that no game was found
            historicalGameContext = `\nNo game found for ${intent.team} on ${intent.date}. Available games on that date: ${historicalData.games.map(g => `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`).join(', ') || 'No games found'}`;
          }
        } catch (histError) {
          console.error('[AI Chat] Failed to fetch historical game:', histError);
          historicalGameContext = `\nCould not retrieve historical game data for ${intent.date}. ESPN may not have data for that date.`;
        }
      } else {
        visualResponse = await generateVisualResponse(intent, liveData);
      }
      console.log('[AI Chat] Visual response generated:', !!visualResponse);
    }

    // Build context for AI based on visual data
    let visualContext = '';
    if (visualResponse) {
      switch (visualResponse.type) {
        case 'games':
          visualContext = `\n\nVISUAL DATA BEING SHOWN TO USER:\nThe user will see a visual grid of ${visualResponse.data.length} games. Here are the games:\n`;
          visualResponse.data.forEach(g => {
            visualContext += `- ${g.awayTeam.abbreviation} ${g.awayTeam.score} @ ${g.homeTeam.abbreviation} ${g.homeTeam.score} (${g.status})\n`;
          });
          visualContext += '\nProvide commentary on these games. DO NOT list the scores again - the user can see them in the visual.';
          break;
        case 'game_recap':
          const recap = visualResponse.data;
          visualContext = `\n\nVISUAL DATA BEING SHOWN TO USER:\nThe user will see a game recap card showing ${recap.awayTeam.name} ${recap.awayTeam.score} @ ${recap.homeTeam.name} ${recap.homeTeam.score}.\nProvide a narrative recap of the game - key moments, standout performances, what the score doesn't tell you. Be insightful, not just stats.`;
          break;
        case 'standings':
          visualContext = `\n\nVISUAL DATA BEING SHOWN TO USER:\nThe user will see standings tables. Provide analysis and insights about the standings. DO NOT list the rankings again.`;
          break;
        case 'player':
          const p = visualResponse.data;
          visualContext = `\n\nVISUAL DATA BEING SHOWN TO USER:\nThe user will see a player card for ${p.name} (${p.team}) with stats:\n- PPG: ${p.stats.ppg}, RPG: ${p.stats.rpg}, APG: ${p.stats.apg}\nProvide analysis and insights. DO NOT repeat the basic stats.`;
          break;
        case 'comparison':
          const { player1, player2, categories } = visualResponse.data;
          const p1Wins = categories.filter(c => c.winner === 'player1').length;
          const p2Wins = categories.filter(c => c.winner === 'player2').length;
          visualContext = `\n\nVISUAL DATA BEING SHOWN TO USER:\nThe user will see a comparison card between ${player1.name} and ${player2.name}.\n`;
          visualContext += `${player1.name} wins ${p1Wins} categories, ${player2.name} wins ${p2Wins} categories.\n`;
          visualContext += 'Provide your VERDICT on who is better overall and WHY. Be specific about strengths/weaknesses. The user can see the raw numbers.';
          break;
      }
    }

    // If no AI configured, return visual-only response
    if (!ai) {
      return NextResponse.json({
        response: visualResponse ? "Here's what I found! Check out the data above. 📊" : "I'm having trouble connecting to my brain right now!",
        visual: visualResponse,
        model: 'none',
      });
    }

    // Get personality and length settings
    const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.default;
    const lengthSettings = LENGTH_CONFIG[length] || LENGTH_CONFIG.medium;

    // Build game-specific context if provided
    let gameSpecificContext = '';
    if (type === 'game' && gameContext) {
      gameSpecificContext = `\nSPECIFIC GAME FOCUS:\n${gameContext.awayTeam} @ ${gameContext.homeTeam}\nScore: ${gameContext.awayScore ?? 0} - ${gameContext.homeScore ?? 0}\nStatus: ${gameContext.status}`;
    }

    // Build the full prompt
    const fullPrompt = `${personalityPrompt}

${lengthSettings.instruction}

CURRENT DATE: ${getCurrentDateStr()}

You are an expert NBA analyst with access to REAL-TIME and HISTORICAL NBA data. CRITICAL RULES:

1. UNDERSTAND THE QUESTION FIRST - Figure out what the user actually wants:
   - If they mention a player name (even misspelled), give info about THAT PLAYER
   - If they ask about games/scores, check if they specified a DATE
   - If they ask about "yesterday" or a specific date, use the HISTORICAL DATA provided
   - DO NOT default to today's games unless specifically asked about TODAY

2. DATE AWARENESS:
   - Today is ${getCurrentDateStr()}
   - If the user asks about "yesterday", that's the day before today
   - If they ask about a specific date (e.g., "January 5, 2026"), use historical data
   - You CAN access historical games - just tell them what you found

3. BE DIRECT AND FACT-FOCUSED:
   - NEVER start with "Great question!", "That's a good one!", or similar filler
   - Lead with the most important fact or stat
   - For game recaps, tell the STORY of the game, not just stats
   - Include key moments, momentum shifts, standout performances

4. GAME RECAPS should include:
   - Final score and winner
   - Top performers with their stats
   - Key plays or turning points
   - Context (win streak, rivalry, playoff implications)
   - What the numbers DON'T tell you

5. VISUAL-AWARE:
   - If showing a visual card, DON'T repeat the raw stats - provide ANALYSIS and NARRATIVE

${visualContext ? 'IMPORTANT: A visual card is being shown to the user. Add narrative and context, not repetition of visible stats.' : ''}
${historicalGameContext}

===== LIVE DATA (Today's Games) =====
${liveContext}
===== END DATA =====
${gameSpecificContext}
${visualContext}

USER: ${message}

Respond directly to what the user asked. For game recaps, tell the story. Lead with facts. Be concise but informative:`;

    // Try models in order until one works
    let result;
    let usedModel = '';
    let lastError: Error | null = null;

    for (let i = currentModelIndex; i < GEMINI_MODELS.length; i++) {
      const modelName = GEMINI_MODELS[i];

      try {
        const model = ai.getGenerativeModel({
          model: modelName,
          safetySettings: SAFETY_SETTINGS,
          generationConfig: {
            maxOutputTokens: lengthSettings.maxTokens,
            temperature: personality === 'hype' ? 0.9 : personality === 'analyst' ? 0.3 : 0.7,
          },
        });

        result = await model.generateContent(fullPrompt);
        usedModel = modelName;
        currentModelIndex = i;
        break;
      } catch (genError: any) {
        console.error(`[AI Chat] Model ${modelName} failed:`, genError?.message);
        lastError = genError;
      }
    }

    if (!result) {
      throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    const response = result.response.text();

    // If comparison, add verdict to visual
    if (visualResponse?.type === 'comparison') {
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      visualResponse.data.verdict = sentences.slice(-2).join('. ').trim() + '.';
    }

    return NextResponse.json({
      response,
      visual: visualResponse,
      model: usedModel,
      personality,
      length,
      intent: intent.type,
      dataSource: liveData.source,
      dataTimestamp: liveData.lastUpdated,
      gamesCount: liveData.games.length,
    });

  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[AI Chat Error]', errorMsg);
    logger.error('AI chat error', { error: errorMsg });

    return NextResponse.json({
      response: "I hit a snag! 🏀 Check ESPN.com for the latest: https://www.espn.com/nba/",
      error: errorMsg,
      sourceUrl: 'https://www.espn.com/nba/',
    }, { status: 200 });
  }
}
