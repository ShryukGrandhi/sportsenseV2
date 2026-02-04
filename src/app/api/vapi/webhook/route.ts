// VAPI Webhook Endpoint - Handles function calls from VAPI voice assistant
//
// Architecture: VAPI's serverUrl receives two types of messages:
// 1. Server messages (conversation-update, speech-update, status-update) - informational, we ignore these
// 2. Function calls (function-call) - when GPT-4o calls our get_nba_info tool
//
// For function calls, we proxy the query to our chatbot API which has full
// live NBA data access (ESPN scores, player stats, standings, etc.)

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Formats chatbot response for natural voice output.
 * Strips markdown, converts formatting to speech-friendly text.
 */
function formatForVoice(text: string): string {
  let result = text;

  // Remove markdown bold/italic
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');

  // Remove markdown headers
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Convert bullet points to natural speech
  result = result.replace(/^[\s]*[-•]\s+/gm, '');

  // Remove markdown links, keep text
  result = result.replace(/\[(.+?)\]\(.+?\)/g, '$1');

  // Convert multiple newlines to sentence breaks
  result = result.replace(/\n{2,}/g, '. ');
  result = result.replace(/\n/g, '. ');

  // Clean up multiple periods/spaces
  result = result.replace(/\.\s*\.\s*/g, '. ');
  result = result.replace(/\s{2,}/g, ' ');

  // Remove any JSON/code blocks
  result = result.replace(/```json[\s\S]*?```/g, '');
  result = result.replace(/```[\s\S]*?```/g, '');
  result = result.replace(/\{"correctedStats"[\s\S]*?\}/g, '');

  return result.trim();
}

/**
 * Calls the SportsSense chatbot API with a query and returns the response text.
 */
async function fetchFromChatbot(query: string): Promise<string> {
  const chatbotUrl = `${BASE_URL}/api/ai/chat`;
  console.log('[Vapi Webhook] Calling chatbot:', chatbotUrl, 'query:', query.substring(0, 80));

  const startTime = Date.now();

  const response = await fetch(chatbotUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      personality: 'default',
      length: 'short',
      type: 'general',
      requestVisuals: false,
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log('[Vapi Webhook] Chatbot responded in', elapsed, 'ms, status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Vapi Webhook] Chatbot error:', response.status, errorText);
    return 'I had trouble fetching the latest NBA data. Please try asking again.';
  }

  const data = await response.json();
  const rawResponse = data.response || '';

  if (!rawResponse) {
    return 'I could not find that information right now. Try asking about today\'s NBA games or a specific player.';
  }

  return formatForVoice(rawResponse);
}

// GET handler for testing/verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'VAPI webhook endpoint is active. Handles function calls for get_nba_info.',
    endpoint: '/api/vapi/webhook',
    method: 'POST',
    architecture: 'function-calling',
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Determine event type - VAPI uses body.message.type
    const messageType = body.message?.type || body.type || 'unknown';
    console.log('[Vapi Webhook] Event:', messageType);

    // ============================================================
    // HANDLE FUNCTION CALLS - This is the core integration point
    // When GPT-4o calls get_nba_info, VAPI sends it here
    // ============================================================

    if (messageType === 'function-call') {
      const functionCall = body.message?.functionCall || body.functionCall;

      if (!functionCall) {
        console.warn('[Vapi Webhook] function-call event but no functionCall data');
        console.log('[Vapi Webhook] Body keys:', Object.keys(body));
        console.log('[Vapi Webhook] Message keys:', body.message ? Object.keys(body.message) : 'no message');
        return NextResponse.json({ result: 'No function call data received.' });
      }

      const funcName = functionCall.name;
      const params = functionCall.parameters || {};
      console.log('[Vapi Webhook] Function call:', funcName, 'params:', JSON.stringify(params));

      if (funcName === 'get_nba_info') {
        const query = params.query || 'today NBA scores';
        console.log('[Vapi Webhook] Fetching NBA data for query:', query);

        const result = await fetchFromChatbot(query);
        const elapsed = Date.now() - startTime;
        console.log('[Vapi Webhook] Total function-call handling:', elapsed, 'ms');
        console.log('[Vapi Webhook] Result preview:', result.substring(0, 150));

        // Return result in VAPI's expected format for function call responses
        return NextResponse.json({ result });
      }

      // Unknown function
      console.warn('[Vapi Webhook] Unknown function:', funcName);
      return NextResponse.json({ result: `Unknown function: ${funcName}` });
    }

    // ============================================================
    // HANDLE TOOL CALLS (newer VAPI format, array of tool calls)
    // ============================================================

    if (messageType === 'tool-calls') {
      const toolCalls =
        body.message?.toolCallList ||
        body.message?.toolCalls ||
        body.toolCallList ||
        body.toolCalls ||
        [];

      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        console.warn('[Vapi Webhook] tool-calls event but no tool calls found');
        console.log('[Vapi Webhook] Body:', JSON.stringify(body, null, 2));
        return NextResponse.json({ results: [] });
      }

      console.log('[Vapi Webhook] Processing', toolCalls.length, 'tool call(s)');

      const results = [];
      for (const tc of toolCalls) {
        const toolCallId = tc.id || tc.toolCallId || '';
        const funcName = tc.function?.name || tc.name || '';
        let params: Record<string, string> = {};

        // Arguments can be a JSON string or an object
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

        console.log('[Vapi Webhook] Tool call:', funcName, 'id:', toolCallId, 'params:', JSON.stringify(params));

        if (funcName === 'get_nba_info') {
          const query = params.query || 'today NBA scores';
          const result = await fetchFromChatbot(query);
          results.push({ toolCallId, result });
        } else {
          results.push({ toolCallId, result: `Unknown function: ${funcName}` });
        }
      }

      const elapsed = Date.now() - startTime;
      console.log('[Vapi Webhook] Total tool-calls handling:', elapsed, 'ms');

      return NextResponse.json({ results });
    }

    // ============================================================
    // ALL OTHER EVENTS - status updates, conversation updates, etc.
    // These are informational; we acknowledge and move on.
    // ============================================================

    // Log non-function events at debug level only
    if (messageType === 'status-update') {
      const status = body.message?.status || body.status || 'unknown';
      console.log('[Vapi Webhook] Status update:', status);
    } else if (messageType === 'conversation-update') {
      // These are conversation history updates - not actionable
      console.log('[Vapi Webhook] Conversation update (ignored - responses come via function calls)');
    } else if (messageType === 'speech-update') {
      // Speech start/stop events
      console.log('[Vapi Webhook] Speech update (ignored)');
    } else if (messageType === 'hang') {
      console.log('[Vapi Webhook] Call hang event');
    } else if (messageType === 'end-of-call-report') {
      console.log('[Vapi Webhook] End of call report received');
    } else {
      // Log unknown event types with full body for debugging
      console.log('[Vapi Webhook] Unhandled event type:', messageType);
      console.log('[Vapi Webhook] Body keys:', Object.keys(body));
      if (body.message) {
        console.log('[Vapi Webhook] Message keys:', Object.keys(body.message));
      }
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    return NextResponse.json({
      result: 'Internal error processing request.',
    });
  }
}
