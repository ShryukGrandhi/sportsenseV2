// VAPI Webhook Endpoint - Bridges VAPI voice calls to the SportsSense chatbot API
// Receives user messages from VAPI, calls the internal chatbot with live NBA data,
// and returns voice-formatted responses.

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Extracts the user's message from VAPI's webhook request.
 * VAPI can send the transcript in multiple formats depending on the event type.
 */
function extractMessage(body: Record<string, unknown>): string | null {
  // Format 1: body.message.content (conversation-update messages)
  if (body.message && typeof body.message === 'object') {
    const msg = body.message as Record<string, unknown>;

    // Check for transcript in message
    if (typeof msg.transcript === 'string' && msg.transcript.trim()) {
      return msg.transcript.trim();
    }

    // Check for content field
    if (typeof msg.content === 'string' && msg.content.trim()) {
      return msg.content.trim();
    }

    // Check nested messages array (conversation-update format)
    if (Array.isArray(msg.messages)) {
      const userMessages = (msg.messages as Array<Record<string, unknown>>).filter(
        (m) => m.role === 'user' && typeof m.content === 'string'
      );
      if (userMessages.length > 0) {
        return (userMessages[userMessages.length - 1].content as string).trim();
      }
    }
  }

  // Format 2: body.transcript directly
  if (typeof body.transcript === 'string' && body.transcript.trim()) {
    return body.transcript.trim();
  }

  // Format 3: body.text directly
  if (typeof body.text === 'string' && body.text.trim()) {
    return body.text.trim();
  }

  return null;
}

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

  // Remove emoji (optional - some TTS handles emoji fine)
  // result = result.replace(/[\u{1F600}-\u{1F64F}]/gu, '');

  // Convert multiple newlines to sentence breaks
  result = result.replace(/\n{2,}/g, '. ');
  result = result.replace(/\n/g, '. ');

  // Clean up multiple periods/spaces
  result = result.replace(/\.\s*\.\s*/g, '. ');
  result = result.replace(/\s{2,}/g, ' ');

  // Remove any JSON blocks that might have leaked through
  result = result.replace(/```json[\s\S]*?```/g, '');
  result = result.replace(/```[\s\S]*?```/g, '');

  // Remove correctedStats JSON blocks
  result = result.replace(/\{"correctedStats"[\s\S]*?\}/g, '');

  return result.trim();
}

// GET handler for testing/verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'VAPI webhook endpoint is active. This endpoint accepts POST requests from VAPI.',
    endpoint: '/api/vapi/webhook',
    method: 'POST',
  });
}

export async function POST(request: Request) {
  console.log('[Vapi Webhook] Received request');

  try {
    const body = await request.json();
    
    // Log the full request for debugging
    console.log('[Vapi Webhook] Full request body:', JSON.stringify(body, null, 2));
    console.log('[Vapi Webhook] Request keys:', Object.keys(body));
    
    // VAPI sends different event types - we only care about user messages
    const eventType = body.type || body.message?.type || 'unknown';
    console.log('[Vapi Webhook] Event type:', eventType);

    // Extract the user's message - VAPI sends it in different formats
    let userMessage = null;
    
    // Format 1: Direct transcript in body
    if (body.transcript && typeof body.transcript === 'string') {
      userMessage = body.transcript.trim();
      console.log('[Vapi Webhook] Found message in body.transcript');
    }
    
    // Format 2: Message object with transcript
    if (!userMessage && body.message) {
      if (typeof body.message === 'string') {
        userMessage = body.message.trim();
        console.log('[Vapi Webhook] Found message in body.message (string)');
      } else if (body.message.transcript) {
        userMessage = body.message.transcript.trim();
        console.log('[Vapi Webhook] Found message in body.message.transcript');
      } else if (body.message.content) {
        userMessage = body.message.content.trim();
        console.log('[Vapi Webhook] Found message in body.message.content');
      }
    }
    
    // Format 3: Function call parameters
    if (!userMessage && body.functionCall) {
      userMessage = body.functionCall.parameters?.query || 
                   body.functionCall.parameters?.message || 
                   body.functionCall.parameters?.text ||
                   null;
      if (userMessage) {
        console.log('[Vapi Webhook] Found message in functionCall.parameters');
      }
    }
    
    // Format 4: Messages array (conversation history)
    if (!userMessage && body.messages && Array.isArray(body.messages)) {
      const userMessages = body.messages.filter((m: any) => 
        m.role === 'user' && m.content && typeof m.content === 'string'
      );
      if (userMessages.length > 0) {
        userMessage = userMessages[userMessages.length - 1].content.trim();
        console.log('[Vapi Webhook] Found message in messages array');
      }
    }
    
    // Format 5: Direct text field
    if (!userMessage && body.text && typeof body.text === 'string') {
      userMessage = body.text.trim();
      console.log('[Vapi Webhook] Found message in body.text');
    }
    
    // Format 6: Query field
    if (!userMessage && body.query && typeof body.query === 'string') {
      userMessage = body.query.trim();
      console.log('[Vapi Webhook] Found message in body.query');
    }

    // Only process if we have a user message
    // VAPI sends many status/event updates that don't contain user messages
    if (!userMessage) {
      console.log('[Vapi Webhook] No user message found - this is likely a status update or event');
      console.log('[Vapi Webhook] Event type was:', eventType);
      // Return empty response for non-message events
      return NextResponse.json({});
    }

    console.log('[Vapi Webhook] User message:', userMessage.substring(0, 100));

    // Call the internal chatbot API with live data
    // Use absolute URL for internal fetch in production
    const chatbotUrl = `${BASE_URL}/api/ai/chat`;
    console.log('[Vapi Webhook] Calling chatbot at:', chatbotUrl);
    console.log('[Vapi Webhook] Request payload:', { message: userMessage, length: 'short' });

    const chatResponse = await fetch(chatbotUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Pass through any auth headers if needed
      },
      body: JSON.stringify({
        message: userMessage,
        personality: 'default',
        length: 'short', // Keep voice responses concise
        type: 'general',
        requestVisuals: false,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('[Vapi Webhook] Chatbot API error:', chatResponse.status, errorText);
      return NextResponse.json({
        response: "I'm having trouble accessing the latest NBA data right now. Try asking me again in a moment.",
      });
    }

    const chatData = await chatResponse.json();
    console.log('[Vapi Webhook] Chatbot response received:', {
      hasResponse: !!chatData.response,
      responseLength: chatData.response?.length || 0,
      hasError: !!chatData.error,
      dataSource: chatData.dataSource,
    });
    
    const rawResponse = chatData.response || '';

    if (!rawResponse) {
      console.warn('[Vapi Webhook] Empty response from chatbot');
      return NextResponse.json({
        response: "Sorry, I couldn't find that information right now. Try asking about today's NBA games or a specific player.",
      });
    }

    // Format the response for voice
    const voiceResponse = formatForVoice(rawResponse);
    console.log('[Vapi Webhook] Voice response length:', voiceResponse.length);
    console.log('[Vapi Webhook] Voice response preview:', voiceResponse.substring(0, 200));
    console.log('[Vapi Webhook] Full voice response:', voiceResponse);

    // Return response in VAPI's expected format
    return NextResponse.json({
      response: voiceResponse,
    });
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    return NextResponse.json({
      response: "I'm having a technical issue right now. Please try your question again.",
    });
  }
}
