'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  WifiIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface PasspointCredential {
  id: string;
  username: string;
  is_active: boolean;
  provisioned_at: string | null;
  last_used_at: string | null;
}

interface UserDevice {
  id: string;
  device_name: string | null;
  device_type: string | null;
  mac_address: string;
  is_active: boolean;
  last_seen: string;
}

export default function WifiPage() {
  const { user } = useAuth();
  const [credential, setCredential] = useState<PasspointCredential | null>(null);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const supabase = createClient();

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: credData } = await supabase
          .from('passpoint_credentials')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_active', true)
          .single();

        setCredential(credData as PasspointCredential | null);

        const { data: devicesData } = await supabase
          .from('user_devices')
          .select('*')
          .eq('profile_id', profile.id)
          .order('last_seen', { ascending: false })
          .limit(10);

        setDevices((devicesData as UserDevice[]) || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const isProvisioned = credential !== null;

  const getDeviceIcon = (type: string | null) => {
    if (!type) return DevicePhoneMobileIcon;
    if (type.toLowerCase().includes('mac') || type.toLowerCase().includes('windows') || type.toLowerCase().includes('laptop')) {
      return ComputerDesktopIcon;
    }
    return DevicePhoneMobileIcon;
  };

  return (
    <AuthenticatedLayout>
      <AppShell
        header={
          <div className="px-5 py-4">
            <h1 className="text-lg font-semibold text-white">WiFi</h1>
          </div>
        }
      >
        <div className="px-5 pt-4">
          {/* Status Banner */}
          <div className={`rounded-2xl p-5 mb-6 ${
            isProvisioned 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20' 
              : 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isProvisioned ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                <WifiIcon className={`w-8 h-8 ${isProvisioned ? 'text-green-400' : 'text-purple-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isProvisioned ? 'text-green-400' : 'text-purple-400'}`}>
                  {isProvisioned ? 'Passpoint Active' : 'Not Configured'}
                </p>
                <p className="text-white font-semibold">
                  {isProvisioned ? credential.username : 'Setup Required'}
                </p>
              </div>
              {isProvisioned && <CheckCircleIcon className="w-6 h-6 text-green-400" />}
            </div>

            {!isProvisioned && (
              <Link 
                href="/onboarding/passpoint"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Profile
              </Link>
            )}

            {isProvisioned && credential.provisioned_at && (
              <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm">
                <ClockIcon className="w-4 h-4" />
                <span>Active since {new Date(credential.provisioned_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Download Options */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">
              Install on Device
            </p>
            <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden">
              <Link 
                href="/onboarding/passpoint?platform=ios"
                className="flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">iPhone / iPad / Mac</p>
                    <p className="text-xs text-gray-500">.mobileconfig profile</p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </Link>

              <Link 
                href="/onboarding/passpoint?platform=android"
                className="flex items-center justify-between p-4 active:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.3-.16-.69-.04-.85.26l-1.87 3.23c-1.39-.59-2.94-.92-4.56-.92s-3.17.33-4.56.92L5.47 5.71c-.16-.3-.55-.42-.85-.26-.3.16-.42.54-.26.85L6.2 9.48C3.45 11.12 1.6 14.04 1.6 17.4h20.8c0-3.36-1.85-6.28-4.8-7.92zM7 14.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Android</p>
                    <p className="text-xs text-gray-500">Passpoint config</p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>

          {/* Devices */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Devices
              </p>
              <span className="text-xs text-gray-600">{devices.length} registered</span>
            </div>

            {loading ? (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : devices.length > 0 ? (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden">
                {devices.map((device, i) => {
                  const Icon = getDeviceIcon(device.device_type);
                  return (
                    <div
                      key={device.id}
                      className={`flex items-center gap-3 p-4 ${i < devices.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {device.device_name || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{device.mac_address}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${device.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#12121a] border border-white/5 rounded-2xl p-8 text-center">
                <DevicePhoneMobileIcon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No devices yet</p>
                <p className="text-gray-600 text-xs">Connect to Pulse WiFi to register your device</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </AuthenticatedLayout>
  );
}
