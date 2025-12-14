import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the provisioning token and related data
    const { data: tokenData, error: tokenError } = await supabase
      .from('provisioning_tokens')
      .select(`
        id,
        expires_at,
        used_at,
        credential:passpoint_credentials (
          id,
          username,
          password_secret,
          profile:profiles!passpoint_credentials_profile_id_fkey (
            id,
            display_name,
            default_policy_profile
          )
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Check if already used (optional - you might want to allow re-use)
    // if (tokenData.used_at) {
    //   return NextResponse.json({ error: 'This link has already been used' }, { status: 410 });
    // }

    const credential = tokenData.credential as any;
    const profile = credential?.profile;

    if (!credential || !profile) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    return NextResponse.json({
      childName: profile.display_name,
      username: credential.username,
      password: credential.password_secret,
      policyProfile: profile.default_policy_profile,
      expiresAt: tokenData.expires_at,
    });
  } catch (error) {
    console.error('Error in provision token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
