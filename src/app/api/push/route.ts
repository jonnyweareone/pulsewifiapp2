import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

interface PushPayload {
  title: string;
  message: string;
  data?: Record<string, any>;
  target: 
    | { type: 'all' }
    | { type: 'segment'; segment: string }
    | { type: 'users'; user_ids: string[] }
    | { type: 'players'; player_ids: string[] };
  url?: string;
  image?: string;
}

async function sendToOneSignal(payload: PushPayload) {
  const body: any = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: payload.title },
    contents: { en: payload.message },
    data: payload.data || {},
  };

  if (payload.url) body.url = payload.url;
  if (payload.image) body.big_picture = payload.image;

  switch (payload.target.type) {
    case 'all':
      body.included_segments = ['All'];
      break;
    case 'segment':
      body.included_segments = [payload.target.segment];
      break;
    case 'users':
      // Get profile IDs first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('user_id', payload.target.user_ids);
      
      if (profiles && profiles.length > 0) {
        const profileIds = profiles.map(p => p.id);
        // Then get player IDs
        const { data: devices } = await supabase
          .from('user_devices')
          .select('onesignal_player_id')
          .in('profile_id', profileIds)
          .not('onesignal_player_id', 'is', null);
        
        body.include_player_ids = devices?.map(d => d.onesignal_player_id) || [];
      } else {
        body.include_player_ids = [];
      }
      break;
    case 'players':
      body.include_player_ids = payload.target.player_ids;
      break;
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: PushPayload = await request.json();

    if (!payload.title || !payload.message || !payload.target) {
      return NextResponse.json(
        { error: 'title, message, and target required' },
        { status: 400 }
      );
    }

    const result = await sendToOneSignal(payload);

    return NextResponse.json({
      success: true,
      onesignal_id: result.id,
      recipients: result.recipients,
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Endpoint to send to specific user
export async function PUT(request: NextRequest) {
  try {
    const { user_id, title, message, data } = await request.json();

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'user_id, title, and message required' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: devices } = await supabase
      .from('user_devices')
      .select('onesignal_player_id')
      .eq('profile_id', profile.id)
      .eq('push_enabled', true)
      .not('onesignal_player_id', 'is', null);

    if (!devices?.length) {
      return NextResponse.json({ error: 'No push-enabled devices' }, { status: 404 });
    }

    const result = await sendToOneSignal({
      title,
      message,
      data,
      target: { 
        type: 'players', 
        player_ids: devices.map(d => d.onesignal_player_id!) 
      },
    });

    return NextResponse.json({
      success: true,
      devices_notified: devices.length,
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
