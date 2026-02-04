// SMS Route - Sends text notifications via email-to-SMS (T-Mobile gateway)
// Falls back to Twilio if configured. No paid service required for email-to-SMS.
// Used by NotificationProvider to send live game alerts as texts.

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email-to-SMS config
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMS_GATEWAY_EMAIL = process.env.SMS_GATEWAY_EMAIL || '18582108648@tmomail.net';

// Twilio fallback
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const DEFAULT_TARGET_PHONE = process.env.VAPI_TARGET_PHONE;

// Carrier email-to-SMS gateways
const CARRIER_GATEWAYS: Record<string, string> = {
  tmobile: 'tmomail.net',
  att: 'txt.att.net',
  verizon: 'vtext.com',
  sprint: 'messaging.sprintpcs.com',
};

/**
 * Converts a phone number to an email-to-SMS address.
 * Format: 18582108648@tmomail.net
 */
function phoneToEmailGateway(phone: string, carrier = 'tmobile'): string {
  const digits = phone.replace(/\D/g, '');
  const gateway = CARRIER_GATEWAYS[carrier] || CARRIER_GATEWAYS.tmobile;
  return `${digits}@${gateway}`;
}

/**
 * Send via email-to-SMS gateway (free, no API key needed)
 */
async function sendViaEmailGateway(message: string, toEmail: string): Promise<{ success: boolean; error?: string }> {
  if (!SMTP_USER || !SMTP_PASS) {
    return { success: false, error: 'SMTP credentials not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // Truncate to 150 chars for clean SMS delivery
  const truncated = message.length > 150 ? message.substring(0, 147) + '...' : message;

  // T-Mobile renders subject + body. Put message in subject to avoid "no subject" label.
  // Leave body empty so only one copy of the message appears.
  await transporter.sendMail({
    from: SMTP_USER,
    to: toEmail,
    subject: truncated,
    text: '',
  });

  return { success: true };
}

/**
 * Send via Twilio REST API (paid, requires credentials)
 */
async function sendViaTwilio(message: string, toPhone: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: 'Twilio not configured' };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: toPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.message || `Twilio ${response.status}` };
  }

  const data = await response.json();
  return { success: true, messageId: data.sid };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, phoneNumber } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Try email-to-SMS first (free), then Twilio
    const gatewayEmail = SMS_GATEWAY_EMAIL || phoneToEmailGateway(phoneNumber || DEFAULT_TARGET_PHONE || '');

    if (SMTP_USER && SMTP_PASS) {
      console.log('[SMS] Sending via email-to-SMS:', gatewayEmail);
      const result = await sendViaEmailGateway(message, gatewayEmail);
      if (result.success) {
        console.log('[SMS] Email-to-SMS sent to:', gatewayEmail);
        return NextResponse.json({ success: true, method: 'email-gateway', to: gatewayEmail });
      }
      console.warn('[SMS] Email-to-SMS failed:', result.error);
    }

    // Twilio fallback
    const targetPhone = phoneNumber || DEFAULT_TARGET_PHONE;
    if (targetPhone && TWILIO_ACCOUNT_SID) {
      console.log('[SMS] Falling back to Twilio for:', targetPhone);
      const result = await sendViaTwilio(message, targetPhone);
      if (result.success) {
        console.log('[SMS] Twilio sent:', result.messageId);
        return NextResponse.json({ success: true, method: 'twilio', messageId: result.messageId });
      }
      console.error('[SMS] Twilio failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'No SMS delivery method configured. Set SMTP_USER/SMTP_PASS or Twilio credentials.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[SMS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
