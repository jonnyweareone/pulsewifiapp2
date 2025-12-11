import { v4 as uuidv4 } from 'uuid';

/**
 * Passpoint / Hotspot 2.0 Profile Generation Utilities
 *
 * This module handles generation of WiFi configuration profiles for Passpoint authentication.
 * Profiles are generated per-user with unique credentials stored in the radius_identities table.
 *
 * IMPORTANT: In production, these credentials should be synced to a RADIUS server
 * (e.g., FreeRADIUS) for actual authentication.
 */

export interface PasspointConfig {
  realm: string;
  operatorFqdn: string;
  radiusHost: string;
  radiusSecret: string;
  eapMethod: string;
  innerAuth: string;
  friendlyName: string;
  venueName: string;
  naiRealm: string;
  ssid: string;
  caCertUrl: string;
  orgId: string;
}

export interface RadiusCredentials {
  username: string;
  password: string;
}

/**
 * Loads Passpoint configuration from environment variables
 */
export function getPasspointConfig(): PasspointConfig {
  return {
    realm: process.env.PASSPOINT_REALM || 'pulsewifi.co.uk',
    operatorFqdn: process.env.PASSPOINT_OPERATOR_FQDN || 'pulsewifi.co.uk',
    radiusHost: process.env.PASSPOINT_RADIUS_HOST || 'radius.pulsewifi.co.uk',
    radiusSecret: process.env.PASSPOINT_RADIUS_SECRET || '',
    eapMethod: process.env.PASSPOINT_EAP_METHOD || 'TTLS',
    innerAuth: process.env.PASSPOINT_INNER_AUTH || 'MSCHAPv2',
    friendlyName: process.env.PASSPOINT_HS_FRIENDLY_NAME || 'Pulse WiFi',
    venueName: process.env.PASSPOINT_HS_VENUE_NAME || 'your local area',
    naiRealm: process.env.PASSPOINT_HS_NAI_REALM || 'pulsewifi.co.uk',
    ssid: process.env.PASSPOINT_SSID || 'Pulse WiFi',
    caCertUrl: process.env.PASSPOINT_CA_CERT_URL || '',
    orgId: process.env.PASSPOINT_ORG_ID || 'uk.co.pulsewifi',
  };
}

/**
 * Generates a unique RADIUS username from a user ID
 */
export function generateRadiusUsername(userId: string): string {
  // Use first 8 chars of UUID to create a short, unique username
  const shortId = userId.replace(/-/g, '').substring(0, 8);
  return `user_${shortId}`;
}

/**
 * Generates a secure random password for RADIUS authentication
 */
