import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { credentialId } = await request.json();

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
    }

    // Get current user from session
    const cookieStore = await cookies();
    const supabaseClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parent's profile ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Use service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the credential belongs to a child managed by this parent
    const { data: credential, error: credError } = await supabaseAdmin
      .from('passpoint_credentials')
      .select(`
        id,
        password_secret,
        profile:profiles!passpoint_credentials_profile_id_fkey (
          id,
          managed_by_profile_id
        )
      `)
      .eq('id', credentialId)
      .single();

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Check if the credential's profile is managed by the current user
    const credProfile = credential.profile as any;
    if (credProfile?.managed_by_profile_id !== profile.id) {
      return NextResponse.json({ error: 'Not authorized to access this credential' }, { status: 403 });
    }

    // Generate a new provisioning token
    const tokenBytes = new Uint8Array(16);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Insert the token
    const { error: tokenError } = await supabaseAdmin.from('provisioning_tokens').insert({
      credential_id: credentialId,
      token: token,
      created_by_profile_id: profile.id,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

    if (tokenError) {
      console.error('Error creating provisioning token:', tokenError);
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: token,
      password: credential.password_secret,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error in provisioning-token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
