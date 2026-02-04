// VAPI Webhook Endpoint - Handles function calls from VAPI voice assistant
//
// Architecture: When GPT-4o calls get_nba_info, VAPI sends the function call here.
// We fetch live data DIRECTLY from ESPN APIs (no Gemini dependency).
// This eliminates rate-limit issues and ensures fast, reliable data delivery.

import { NextResponse } from 'next/server';
import {
  fetchLiveScores,
  fetchStandings,
  buildAIContext,
} from '@/services/nba/live-data';
import {
  searchPlayers,
  fetchPlayerStats,
  fetchTeamDetail,
  fetchPlayerGameLogs,
} from '@/services/nba/espn-api';

// ============================================================
// TEAM NAME LOOKUP - Maps common names/cities to ESPN team IDs
// ============================================================

const TEAM_LOOKUP: Record<string, string> = {
  // Team names
  hawks: '1', celtics: '2', nets: '17', hornets: '30', bulls: '4',
  cavaliers: '5', cavs: '5', mavericks: '6', mavs: '6', nuggets: '7',
  pistons: '8', warriors: '9', dubs: '9', rockets: '10', pacers: '11',
  clippers: '12', lakers: '13', grizzlies: '29', grizz: '29', heat: '14',
  bucks: '15', timberwolves: '16', wolves: '16', pelicans: '3', pels: '3',
  knicks: '18', thunder: '25', magic: '19', sixers: '20', '76ers': '20',
  suns: '21', blazers: '22', 'trail blazers': '22', kings: '23',
  spurs: '24', raptors: '28', jazz: '26', wizards: '27',
  // City names
  atlanta: '1', boston: '2', brooklyn: '17', charlotte: '30', chicago: '4',
  cleveland: '5', dallas: '6', denver: '7', detroit: '8',
  'golden state': '9', houston: '10', indiana: '11',
  'la clippers': '12', 'la lakers': '13',
  'los angeles clippers': '12', 'los angeles lakers': '13',
  memphis: '29', miami: '14', milwaukee: '15', minnesota: '16',
  'new orleans': '3', 'new york': '18', 'oklahoma city': '25', okc: '25',
  orlando: '19', philadelphia: '20', philly: '20', phoenix: '21',
  portland: '22', sacramento: '23', 'san antonio': '24',
  toronto: '28', utah: '26', washington: '27',
};

// ============================================================
// QUERY CLASSIFICATION & DATA FETCHING
// ============================================================

/**
 * Finds a team ID from the query text.
 * Returns the ESPN team ID or null.
 */
function findTeamInQuery(query: string): { teamId: string; teamName: string } | null {
  const q = query.toLowerCase();

  // Check longest names first to avoid partial matches
  const sortedNames = Object.keys(TEAM_LOOKUP).sort((a, b) => b.length - a.length);
  for (const name of sortedNames) {
    if (q.includes(name)) {
      return { teamId: TEAM_LOOKUP[name], teamName: name };
    }
  }
  return null;
}

/**
 * Extracts a player name from a query by stripping question/stat words.
 */
function extractPlayerName(query: string): string | null {
  const q = query.toLowerCase().trim();

  // Common patterns: "LeBron James stats", "stats for LeBron", "how is Curry doing"
  const patterns = [
    /(?:stats?|averages?|numbers?|statline|stat line)\s+(?:for|of|on)\s+(.+?)(?:\s+this|\s+last|\?|$)/i,
    /(.+?)(?:'s|'s)?\s+(?:stats?|averages?|numbers?|statline|season)/i,
    /(?:how (?:is|has|was)|how's)\s+(.+?)(?:\s+(?:doing|playing|performed|been))/i,
    /(?:tell me about|info on|look up|search for|find)\s+(.+?)(?:\s+stats?|\?|$)/i,
    /(?:what (?:are|is))\s+(.+?)(?:'s|'s)?\s+(?:stats?|averages?|numbers?)/i,
    /(?:player)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match && match[1]) {
      const name = match[1]
        .replace(/(?:nba|basketball|player|the)\s*/gi, '')
        .trim();
      if (name.length > 1) return name;
    }
  }

  return null;
}

/**
 * Fetches NBA data directly from ESPN based on the query.
 * No Gemini dependency - pure ESPN API calls.
 */
