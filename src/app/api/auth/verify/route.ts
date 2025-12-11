import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

// POST /api/auth/verify
// Verify user via token from push notification
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Missing verification token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      );
    }

    // Mark user as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify account' },
        { status: 500 }
      );
    }

    // Delete used token
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token);

    // Send welcome push with Passpoint config link
    if (tokenData.player_id) {
      const configUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.pulsewifi.co.uk'}/onboarding/passpoint`;

      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: [tokenData.player_id],
          headings: { en: '🎉 Welcome to Pulse WiFi!' },
          contents: { en: 'Your account is verified. Tap to set up your secure Wi-Fi connection.' },
          url: configUrl,
          chrome_web_icon: 'https://app.pulsewifi.co.uk/icons/icon-256x256.png',
          chrome_web_badge: 'https://app.pulsewifi.co.uk/icons/badge-72x72.png',
          buttons: [
            { id: 'setup', text: 'Set Up Wi-Fi', url: configUrl }
          ],
          data: {
            type: 'welcome',
            user_id: tokenData.user_id,
          },
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully',
      user_id: tokenData.user_id,
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
