/**
 * Test SSE Stream endpoint
 * Run with: npx tsx scripts/test-sse-stream.ts
 */

const SSE_URL = 'http://localhost:3000/api/live/nba/stream';

async function testSSEStream() {
  console.log('='.repeat(60));
  console.log('  SSE STREAM DEBUG TEST');
  console.log('='.repeat(60));
  
  console.log(`\n📡 Connecting to: ${SSE_URL}\n`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log('\n⏱️  Test timeout (15s) - closing connection');
      controller.abort();
    }, 15000);
    
    const response = await fetch(SSE_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    
    console.log('📥 Response received:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      console.log('\n❌ ERROR: Bad response status');
      const text = await response.text();
      console.log('   Body:', text.slice(0, 500));
      return;
    }
    
    if (!response.body) {
      console.log('\n❌ ERROR: No response body (stream not supported)');
      return;
    }
    
    console.log('\n✅ SSE connection established! Reading stream...\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n📪 Stream closed by server');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          messageCount++;
          const data = line.slice(5).trim();
          
          try {
            const parsed = JSON.parse(data);
            console.log(`\n📨 Message #${messageCount} (${parsed.type}):`);
            
            if (parsed.type === 'connected') {
              console.log('   ✅ Initial connection confirmed');
            } else if (parsed.type === 'update') {
              console.log(`   📊 Games: ${parsed.games?.length || 0}`);
              console.log(`   🔴 Live: ${parsed.liveCount || 0}`);
              console.log(`   ⏰ Timestamp: ${new Date(parsed.timestamp).toISOString()}`);
              
              if (parsed.games?.length > 0) {
                const sample = parsed.games[0];
                console.log(`   📋 Sample game: ${sample.awayTeam?.abbreviation || '?'} @ ${sample.homeTeam?.abbreviation || '?'} (${sample.status})`);
              }
            } else if (parsed.type === 'error') {
              console.log(`   ❌ Server error: ${parsed.message}`);
            }
          } catch (e) {
            console.log(`   Raw: ${data.slice(0, 100)}...`);
          }
        } else if (line.startsWith(':')) {
          // Heartbeat/comment
          console.log(`   💓 Heartbeat: ${line}`);
        }
      }
      
      // After 3 messages, we've proven it works
      if (messageCount >= 3) {
        console.log('\n✅ SSE stream is working! Received 3 messages.');
        clearTimeout(timeout);
        controller.abort();
        break;
      }
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('\n✅ Test completed (connection aborted as expected)');
    } else {
      console.log('\n❌ CONNECTION ERROR:\n');
      console.log(`   ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n   ⚠️  Is the dev server running? Start it with: npm run dev');
      }
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Also test the regular live endpoint
async function testLiveEndpoint() {
  console.log('Testing /api/live/nba endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/live/nba');
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Live endpoint works`);
      console.log(`   Games: ${data.games?.length || 0}`);
      console.log(`   Source: ${data.source}`);
    } else {
      console.log(`❌ Failed: ${response.statusText}`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  await testLiveEndpoint();
  await testSSEStream();
}

main();
