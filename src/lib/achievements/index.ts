import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// Achievement check functions
const achievementChecks: Record<string, (profileId: string) => Promise<boolean>> = {
  first_connect: async (profileId) => {
    const { data } = await supabase
      .from('passpoint_credentials')
      .select('id')
      .eq('profile_id', profileId)
      .limit(1);
    return (data?.length || 0) > 0;
  },
  
  speed_demon: async (profileId) => {
    const { data } = await supabase
      .from('coverage_surveys')
      .select('id')
      .eq('profile_id', profileId)
      .limit(1);
    return (data?.length || 0) > 0;
  },
  
  multi_device: async (profileId) => {
    const { data } = await supabase
      .from('user_devices')
      .select('id')
      .eq('profile_id', profileId)
      .eq('is_active', true);
    return (data?.length || 0) >= 2;
  },
  
  social_1: async (profileId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('personal_invite_code')
      .eq('id', profileId)
      .single();
    
    if (!profile?.personal_invite_code) return false;
    
    const { data: referrals } = await supabase
      .from('profiles')
      .select('id')
      .eq('invite_code_used', profile.personal_invite_code);
    
    return (referrals?.length || 0) >= 1;
  },
  
  social_5: async (profileId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('personal_invite_code')
      .eq('id', profileId)
      .single();
    
    if (!profile?.personal_invite_code) return false;
    
    const { data: referrals } = await supabase
      .from('profiles')
      .select('id')
      .eq('invite_code_used', profile.personal_invite_code);
    
    return (referrals?.length || 0) >= 5;
  },
  
  premium: async (profileId) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('tier_id, tiers!inner(slug)')
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .single();
    
    // @ts-ignore - tiers is joined
    return data?.tiers?.slug !== 'free';
  },
};

// Send in-app message via OneSignal
async function triggerInAppMessage(playerId: string, achievement: any) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return;
  
  await fetch(`https://onesignal.com/api/v1/players/${playerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      tags: {
        last_achievement: achievement.slug,
        last_achievement_name: achievement.name,
        last_achievement_icon: achievement.icon,
        achievement_earned_at: new Date().toISOString(),
      },
    }),
  });
}

// Check and award achievements for a user
export async function checkAndAwardAchievements(profileId: string, specificCheck?: string) {
  const awarded: any[] = [];
  
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true);
  
  if (!achievements) return awarded;
  
  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('profile_id', profileId);
  
  const earnedIds = new Set(earned?.map(e => e.achievement_id) || []);
  
  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) continue;
    if (specificCheck && achievement.slug !== specificCheck) continue;
    
    const checker = achievementChecks[achievement.slug];
    if (!checker) continue;
    
    const qualified = await checker(profileId);
    
    if (qualified) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          profile_id: profileId,
          achievement_id: achievement.id,
        });
      
      if (!error) {
        awarded.push(achievement);
        
        const { data: device } = await supabase
          .from('user_devices')
          .select('onesignal_player_id')
          .eq('profile_id', profileId)
          .not('onesignal_player_id', 'is', null)
          .limit(1)
          .single();
        
        if (device?.onesignal_player_id) {
          await triggerInAppMessage(device.onesignal_player_id, achievement);
        }
      }
    }
  }
  
  return awarded;
}

// Map events to achievement checks
export const eventToAchievement: Record<string, string> = {
  'wifi_setup_complete': 'first_connect',
  'speed_test_complete': 'speed_demon',
  'device_registered': 'multi_device',
  'referral_complete': 'social_1',
  'subscription_upgraded': 'premium',
};
