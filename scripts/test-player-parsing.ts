/**
 * Debug script to test ESPN API player stats parsing
 * Run with: npx tsx scripts/test-player-parsing.ts
 */

const GAME_ID = '401810413'; // Utah Jazz vs Cleveland Cavaliers

async function testPlayerParsing() {
  console.log('='.repeat(60));
  console.log(`DEBUGGING PLAYER STATS PARSING FOR GAME ${GAME_ID}`);
  console.log('='.repeat(60));
  
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${GAME_ID}`;
  
  console.log(`\nFetching from: ${url}\n`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const boxscore = data.boxscore;
    
    if (!boxscore?.players) {
      console.error('No boxscore.players found in response');
      return;
    }
    
    console.log(`Found ${boxscore.players.length} teams in boxscore\n`);
    
    // Process each team
    for (const teamData of boxscore.players) {
      const teamName = teamData.team?.displayName || teamData.team?.abbreviation || 'Unknown Team';
      const teamAbbr = teamData.team?.abbreviation || '???';
      
      console.log('='.repeat(60));
      console.log(`TEAM: ${teamName} (${teamAbbr})`);
      console.log('='.repeat(60));
      
      // Get the statistics structure
      const statistics = teamData.statistics || [];
      console.log(`\nStatistics groups: ${statistics.length}`);
      
      if (statistics.length > 0) {
        const statGroup = statistics[0];
        const labels = statGroup.labels || [];
        const athletes = statGroup.athletes || [];
        
        console.log(`\nSTAT LABELS (${labels.length}): ${JSON.stringify(labels)}`);
        console.log(`\nIndex mapping based on labels:`);
        labels.forEach((label: string, idx: number) => {
          console.log(`  [${idx}] = ${label}`);
        });
        
        console.log(`\nPLAYERS (${athletes.length}):\n`);
        
        for (const player of athletes) {
          const playerName = player.athlete?.displayName || 'Unknown';
          const stats = player.stats || [];
          
          // Only show detailed output for Kevin Love
          const isKevinLove = playerName.toLowerCase().includes('kevin love') || 
                              playerName.toLowerCase().includes('k. love');
          
          if (isKevinLove) {
            console.log('*'.repeat(60));
            console.log(`*** FOUND: ${playerName} ***`);
            console.log('*'.repeat(60));
            console.log(`\nRaw stats array (${stats.length} elements):`);
            console.log(JSON.stringify(stats, null, 2));
            
            console.log(`\nIndex-by-index breakdown:`);
            stats.forEach((val: any, idx: number) => {
              const label = labels[idx] || `index_${idx}`;
              console.log(`  [${idx}] ${label}: ${val}`);
            });
            
            // Key indices we care about
            console.log(`\n*** KEY VALUES ***`);
            console.log(`  stats[12] (expected +/-): ${stats[12]}`);
            console.log(`  stats[13] (expected PTS): ${stats[13]}`);
            
            // Parse the values
            const rawIndex12 = stats[12];
            const rawIndex13 = stats[13];
            const parsedIndex12 = parseInt(String(rawIndex12)) || 0;
            const parsedIndex13 = parseInt(String(rawIndex13)) || 0;
            
            console.log(`\n*** PARSING ANALYSIS ***`);
            console.log(`  Parsed index 12: ${parsedIndex12}`);
            console.log(`  Parsed index 13: ${parsedIndex13}`);
            
            if (parsedIndex13 < 0) {
              console.log(`\n  ⚠️  INDEX 13 IS NEGATIVE (${parsedIndex13})`);
              console.log(`  This means ESPN has +/- at index 13, not PTS!`);
              console.log(`  The current parsing logic should detect this and swap.`);
            }
            
            // Try to find PTS by label
            const ptsIndex = labels.findIndex((l: string) => l === 'PTS');
            const plusMinusIndex = labels.findIndex((l: string) => l === '+/-');
            
            console.log(`\n*** LABEL-BASED LOOKUP ***`);
            console.log(`  PTS label at index: ${ptsIndex} (value: ${stats[ptsIndex]})`);
            console.log(`  +/- label at index: ${plusMinusIndex} (value: ${stats[plusMinusIndex]})`);
            
            // Calculate what points SHOULD be from FG + FT
            const fgStr = stats[1] || '0-0';
            const fg3Str = stats[2] || '0-0';
            const ftStr = stats[3] || '0-0';
            
            const parseShooting = (str: string): [number, number] => {
              if (!str || str === '--' || str === '-') return [0, 0];
              const parts = String(str).split('-');
              return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0];
            };
            
            const [fgm, fga] = parseShooting(fgStr);
            const [fg3m, fg3a] = parseShooting(fg3Str);
            const [ftm, fta] = parseShooting(ftStr);
            
            const calculatedPoints = (fgm - fg3m) * 2 + fg3m * 3 + ftm;
            
            console.log(`\n*** CALCULATED FROM SHOOTING ***`);
            console.log(`  FG: ${fgStr} (${fgm}/${fga})`);
            console.log(`  3PT: ${fg3Str} (${fg3m}/${fg3a})`);
            console.log(`  FT: ${ftStr} (${ftm}/${fta})`);
            console.log(`  Calculated PTS: (${fgm}-${fg3m})*2 + ${fg3m}*3 + ${ftm} = ${calculatedPoints}`);
            
            // Test the CORRECT parsing using labels
            console.log(`\n*** TESTING LABEL-BASED PARSING ***`);
            
            // Build label map
            const labelMap: Record<string, number> = {};
            labels.forEach((label: string, idx: number) => {
              labelMap[label.toUpperCase()] = idx;
            });
            
            const getIndex = (labelNames: string[]): number => {
              for (const name of labelNames) {
                if (labelMap[name.toUpperCase()] !== undefined) {
                  return labelMap[name.toUpperCase()];
                }
              }
              return -1;
            };
            
            const ptsIdx = getIndex(['PTS', 'Points']);
            const rebIdx = getIndex(['REB', 'Rebounds']);
            const astIdx = getIndex(['AST', 'Assists']);
            const pmIdx = getIndex(['+/-', 'PM']);
            
            console.log(`  PTS index: ${ptsIdx} → value: ${stats[ptsIdx]}`);
            console.log(`  REB index: ${rebIdx} → value: ${stats[rebIdx]}`);
            console.log(`  AST index: ${astIdx} → value: ${stats[astIdx]}`);
            console.log(`  +/- index: ${pmIdx} → value: ${stats[pmIdx]}`);
            
            const correctPoints = parseInt(stats[ptsIdx]) || 0;
            const correctPlusMinus = stats[pmIdx];
            
            console.log(`\n*** CORRECT VALUES ***`);
            console.log(`  Points: ${Math.max(0, correctPoints)}`);
            console.log(`  +/-: ${correctPlusMinus}`);
            
            console.log('\n' + '*'.repeat(60));
          } else {
            // Brief output for other players - use label-based lookup
            const ptsIdx = labels.findIndex((l: string) => l === 'PTS');
            const pmIdx = labels.findIndex((l: string) => l === '+/-');
            const pts = stats[ptsIdx];
            const plusMinus = stats[pmIdx];
            console.log(`  ${playerName}: PTS=${pts} (idx ${ptsIdx}), +/-=${plusMinus} (idx ${pmIdx})`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

testPlayerParsing();

