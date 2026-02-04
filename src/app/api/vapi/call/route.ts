// Vapi Outbound Call Route - Triggers voice call via Vapi REST API
// Uses function calling so GPT-4o can fetch live NBA data through our webhook

import { NextResponse } from 'next/server';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const VAPI_TARGET_PHONE = process.env.VAPI_TARGET_PHONE;
const WEBHOOK_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

const VOICE_SYSTEM_PROMPT = `You are Playmaker AI - a concise, accurate NBA-only sports voice assistant on a phone call.

ABSOLUTE RULES:
- You ONLY talk about NBA basketball: games, players, teams, stats, standings, awards, and history.
- You NEVER help with calendars, meetings, scheduling, reminders, email, tasks, or generic productivity.
- If the user asks for anything outside NBA basketball, politely say you can only answer NBA questions.

DATA ACCESS:
- You have a tool called "get_nba_info" that fetches LIVE NBA data (scores, stats, standings, recaps).
- For ANY NBA question about current data, scores, stats, or live games, you MUST call get_nba_info FIRST.
- NEVER say "give me a moment", "let me check", "I need to look that up", or any similar phrases.
- Just call the tool silently and respond directly with the data you receive.
- NEVER guess or make up stats. If you don't have data, call the tool.
- After receiving tool results, use ONLY that data in your response. Do not add stats the tool didn't provide.

VOICE STYLE:
- Keep responses SHORT and conversational. This is a phone call, not a text chat.
- No markdown, no bullet points, no formatting. Speak naturally.
- Lead with the score or result, then mention key performers.
- Keep sentences short and punchy.
- Speak like a knowledgeable NBA friend. Be direct, enthusiastic but not over the top.
- Example: "The Lakers beat the Celtics 112 to 105 last night. LeBron had 32 points and 10 assists. Big win for LA."`;

export async function POST(request: Request) {
  if (!VAPI_PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'Vapi API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetPhone = body.phoneNumber || VAPI_TARGET_PHONE;

    if (!targetPhone) {
      console.error('[Vapi Call] Missing phone number. VAPI_TARGET_PHONE:', VAPI_TARGET_PHONE ? 'Set' : 'Not set');
      return NextResponse.json(
        {
          error: 'No target phone number provided',
          details: 'VAPI_TARGET_PHONE environment variable is not set. Please configure it in Vercel environment variables.',
        },
        { status: 400 }
      );
    }

    if (!VAPI_PHONE_NUMBER_ID) {
      console.error('[Vapi Call] Missing phone number ID');
      return NextResponse.json(
        {
          error: 'VAPI phone number ID not configured',
          details: 'VAPI_PHONE_NUMBER_ID environment variable is not set.',
        },
        { status: 500 }
      );
    }

    console.log('[Vapi Call] Webhook URL:', `${WEBHOOK_BASE_URL}/api/vapi/webhook`);

    const callPayload = {
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: targetPhone,
      },
      assistant: {
        // serverUrl receives server messages AND handles function call execution
        serverUrl: `${WEBHOOK_BASE_URL}/api/vapi/webhook`,
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: VOICE_SYSTEM_PROMPT,
            },
          ],
          // Function calling: GPT-4o will call get_nba_info, VAPI sends the
          // call to serverUrl, our webhook fetches live data from the chatbot API
          tools: [
            {
              type: 'function',
              async: false, // Wait for result before responding
              function: {
                name: 'get_nba_info',
                description:
                  'Fetch live NBA data including today\'s scores, player stats, team records, standings, game recaps, and player comparisons. ALWAYS call this for ANY question about current NBA data, scores, or stats.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description:
                        'The NBA question to look up. Examples: "what are today\'s scores", "LeBron James stats", "Lakers vs Celtics", "NBA standings", "recap of last night\'s Knicks game"',
                    },
                  },
                  required: ['query'],
                },
              },
            },
          ],
        },
        voice: {
          provider: 'vapi',
          voiceId: 'Elliot',
        },
        firstMessage:
          "Hey! I'm Playmaker AI, your NBA assistant with live data. Ask me about today's games, player stats, standings, or anything NBA!",
        endCallMessage: 'Thanks for calling Playmaker AI. Enjoy the games!',
      },
    };

    const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vapi Call] API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to initiate call', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Vapi Call] Call initiated:', data.id);

    return NextResponse.json({
      success: true,
      callId: data.id,
      status: data.status,
    });
  } catch (error) {
    console.error('[Vapi Call] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
