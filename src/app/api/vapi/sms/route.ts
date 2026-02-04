// Vapi SMS Route - Sends SMS messages via Vapi API
// Used to mirror notification content as text messages

import { NextResponse } from 'next/server';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const VAPI_TARGET_PHONE = process.env.VAPI_TARGET_PHONE;

export async function POST(request: Request) {
  if (!VAPI_PRIVATE_KEY) {
    return NextResponse.json(
      { error: 'Vapi API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { message, phoneNumber } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const targetPhone = phoneNumber || VAPI_TARGET_PHONE;
    if (!targetPhone) {
      return NextResponse.json(
        { error: 'No target phone number provided' },
        { status: 400 }
      );
    }

    // Format the SMS message with SportsSense branding
    const smsContent = `[SportsSense] ${message}`;

    const response = await fetch(`${VAPI_BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: targetPhone,
        },
        message: smsContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vapi SMS] API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send SMS', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Vapi SMS] Message sent:', data.id);

    return NextResponse.json({
      success: true,
      messageId: data.id,
    });
  } catch (error) {
    console.error('[Vapi SMS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
