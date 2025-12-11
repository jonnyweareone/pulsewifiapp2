import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateRadiusPassword, getPasspointConfig } from '@/utils/passpoint';

/**
 * POST /api/passpoint/android-profile
 *
 * Returns WiFi configuration for Android devices.
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

    const ppId = (passpointProfile as any).id;

    // Check if user already has Passpoint credentials
    let { data: credential } = await serviceClient
      .from('passpoint_credentials')
      .select('*')
      .eq('profile_id', profileId)
      .eq('passpoint_profile_id', ppId)
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
          passpoint_profile_id: ppId,
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
    }

    const cred = credential as any;

    // Get Passpoint configuration
    const config = getPasspointConfig();
    const pp = passpointProfile as any;

    // Update last used timestamp
    await serviceClient
      .from('passpoint_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', cred.id);

    // Return Android configuration
    const androidConfig = {
      manual: {
        ssid: config.ssid,
        security: 'WPA2/WPA3-Enterprise',
        eap_method: config.eapMethod,
        phase2_auth: config.innerAuth,
        identity: cred.username,
        anonymous_identity: `anonymous@${config.realm}`,
        password: cred.password_hash,
        ca_certificate: 'Do not validate',
        domain: config.operatorFqdn,
      },
      passpoint: {
        fqdn: pp.fqdn,
        friendly_name: pp.friendly_name,
        realm: pp.nai_realm,
        roaming_consortium_ois: pp.roaming_consortium_ois || [],
        eap_type: 21,
        non_eap_inner_method: 'MS-CHAP-V2',
        username: cred.username,
        password: cred.password_hash,
      },
      qr_code: `WIFI:T:WPA2-EAP;S:${config.ssid};E:TTLS;PH2:MSCHAPV2;I:${cred.username};P:${cred.password_hash};;`,
      instructions: {
        title: 'Android WiFi Setup',
        steps: [
          'Open Settings > WiFi',
          `Look for "${config.ssid}" network`,
          'Tap to connect',
          'Select "WPA2/WPA3-Enterprise"',
          `Set EAP method to "${config.eapMethod}"`,
          `Set Phase 2 authentication to "${config.innerAuth}"`,
          `Enter identity: ${cred.username}`,
          'Enter the password shown below',
          'For CA certificate, select "Do not validate" or "Use system certificates"',
          'Tap Connect',
        ],
      },
    };

    return NextResponse.json(androidConfig);
  } catch (error) {
    console.error('Error generating Android config:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