async function fetchNBADataDirect(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  console.log('[Webhook] Processing query:', q);

  try {
    // === STANDINGS ===
    if (
      q.includes('standing') ||
      q.includes('rankings') ||
      q.includes('playoff') ||
      q.includes('seeds') ||
      q.includes('conference rank') ||
      q.includes('who is leading')
    ) {
      console.log('[Webhook] Fetching standings');
      const standings = await fetchStandings();
      const lines: string[] = ['NBA STANDINGS:'];

      lines.push('', 'EASTERN CONFERENCE:');
      for (const t of standings.east) {
        let line = `${t.name}: ${t.wins}-${t.losses} (${t.winPct})`;
        if (t.streak) line += `, Streak: ${t.streak}`;
        if (t.lastTen) line += `, Last 10: ${t.lastTen}`;
        lines.push(line);
      }

      lines.push('', 'WESTERN CONFERENCE:');
      for (const t of standings.west) {
        let line = `${t.name}: ${t.wins}-${t.losses} (${t.winPct})`;
        if (t.streak) line += `, Streak: ${t.streak}`;
        if (t.lastTen) line += `, Last 10: ${t.lastTen}`;
        lines.push(line);
      }

      return lines.join('\n');
    }

    // === PLAYER STATS ===
    const playerName = extractPlayerName(q);
    if (playerName) {
      console.log('[Webhook] Searching player:', playerName);
      const players = await searchPlayers(playerName, 3);

      if (players.length > 0) {
        const player = players[0];
        const stats = await fetchPlayerStats(player.id);
        const lines: string[] = [];

        lines.push(`${player.displayName}`);
        if (player.team?.name) lines[0] += ` (${player.team.name})`;
        if (player.position) lines[0] += ` - ${player.position}`;

        if (stats) {
          lines.push(`Season Stats:`);
          lines.push(`Points: ${stats.pointsPerGame} per game`);
          lines.push(`Rebounds: ${stats.reboundsPerGame} per game`);
          lines.push(`Assists: ${stats.assistsPerGame} per game`);
          lines.push(`Steals: ${stats.stealsPerGame} per game`);
          lines.push(`Blocks: ${stats.blocksPerGame} per game`);
          lines.push(`Field Goal: ${stats.fgPct}%`);
          lines.push(`Three Point: ${stats.fg3Pct}%`);
          lines.push(`Free Throw: ${stats.ftPct}%`);
          lines.push(`Minutes: ${stats.minutesPerGame} per game`);
          lines.push(`Games Played: ${stats.gamesPlayed}`);
        } else {
          lines.push('Stats not available right now.');
        }

        // Also check for recent game logs
        try {
          const gameLogs = await fetchPlayerGameLogs(player.id, 3);
          if (gameLogs.length > 0) {
            lines.push('', 'Recent Games:');
            for (const g of gameLogs) {
              lines.push(
                `${g.date} vs ${g.opponent}: ${g.points} PTS, ${g.rebounds} REB, ${g.assists} AST`
              );
            }
          }
        } catch {
          // Game logs are optional, skip if they fail
        }

        return lines.join('\n');
      } else {
        return `Could not find an NBA player matching "${playerName}". Try using their full name.`;
      }
    }

    // === TEAM INFO / RECORD ===
    const teamMatch = findTeamInQuery(q);
    if (
      teamMatch &&
      (q.includes('record') ||
        q.includes('roster') ||
        q.includes('team') ||
        q.includes('injuries') ||
        q.includes('injured') ||
        q.includes('how are') ||
        q.includes("how's") ||
        q.includes('doing'))
    ) {
      console.log('[Webhook] Fetching team info:', teamMatch.teamName);
      const team = await fetchTeamDetail(teamMatch.teamId);

      if (team) {
        const lines: string[] = [];
        lines.push(`${team.displayName}`);
        lines.push(`Record: ${team.record.wins}-${team.record.losses} (${team.record.winPct})`);
        lines.push(`Conference: ${team.standing.conference}, Rank: #${team.standing.rank}`);
        lines.push(
          `Stats: ${team.stats.ppg} PPG, ${team.stats.oppg} OPP PPG, ${team.stats.rpg} RPG, ${team.stats.apg} APG`
        );
        lines.push(`Shooting: ${team.stats.fgPct}% FG, ${team.stats.fg3Pct}% 3PT, ${team.stats.ftPct}% FT`);

        if (team.injuries.length > 0) {
          lines.push('', 'Injuries:');
          for (const inj of team.injuries.slice(0, 5)) {
            lines.push(`${inj.player.displayName}: ${inj.status} - ${inj.description}`);
          }
        }

        if (team.schedule.recent.length > 0) {
          lines.push('', 'Recent Games:');
          for (const g of team.schedule.recent.slice(0, 5)) {
            lines.push(`${g.result} vs ${g.opponent} (${g.score})`);
          }
        }

        return lines.join('\n');
      }
    }

    // === SCORES / GAMES (default) ===
    // This covers: "today's scores", "who's playing", "games tonight",
    // "what happened last night", and any unclassified NBA query
    console.log('[Webhook] Fetching live scores (default)');
    const liveData = await fetchLiveScores();

    if (liveData.games.length === 0) {
      return 'No NBA games scheduled for today. Check back later or ask about standings or player stats.';
    }

    return buildAIContext(liveData);
  } catch (error) {
    console.error('[Webhook] Data fetch error:', error);
    return 'I had trouble getting the latest NBA data. Try asking again in a moment.';
  }
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'VAPI webhook active. Fetches live NBA data directly from ESPN.',
    endpoint: '/api/vapi/webhook',
    method: 'POST',
    architecture: 'direct-espn-fetch',
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const messageType = body.message?.type || body.type || 'unknown';
    console.log('[Vapi Webhook] Event:', messageType);

    // ============================================================
    // HANDLE FUNCTION CALLS
    // ============================================================

    if (messageType === 'function-call') {
      const functionCall = body.message?.functionCall || body.functionCall;

      if (!functionCall) {
        console.warn('[Vapi Webhook] function-call event with no data');
        return NextResponse.json({ result: 'No function call data received.' });
      }

      const funcName = functionCall.name;
      const params = functionCall.parameters || {};
      console.log('[Vapi Webhook] Function:', funcName, 'params:', JSON.stringify(params));

      if (funcName === 'get_nba_info') {
        const query = params.query || 'today NBA scores';
        const result = await fetchNBADataDirect(query);
        const elapsed = Date.now() - startTime;
        console.log('[Vapi Webhook] Completed in', elapsed, 'ms, result:', result.substring(0, 200));
        return NextResponse.json({ result });
      }

      return NextResponse.json({ result: `Unknown function: ${funcName}` });
    }

    // ============================================================
    // HANDLE TOOL CALLS (newer VAPI format)
    // ============================================================

    if (messageType === 'tool-calls') {
      const toolCalls =
        body.message?.toolCallList ||
        body.message?.toolCalls ||
        body.toolCallList ||
        body.toolCalls ||
        [];

      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        return NextResponse.json({ results: [] });
      }

      console.log('[Vapi Webhook] Processing', toolCalls.length, 'tool call(s)');

      const results = [];
      for (const tc of toolCalls) {
        const toolCallId = tc.id || tc.toolCallId || '';
        const funcName = tc.function?.name || tc.name || '';
        let params: Record<string, string> = {};

        if (typeof tc.function?.arguments === 'string') {
          try {
            params = JSON.parse(tc.function.arguments);
          } catch {
            params = { query: tc.function.arguments };
          }
        } else if (tc.function?.arguments) {
          params = tc.function.arguments;
        } else if (tc.parameters) {
          params = tc.parameters;
        }

        if (funcName === 'get_nba_info') {
          const query = params.query || 'today NBA scores';
          const result = await fetchNBADataDirect(query);
          results.push({ toolCallId, result });
        } else {
          results.push({ toolCallId, result: `Unknown function: ${funcName}` });
        }
      }

      const elapsed = Date.now() - startTime;
      console.log('[Vapi Webhook] Tool calls completed in', elapsed, 'ms');
      return NextResponse.json({ results });
    }

    // ============================================================
    // ALL OTHER EVENTS - acknowledge and move on
    // ============================================================

    if (messageType === 'status-update') {
      console.log('[Vapi Webhook] Status:', body.message?.status || 'unknown');
    } else if (messageType !== 'conversation-update' && messageType !== 'speech-update') {
      console.log('[Vapi Webhook] Event:', messageType);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    return NextResponse.json({ result: 'Internal error processing request.' });
  }
}
