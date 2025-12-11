import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This endpoint should be called by Vercel Cron or external scheduler
// Vercel Cron: Add to vercel.json { "crons": [{ "path": "/api/cron/check-stale-devices", "schedule": "0 0 * * *" }] }

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find devices with no heartbeat in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Mark devices as uninstalled
    const { data: staleDevices, error } = await supabase
      .from('user_devices')
      .update({ 
        app_installed: false,
        is_active: false,
      })
      .lt('last_heartbeat_at', sevenDaysAgo.toISOString())
      .eq('app_installed', true)
      .select('id, profile_id');

    if (error) {
      throw error;
    }

    // Optional: Disable passpoint credentials for users with no active devices
    if (staleDevices && staleDevices.length > 0) {
      const profileIds = Array.from(new Set(staleDevices.map(d => d.profile_id)));
      
      // Check each profile for remaining active devices
      for (const profileId of profileIds) {
        const { data: activeDevices } = await supabase
          .from('user_devices')
          .select('id')
          .eq('profile_id', profileId)
          .eq('app_installed', true)
          .limit(1);

        // If no active devices, flag the passpoint credentials
        if (!activeDevices?.length) {
          await supabase
            .from('passpoint_credentials')
            .update({ 
              is_active: false,
              // Don't delete - user might reinstall
              // Instead, reactivate on next login
            })
            .eq('profile_id', profileId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      stale_devices_found: staleDevices?.length || 0,
      checked_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Stale device check error:', error);
    return NextResponse.json(
      { error: 'Check failed' },
      { status: 500 }
    );
  }
}
