import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateRadiusPassword, getPasspointConfig } from '@/utils/passpoint';

/**
 * POST /api/passpoint/manual-settings
 *
 * Returns manual WiFi configuration settings for any device.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to get WiFi settings.' },
        { status: 401 }
      );
    }

    // Use service client for database operations
    const serviceClient = createServiceClient();

    // Get user's profile
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete registration first.' },
        { status: 404 }
      );
    }

    const profileId = (profile as any).id;

    // Get the default Passpoint profile configuration
    const { data: passpointProfile, error: ppError } = await serviceClient
      .from('passpoint_profiles')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (ppError || !passpointProfile) {
      return NextResponse.json(
        { error: 'WiFi not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const pp = passpointProfile as any;

    // Check if user already has Passpoint credentials
    let { data: credential } = await serviceClient
      .from('passpoint_credentials')
      .select('*')
      .eq('profile_id', profileId)
      .eq('passpoint_profile_id', pp.id)
      .eq('is_active', true)
      .single();

    // Create credentials if they don't exist
    if (!credential) {
      const username = `pulse_${user.id.replace(/-/g, '').substring(0, 8)}`;
      const password = generateRadiusPassword();

      const { data: newCredential, error: createError } = await serviceClient
        .from('passpoint_credentials')
        .insert({
          profile_id: profileId,
          passpoint_profile_id: pp.id,
          username: username,
          password_hash: password,
          provisioned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating credentials:', createError);
        return NextResponse.json(
          { error: 'Failed to create WiFi credentials. Please try again.' },
          { status: 500 }
        );
      }

      credential = newCredential;
    }

    const cred = credential as any;

    // Get Passpoint configuration
    const config = getPasspointConfig();

    // Update last used timestamp
    await serviceClient
      .from('passpoint_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', cred.id);

    // Return manual settings
    return NextResponse.json({
      ssid: config.ssid,
      security: 'WPA2/WPA3-Enterprise',
      eap_method: config.eapMethod,
      phase2_auth: config.innerAuth,
      identity: cred.username,
      anonymous_identity: `anonymous@${config.realm}`,
      password: cred.password_hash,
      realm: config.realm,
      advanced: {
        ca_certificate: config.caCertUrl || 'Not required',
        domain_suffix_match: config.operatorFqdn,
        passpoint_fqdn: pp.fqdn,
        nai_realm: pp.nai_realm,
      },
    });
  } catch (error) {
    console.error('Error getting manual settings:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
