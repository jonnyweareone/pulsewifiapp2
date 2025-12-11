/**
 * Database type definitions for Pulse WiFi Supabase.
 * These types provide TypeScript intellisense for database operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          phone: string | null;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          student_verified: boolean;
          student_email: string | null;
          student_verified_at: string | null;
          created_at: string;
          updated_at: string;
          referred_by: string | null;
          invite_code_used: string | null;
          personal_invite_code: string | null;
          home_interest: boolean;
          home_interest_date: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone?: string | null;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          student_verified?: boolean;
          student_email?: string | null;
          student_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
          referred_by?: string | null;
          invite_code_used?: string | null;
          personal_invite_code?: string | null;
          home_interest?: boolean;
          home_interest_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      user_devices: {
        Row: {
          id: string;
          profile_id: string;
          mac_address: string;
          device_name: string | null;
          device_type: string | null;
          manufacturer: string | null;
          is_active: boolean;
          first_seen: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          mac_address: string;
          device_name?: string | null;
          device_type?: string | null;
          manufacturer?: string | null;
          is_active?: boolean;
          first_seen?: string;
          last_seen?: string;
        };
        Update: Partial<Database['public']['Tables']['user_devices']['Insert']>;
      };
      passpoint_profiles: {
        Row: {
          id: string;
          name: string;
          friendly_name: string;
          fqdn: string;
          roaming_consortium_ois: string[] | null;
          nai_realm: string;
          eap_method: string;
          inner_method: string;
          credential_type: string;
          domain_suffix_match: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          friendly_name: string;
          fqdn: string;
          roaming_consortium_ois?: string[] | null;
          nai_realm: string;
          eap_method?: string;
          inner_method?: string;
          credential_type?: string;
          domain_suffix_match?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['passpoint_profiles']['Insert']>;
      };
      passpoint_credentials: {
        Row: {
          id: string;
          profile_id: string;
          passpoint_profile_id: string;
          username: string;
          password_hash: string | null;
          certificate_cn: string | null;
          imsi: string | null;
          is_active: boolean;
          provisioned_at: string | null;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          passpoint_profile_id: string;
          username: string;
          password_hash?: string | null;
          certificate_cn?: string | null;
          imsi?: string | null;
          is_active?: boolean;
          provisioned_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['passpoint_credentials']['Insert']>;
      };
      passpoint_connections: {
        Row: {
          id: string;
          credential_id: string | null;
          profile_id: string | null;
          access_point_id: string | null;
          ssid: string | null;
          bssid: string | null;
          connected_at: string;
          disconnected_at: string | null;
          auth_method: string | null;
          roaming_partner: string | null;
        };
        Insert: {
          id?: string;
          credential_id?: string | null;
          profile_id?: string | null;
          access_point_id?: string | null;
          ssid?: string | null;
          bssid?: string | null;
          connected_at?: string;
          disconnected_at?: string | null;
          auth_method?: string | null;
          roaming_partner?: string | null;
        };
        Update: Partial<Database['public']['Tables']['passpoint_connections']['Insert']>;
      };
      venues: {
        Row: {
          id: string;
          zone_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          venue_type: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          is_partner: boolean;
          is_landmark: boolean;
          logo_url: string | null;
          splash_image_url: string | null;
          primary_color: string | null;
          gwn_site_id: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          venue_type?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_partner?: boolean;
          is_landmark?: boolean;
          logo_url?: string | null;
          splash_image_url?: string | null;
          primary_color?: string | null;
          gwn_site_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      zones: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          phase: number;
          is_live: boolean;
          latitude: number | null;
          longitude: number | null;
          coverage_radius_meters: number | null;
          gwn_site_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          phase?: number;
          is_live?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          coverage_radius_meters?: number | null;
          gwn_site_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['zones']['Insert']>;
      };
      access_points: {
        Row: {
          id: string;
          zone_id: string | null;
          venue_id: string | null;
          name: string;
          mac_address: string | null;
          gwn_device_id: string | null;
          model: string | null;
          is_outdoor: boolean;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          last_seen: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          zone_id?: string | null;
          venue_id?: string | null;
          name: string;
          mac_address?: string | null;
          gwn_device_id?: string | null;
          model?: string | null;
          is_outdoor?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          last_seen?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['access_points']['Insert']>;
      };
      tiers: {
        Row: {
          id: string;
          slug: 'free' | 'student' | 'home' | 'home_plus' | 'business';
          name: string;
          price_monthly: number;
          price_yearly: number | null;
          speed_mbps: number;
          device_limit: number;
          session_limit_minutes: number | null;
          features: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: 'free' | 'student' | 'home' | 'home_plus' | 'business';
          name: string;
          price_monthly?: number;
          price_yearly?: number | null;
          speed_mbps: number;
          device_limit?: number;
          session_limit_minutes?: number | null;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tiers']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          tier_id: string;
          status: 'active' | 'cancelled' | 'past_due' | 'trialing';
          billing_cycle: 'monthly' | 'yearly';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tier_id: string;
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          billing_cycle?: 'monthly' | 'yearly';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      tier_type: 'free' | 'student' | 'home' | 'home_plus' | 'business';
    };
    CompositeTypes: {};
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserDevice = Database['public']['Tables']['user_devices']['Row'];
export type PasspointProfile = Database['public']['Tables']['passpoint_profiles']['Row'];
export type PasspointCredential = Database['public']['Tables']['passpoint_credentials']['Row'];
export type PasspointConnection = Database['public']['Tables']['passpoint_connections']['Row'];
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Zone = Database['public']['Tables']['zones']['Row'];
export type AccessPoint = Database['public']['Tables']['access_points']['Row'];
export type Tier = Database['public']['Tables']['tiers']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];

// Legacy compatibility (maps old type names to new)
export type RadiusIdentity = PasspointCredential;
export type Device = UserDevice;
export type WifiProfile = PasspointProfile;
