'use client';

import { PushGate } from '@/components/pwa';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useCallback } from 'react';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  /** If true, blocks access when push is disabled. Default: true */
  requirePush?: boolean;
}

/**
 * Wrapper for authenticated pages that:
 * 1. Checks push notification status on every load
 * 2. Blocks RADIUS/WiFi access if push is disabled (optional)
 * 3. Updates user's push status in database
 */
export function AuthenticatedLayout({ 
  children, 
  requirePush = true 
}: AuthenticatedLayoutProps) {
  const { user } = useAuth();

  // Update push status in database when it changes
  const handlePushStatusChange = useCallback(async (enabled: boolean) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // Update profile with push notification status
      // This can be used to gate RADIUS access on the backend
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_enabled: enabled,
          push_checked_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[AuthenticatedLayout] Failed to update push status:', error);
      } else {
        console.log('[AuthenticatedLayout] Push status updated:', enabled);
      }
    } catch (err) {
      console.error('[AuthenticatedLayout] Error updating push status:', err);
    }
  }, [user]);

  return (
    <PushGate 
      blocking={requirePush} 
      onPushStatusChange={handlePushStatusChange}
    >
      {children}
    </PushGate>
  );
}
