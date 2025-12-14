import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import plist from 'plist';
import { v4 as uuidv4 } from 'uuid';

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

    const credential = tokenData.credential as any;
    const profile = credential?.profile;

    if (!credential || !profile) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Mark token as used
    await supabase
      .from('provisioning_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Generate iOS mobileconfig profile
    const mobileconfig = {
      PayloadContent: [
        {
          // WiFi Configuration
          AutoJoin: true,
          CaptiveBypass: false,
          EAPClientConfiguration: {
            AcceptEAPTypes: [21], // EAP-TTLS
            TTLSInnerAuthentication: 'MSCHAPv2',
            UserName: credential.username,
            UserPassword: credential.password_secret,
          },
          EncryptionType: 'WPA2',
          HIDDEN_NETWORK: false,
          IsHotspot: true,
          PayloadDescription: 'Configures WiFi settings for Pulse WiFi',
          PayloadDisplayName: 'Pulse WiFi',
          PayloadIdentifier: `uk.co.pulsewifi.wifi.${uuidv4()}`,
          PayloadType: 'com.apple.wifi.managed',
          PayloadUUID: uuidv4(),
          PayloadVersion: 1,
          ProxyType: 'None',
          SSID_STR: 'Pulse WiFi',
          // Hotspot 2.0 / Passpoint configuration
          'Hotspot2.0': true,
          DomainName: 'pulsewifi.co.uk',
          RoamingConsortiumOIs: ['5A03BA0000'],
          NAIRealmNames: ['pulsewifi.co.uk'],
          DisplayedOperatorName: 'Pulse WiFi',
          ServiceProviderRoamingEnabled: true,
        },
      ],
      PayloadDescription: `Pulse WiFi profile for ${profile.display_name}. Safe browsing enabled.`,
      PayloadDisplayName: `Pulse WiFi - ${profile.display_name}`,
      PayloadIdentifier: `uk.co.pulsewifi.profile.${credential.username}`,
      PayloadOrganization: 'Pulse WiFi',
      PayloadRemovalDisallowed: false,
      PayloadType: 'Configuration',
      PayloadUUID: uuidv4(),
      PayloadVersion: 1,
    };

    const profileXml = plist.build(mobileconfig);

    // Return the mobileconfig file
    return new NextResponse(profileXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-apple-aspen-config',
        'Content-Disposition': `attachment; filename="PulseWiFi-${profile.display_name}.mobileconfig"`,
      },
    });
  } catch (error) {
    console.error('Error generating iOS profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
