import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint is called by the RADIUS server to check if a user has push enabled
// and should be allowed to authenticate

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify API key for RADIUS server authentication
function verifyRadiusApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-radius-api-key');
  const expectedKey = process.env.RADIUS_API_KEY;
  
  if (!expectedKey) {
    console.warn('[RADIUS Push Check] RADIUS_API_KEY not configured');
    return false;
  }
  
  return apiKey === expectedKey;
}

export async function GET(request: NextRequest) {
  try {
    // Verify RADIUS API key
    if (!verifyRadiusApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username'); // Passpoint username
    const userId = searchParams.get('user_id');     // Supabase user ID

    if (!username && !userId) {
      return NextResponse.json(
        { error: 'username or user_id required' },
        { status: 400 }
      );
    }

    // Find the profile
    let profile;
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, push_enabled, push_checked_at, username')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      profile = data;
    } else if (username) {
      // Username from passpoint credential
      const { data: cred, error: credError } = await supabaseAdmin
        .from('passpoint_credentials')
        .select('profile_id')
        .eq('username', username)
        .eq('is_active', true)
        .single();
      
      if (credError) {
        return NextResponse.json(
          { error: 'Credential not found', allow_access: false },
          { status: 404 }
        );
      }
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, push_enabled, push_checked_at, username')
        .eq('id', cred.profile_id)
        .single();
      
      if (error) throw error;
      profile = data;
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found', allow_access: false },
        { status: 404 }
      );
    }

    // Check if push is enabled
    const pushEnabled = profile.push_enabled === true;
    
    // Check if push check is stale (more than 24 hours old)
    const lastCheck = profile.push_checked_at 
      ? new Date(profile.push_checked_at) 
      : null;
    const isStale = !lastCheck || 
      (Date.now() - lastCheck.getTime()) > 24 * 60 * 60 * 1000;

    // RADIUS policy: Allow if push is enabled OR if never checked (grace period)
    // This gives new users time to enable push before being blocked
    const allowAccess = pushEnabled || (profile.push_checked_at === null);

    return NextResponse.json({
      user_id: profile.user_id,
      username: profile.username,
      push_enabled: pushEnabled,
      push_checked_at: profile.push_checked_at,
      is_stale: isStale,
      // RADIUS should use this to allow/deny access
      allow_access: allowAccess,
      // Reason for denial (for logging)
      denial_reason: !allowAccess ? 'push_disabled' : null,
    });
  } catch (error: any) {
    console.error('[RADIUS Push Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', allow_access: false },
      { status: 500 }
    );
  }
}

// Called by the client to update push status
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { user_id, push_enabled, player_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    if (typeof push_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'push_enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Update the profile
    const updateData: Record<string, any> = {
      push_enabled,
      push_checked_at: new Date().toISOString(),
    };
    
    if (player_id) {
      updateData.onesignal_player_id = player_id;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      push_enabled: data.push_enabled,
      push_checked_at: data.push_checked_at,
    });
  } catch (error: any) {
    console.error('[RADIUS Push Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
