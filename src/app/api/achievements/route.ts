import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAndAwardAchievements, eventToAchievement } from '@/lib/achievements';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List user's achievements
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user_id)
    .single();
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('points', { ascending: true });
  
  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('profile_id', profile.id);
  
  const earnedMap = new Map(earned?.map(e => [e.achievement_id, e.earned_at]) || []);
  
  const result = achievements?.map(a => ({
    ...a,
    earned: earnedMap.has(a.id),
    earned_at: earnedMap.get(a.id) || null,
  }));
  
  const totalPoints = result?.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0) || 0;
  
  return NextResponse.json({
    achievements: result,
    total_points: totalPoints,
    earned_count: earned?.length || 0,
    total_count: achievements?.length || 0,
  });
}

// POST - Check achievements (called after events)
export async function POST(request: NextRequest) {
  try {
    const { user_id, event } = await request.json();
    
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user_id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    const specificCheck = event ? eventToAchievement[event] : undefined;
    const awarded = await checkAndAwardAchievements(profile.id, specificCheck);
    
    return NextResponse.json({
      success: true,
      newly_awarded: awarded,
    });
    
  } catch (error) {
    console.error('Achievement check error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
