import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateRadiusPassword, generateIOSProfile, getPasspointConfig } from '@/utils/passpoint';

/**
 * POST /api/passpoint/ios-profile
 *
 * Generates and returns an iOS/macOS .mobileconfig profile for Passpoint WiFi.
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
        { error: 'Unauthorized. Please sign in to generate a profile.' },
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
        { error: 'Passpoint not configured. Please contact support.' },
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
        console.error('Error creating Passpoint credentials:', createError);
        return NextResponse.json(
          { error: 'Failed to create WiFi credentials. Please try again.' },
          { status: 500 }
        );
      }

      credential = newCredential;
      console.log(`[RADIUS] New credentials created for user ${user.id}: ${username}`);
    }

    const cred = credential as any;

    // Get Passpoint configuration from env (with database overrides)
    const config = getPasspointConfig();
    
    // Override with database values
    config.realm = pp.nai_realm;
    config.operatorFqdn = pp.fqdn;
    config.friendlyName = pp.friendly_name;
    config.naiRealm = pp.nai_realm;
    config.eapMethod = pp.eap_method || 'TTLS';

    // Generate the iOS profile
    const iosProfile = generateIOSProfile(
      user.id,
      {
        username: cred.username,
        password: cred.password_hash || '',
      },
      config
    );

    // Update last used timestamp
    await serviceClient
      .from('passpoint_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', cred.id);

    // Return profile as downloadable file
    return new NextResponse(iosProfile, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-apple-aspen-config',
        'Content-Disposition': 'attachment; filename="pulse-wifi-passpoint.mobileconfig"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating iOS profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
