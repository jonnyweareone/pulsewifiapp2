'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserDevice {
  id: string;
  profile_id: string;
  mac_address: string;
  device_name: string | null;
  device_type: string | null;
  manufacturer: string | null;
  is_active: boolean;
  first_seen: string;
  last_seen: string;
}

/**
 * Custom hook for managing user devices.
 */
export function useDevices() {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    // First get the user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('profile_id', profile.id)
      .order('last_seen', { ascending: false });

    if (fetchError) {
      // Table might not exist yet
      if (fetchError.code === '42P01') {
        setDevices([]);
      } else {
        setError(fetchError.message);
      }
    } else {
      setDevices((data as UserDevice[]) || []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    fetchDevices,
  };
}
