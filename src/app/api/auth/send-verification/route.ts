import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

// POST /api/auth/send-verification
// Send verification link via push notification
export async function POST(request: NextRequest) {
  try {
    const { user_id, player_id } = await request.json();

    if (!user_id || !player_id) {
      return NextResponse.json(
        { error: 'Missing user_id or player_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate verification token (expires in 24 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in database
    const { error: dbError } = await supabase
      .from('verification_tokens')
      .upsert({
        user_id,
        token,
        player_id,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    // Update profile with player_id
    await supabase
      .from('profiles')
      .update({ 
        onesignal_player_id: player_id,
        push_enabled: true,
      })
      .eq('id', user_id);

    // Send verification push notification
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.pulsewifi.co.uk'}/auth/verify?token=${token}`;

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [player_id],
        headings: { en: '✅ Verify Your Account' },
        contents: { en: 'Tap to verify your Pulse WiFi account and get your Wi-Fi settings' },
        url: verifyUrl,
        chrome_web_icon: 'https://app.pulsewifi.co.uk/icons/icon-256x256.png',
        chrome_web_badge: 'https://app.pulsewifi.co.uk/icons/badge-72x72.png',
        ttl: 86400, // 24 hours
        priority: 10, // High priority
        buttons: [
          { id: 'verify', text: 'Verify Now', url: verifyUrl }
        ],
        data: {
          type: 'verification',
          user_id,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return NextResponse.json(
        { error: 'Failed to send verification notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification notification sent',
      notification_id: result.id,
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
