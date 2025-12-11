import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      device_id,
      onesignal_player_id,
      push_enabled,
      app_version,
      os_version,
      platform // 'ios' | 'android' | 'web'
    } = body;

    if (!user_id || !device_id) {
      return NextResponse.json(
        { error: 'user_id and device_id required' },
        { status: 400 }
      );
    }

    // Get profile_id from user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Upsert device with heartbeat
    const { data: device, error } = await supabase
      .from('user_devices')
      .upsert({
        profile_id: profile.id,
        device_identifier: device_id,
        device_type: platform || 'unknown',
        last_heartbeat_at: new Date().toISOString(),
        app_installed: true,
        onesignal_player_id: onesignal_player_id || null,
        push_enabled: push_enabled || false,
        app_version: app_version || null,
        os_version: os_version || null,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,device_identifier',
      })
      .select()
      .single();

    if (error) {
      console.error('Heartbeat error:', error);
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      device_id: device?.id,
      next_heartbeat_in: 3600, // seconds (1 hour)
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check device status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const device_id = searchParams.get('device_id');
  const user_id = searchParams.get('user_id');

  if (!device_id || !user_id) {
    return NextResponse.json(
      { error: 'device_id and user_id required' },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (!profile) {
    return NextResponse.json({ registered: false });
  }

  const { data: device } = await supabase
    .from('user_devices')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('device_identifier', device_id)
    .single();

  return NextResponse.json({
    registered: !!device,
    app_installed: device?.app_installed || false,
    push_enabled: device?.push_enabled || false,
    last_heartbeat: device?.last_heartbeat_at || null,
  });
}
