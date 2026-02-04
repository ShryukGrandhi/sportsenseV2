// SMS Route - Sends text message notifications via Twilio REST API
// Used by NotificationProvider to send live game alerts as SMS
// No Twilio SDK required - uses direct REST API calls

import { NextResponse } from 'next/server';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const DEFAULT_TARGET_PHONE = process.env.VAPI_TARGET_PHONE;

export async function POST(request: Request) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[SMS] Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
    return NextResponse.json(
      { error: 'SMS not configured. Add Twilio credentials to environment variables.' },
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

    const targetPhone = phoneNumber || DEFAULT_TARGET_PHONE;
    if (!targetPhone) {
      return NextResponse.json(
        { error: 'No target phone number provided' },
        { status: 400 }
      );
    }

    // Format with branding, keep it concise for SMS
    const smsBody = `[Playmaker AI] ${message}`;

    // Twilio REST API - no SDK needed
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: targetPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: smsBody,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SMS] Twilio error:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to send SMS', details: errorData.message || 'Unknown error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[SMS] Message sent:', data.sid, 'to:', targetPhone);

    return NextResponse.json({
      success: true,
      messageId: data.sid,
      status: data.status,
    });
  } catch (error) {
    console.error('[SMS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
