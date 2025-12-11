import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// OneSignal Data Feed endpoint
// Configure in OneSignal: GET https://app.pulsewifi.co.uk/api/onesignal/user-data?external_id={{ subscription.external_id }}
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get('external_id'); // This is the user_id
  
  if (!externalId) {
    return NextResponse.json({ error: 'external_id required' }, { status: 400 });
  }

  try {
    // Get profile with subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        email,
        created_at,
        subscriptions (
          status,
          tiers (
            name,
            slug
          )
        )
      `)
      .eq('user_id', externalId)
      .single();

    if (!profile) {
      return NextResponse.json({ 
        found: false,
        display_name: 'User',
        tier: 'free',
      });
    }

    // Get achievements stats
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, achievements(points)')
      .eq('profile_id', profile.id);

    const totalPoints = achievements?.reduce((sum, a: any) => 
      sum + (a.achievements?.points || 0), 0) || 0;

    // Get device count
    const { count: deviceCount } = await supabase
      .from('user_devices')
      .select('id', { count: 'exact' })
      .eq('profile_id', profile.id)
      .eq('app_installed', true);

    // Get connection stats
    const { count: connectionCount } = await supabase
      .from('passpoint_credentials')
      .select('id', { count: 'exact' })
      .eq('profile_id', profile.id);

    // Calculate days since signup
    const signupDate = new Date(profile.created_at);
    const daysSinceSignup = Math.floor(
      (Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get subscription tier
    const subscription = (profile as any).subscriptions?.[0];
    const tier = subscription?.tiers?.slug || 'free';
    const tierName = subscription?.tiers?.name || 'Free';

    return NextResponse.json({
      found: true,
      display_name: profile.display_name || profile.email?.split('@')[0] || 'User',
      first_name: profile.display_name?.split(' ')[0] || 'there',
      email: profile.email,
      
      // Subscription
      tier: tier,
      tier_name: tierName,
      is_premium: tier !== 'free',
      
      // Engagement
      total_points: totalPoints,
      achievements_earned: achievements?.length || 0,
      device_count: deviceCount || 0,
      has_wifi_setup: (connectionCount || 0) > 0,
      
      // Lifecycle
      days_since_signup: daysSinceSignup,
      is_new_user: daysSinceSignup <= 7,
      signup_date: profile.created_at,
    });

  } catch (error) {
    console.error('OneSignal data feed error:', error);
    return NextResponse.json({ 
      found: false,
      error: 'Failed to fetch user data',
    }, { status: 500 });
  }
}