export function generateRadiusPassword(): string {
  // Generate a 16-character alphanumeric password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

/**
 * Generates an iOS/macOS .mobileconfig profile for Passpoint WiFi
 *
 * The profile configures:
 * - Hotspot 2.0 / Passpoint settings
 * - EAP-TTLS or EAP-PEAP authentication
 * - Automatic connection to the specified realm
 */
export function generateIOSProfile(
  userId: string,
  credentials: RadiusCredentials,
  config: PasspointConfig
): string {
  const profileUUID = uuidv4().toUpperCase();
  const wifiPayloadUUID = uuidv4().toUpperCase();
  const eapPayloadUUID = uuidv4().toUpperCase();

  // Map EAP method to Apple's numeric types
  // 21 = EAP-TTLS, 25 = EAP-PEAP, 13 = EAP-TLS
  const eapTypeMap: Record<string, number> = {
    TTLS: 21,
    PEAP: 25,
    TLS: 13,
  };

  // Map inner auth method
  // MSCHAPv2 = 2, PAP = 0, CHAP = 1
  const innerAuthMap: Record<string, number> = {
    MSCHAPv2: 2,
    PAP: 0,
    CHAP: 1,
  };

  const eapType = eapTypeMap[config.eapMethod.toUpperCase()] || 21;
  const innerAuthType = innerAuthMap[config.innerAuth] || 2;

  // Build the mobileconfig plist XML
  // This profile enables Passpoint (Hotspot 2.0) WiFi configuration
  const profile = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>AutoJoin</key>
            <true/>
            <key>CaptiveBypass</key>
            <false/>
            <key>DisableAssociationMACRandomization</key>
            <false/>
            <key>DisplayedOperatorName</key>
            <string>${config.friendlyName}</string>
            <key>DomainName</key>
            <string>${config.operatorFqdn}</string>
            <key>EAPClientConfiguration</key>
            <dict>
                <key>AcceptEAPTypes</key>
                <array>
                    <integer>${eapType}</integer>
                </array>
                <key>EAPFASTProvisionPAC</key>
                <false/>
                <key>EAPFASTUsePAC</key>
                <false/>
                <key>TTLSInnerAuthentication</key>
                <string>${config.innerAuth}</string>
                <key>OuterIdentity</key>
                <string>anonymous@${config.realm}</string>
                <key>UserName</key>
                <string>${credentials.username}@${config.realm}</string>
                <key>UserPassword</key>
                <string>${credentials.password}</string>
            </dict>
            <key>EncryptionType</key>
            <string>WPA2</string>
            <key>HIDDEN_NETWORK</key>
            <false/>
            <key>IsHotspot</key>
            <true/>
            <key>NAIRealmNames</key>
            <array>
                <string>${config.naiRealm}</string>
            </array>
            <key>PayloadDescription</key>
            <string>Configures WiFi settings for ${config.friendlyName}</string>
            <key>PayloadDisplayName</key>
            <string>${config.friendlyName} WiFi</string>
            <key>PayloadIdentifier</key>
            <string>${config.orgId}.wifi.${userId.substring(0, 8)}</string>
            <key>PayloadType</key>
            <string>com.apple.wifi.managed</string>
            <key>PayloadUUID</key>
            <string>${wifiPayloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>ProxyType</key>
            <string>None</string>
            <key>RoamingConsortiumOIs</key>
            <array>
                <string>5A03BA0000</string>
            </array>
            <key>SSID_STR</key>
            <string>${config.ssid}</string>
            <key>ServiceProviderRoamingEnabled</key>
            <true/>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Profile for ${config.friendlyName} Passpoint WiFi access. Enables seamless, secure connectivity.</string>
    <key>PayloadDisplayName</key>
    <string>${config.friendlyName}</string>
    <key>PayloadIdentifier</key>
    <string>${config.orgId}.profile.${userId.substring(0, 8)}</string>
    <key>PayloadOrganization</key>
    <string>${config.friendlyName}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

  return profile;
}

/**
 * Generates Android Passpoint configuration data
 *
 * Note: Full Passpoint (PPS MO) XML generation would require more complex
 * OMA-DM provisioning. This function returns the necessary data for:
 * 1. Manual WiFi configuration on Android
 * 2. Future PPS-MO XML generation if needed
 *
 * For production Passpoint on Android, consider using:
 * - Wi-Fi Alliance PPS-MO format
 * - Carrier-based provisioning via SIM
 * - MDM solutions
 */
export function generateAndroidConfig(
  credentials: RadiusCredentials,
  config: PasspointConfig
): Record<string, string | number | boolean> {
  return {
    // Basic WiFi settings
    ssid: config.ssid,
    security: 'WPA2 Enterprise',
    eap_method: `EAP-${config.eapMethod}`,
    phase2_auth: config.innerAuth,

    // Identity settings
    identity: `${credentials.username}@${config.realm}`,
    anonymous_identity: `anonymous@${config.realm}`,
    password: credentials.password,

    // Passpoint / Hotspot 2.0 settings
    realm: config.realm,
    fqdn: config.operatorFqdn,
    friendly_name: config.friendlyName,

    // CA certificate (if available)
    ca_cert_url: config.caCertUrl,

    // For future PPS-MO XML generation
    // The following fields would be used in a proper OMA-DM PerProviderSubscription
    _pps_mo_note:
      'To generate proper PPS-MO XML for Android Passpoint, use Wi-Fi Alliance format',
  };
}

/**
 * Generates manual WiFi settings for any device
 */
export function generateManualSettings(
  credentials: RadiusCredentials,
  config: PasspointConfig
): Record<string, string> {
  return {
    ssid: config.ssid,
    security: 'WPA2 Enterprise',
    eap_method: `EAP-${config.eapMethod}`,
    phase2_auth: config.innerAuth,
    identity: `${credentials.username}@${config.realm}`,
    anonymous_identity: `anonymous@${config.realm}`,
    password: credentials.password,
    realm: config.realm,
    radius_host: config.radiusHost,
    ca_certificate: config.caCertUrl || 'Not required for initial setup',
  };
}
