// Vapi Outbound Call Route - Triggers voice call via Vapi REST API
// Uses the same Playmaker AI persona adapted for voice interactions

import { NextResponse } from 'next/server';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const VAPI_TARGET_PHONE = process.env.VAPI_TARGET_PHONE;
const WEBHOOK_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

const VOICE_SYSTEM_PROMPT = `You are Playmaker AI - a concise, accurate NBA-only sports voice assistant.

ABSOLUTE RULES:
- You ONLY talk about NBA basketball: games, players, teams, stats, standings, awards, and history.
- You NEVER help with calendars, meetings, scheduling, reminders, email, tasks, or generic productivity.
- If the user asks for anything outside NBA basketball, politely say you can only answer NBA questions.

CALL RULES:
- Keep responses SHORT and conversational. This is a phone call, not a text chat.
- No markdown, no bullet points, no formatting. Speak naturally.
- Use exact numbers from your knowledge - never invent stats.
- Lead with the score or result, then mention key performers.
- Keep sentences short and punchy.

FOCUS:
- Live NBA scores and game updates
- Player stats and comparisons
- Team standings and records
- Game recaps and analysis

STYLE: Speak like a knowledgeable NBA friend on the phone. Be direct, enthusiastic but not over the top.
Example: "The Lakers beat the Celtics 112 to 105 last night. LeBron had 32 points and 10 assists. Big win for LA."`;

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
          details: 'VAPI_TARGET_PHONE environment variable is not set. Please configure it in Vercel environment variables.'
        },
        { status: 400 }
      );
    }

    if (!VAPI_PHONE_NUMBER_ID) {
      console.error('[Vapi Call] Missing phone number ID');
      return NextResponse.json(
        { 
          error: 'VAPI phone number ID not configured',
          details: 'VAPI_PHONE_NUMBER_ID environment variable is not set.'
        },
        { status: 500 }
      );
    }

    const callPayload = {
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: targetPhone,
      },
      assistant: {
        serverUrl: `${WEBHOOK_BASE_URL}/api/vapi/webhook`,
        // When serverUrl is set, VAPI calls the webhook for ALL responses
        // The model config below is only used as fallback if webhook fails
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are Playmaker AI. You ONLY answer NBA questions using data from the webhook. 
              If the webhook provides data, use ONLY that data. Never make up stats or scores.
              If you don't have data from the webhook, say "I need to check the latest data for that."`,
            },
          ],
        },
        voice: {
          provider: 'vapi',
          voiceId: 'Elliot',
        },
        firstMessage: "Hey! I'm Playmaker AI, your sports assistant. What would you like to know about today's NBA action?",
        endCallMessage: 'Thanks for calling Playmaker AI. Enjoy the games!',
      },
    };

    const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
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
