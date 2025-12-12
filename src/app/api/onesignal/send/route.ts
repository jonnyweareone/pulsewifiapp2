import { NextRequest, NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

interface SendNotificationOptions {
  // Target - use ONE of these
  player_ids?: string[];           // Specific device IDs
  external_user_ids?: string[];    // Your user IDs (from Supabase)
  included_segments?: string[];    // OneSignal segments like "All", "Active Users"
  
  // Content
  title: string;
  message: string;
  
  // Optional
  url?: string;                    // URL to open when tapped
  data?: Record<string, any>;      // Custom data payload
  buttons?: Array<{ id: string; text: string; url?: string }>;
  
  // iOS specific
  ios_badge_type?: 'SetTo' | 'Increase';
  ios_badge_count?: number;
  
  // Scheduling
  send_after?: string;             // ISO date string
  delayed_option?: 'timezone' | 'last-active';
  delivery_time_of_day?: string;   // "9:00AM"
}

// Send a push notification
export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationOptions = await request.json();
    
    // Build OneSignal payload
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: body.title },
      contents: { en: body.message },
    };
    
    // Targeting
    if (body.player_ids?.length) {
      payload.include_player_ids = body.player_ids;
    } else if (body.external_user_ids?.length) {
      payload.include_external_user_ids = body.external_user_ids;
      payload.channel_for_external_user_ids = 'push';
    } else if (body.included_segments?.length) {
      payload.included_segments = body.included_segments;
    } else {
      return NextResponse.json(
        { error: 'Must specify player_ids, external_user_ids, or included_segments' },
        { status: 400 }
      );
    }
    
    // Optional fields
    if (body.url) payload.url = body.url;
    if (body.data) payload.data = body.data;
    if (body.buttons) payload.buttons = body.buttons;
    if (body.send_after) payload.send_after = body.send_after;
    if (body.delayed_option) payload.delayed_option = body.delayed_option;
    if (body.delivery_time_of_day) payload.delivery_time_of_day = body.delivery_time_of_day;
    
    // iOS badge
    if (body.ios_badge_type) {
      payload.ios_badgeType = body.ios_badge_type;
      payload.ios_badgeCount = body.ios_badge_count || 1;
    }
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        { error: result.errors?.[0] || 'Failed to send notification' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      notification_id: result.id,
      recipients: result.recipients,
    });
    
  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get notification delivery stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get('id');
  
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }
  
  try {
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${ONESIGNAL_APP_ID}`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );
    
    const result = await response.json();
    
    return NextResponse.json({
      id: result.id,
      successful: result.successful,
      failed: result.failed,
      errored: result.errored,
      converted: result.converted,
      received: result.received,
      queued_at: result.queued_at,
      completed_at: result.completed_at,
    });
    
  } catch (error: any) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
