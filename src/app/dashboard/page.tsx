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
  ArrowRightIcon,
  SignalIcon,
  ChevronRightIcon,
  SparklesIcon,
  MapPinIcon,
  BoltIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface PasspointCredential {
  id: string;
  username: string;
  is_active: boolean;
  provisioned_at: string | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [credential, setCredential] = useState<PasspointCredential | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
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

        const { count } = await supabase
          .from('user_devices')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id);

        setDeviceCount(count || 0);
      }
    };

    fetchUserData();
  }, [user]);

  const isProvisioned = credential !== null;
  const firstName = user?.email?.split('@')[0] || 'there';

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AuthenticatedLayout requirePush={true}>
      <AppShell>
        <div className="px-5 pt-6">
          {/* Header */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white capitalize">{firstName} 👋</h1>
          </div>

          {/* WiFi Status Card */}
          <div className={`relative overflow-hidden rounded-3xl p-5 mb-6 ${
            isProvisioned 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20' 
              : 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isProvisioned ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <WifiIcon className="w-5 h-5 text-purple-400" />
                  )}
                  <span className={`text-sm font-medium ${isProvisioned ? 'text-green-400' : 'text-purple-400'}`}>
                    {isProvisioned ? 'WiFi Active' : 'Setup Required'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {isProvisioned ? 'You\'re all set!' : 'Get Seamless WiFi'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isProvisioned 
                    ? 'Auto-connect enabled across all Pulse hotspots' 
                    : 'Connect once, stay connected everywhere'}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${isProvisioned ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                <WifiIcon className={`w-8 h-8 ${isProvisioned ? 'text-green-400' : 'text-purple-400'}`} />
              </div>
            </div>
            
            {!isProvisioned && (
              <Link 
                href="/onboarding/passpoint"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-semibold text-white"
              >
                Set Up Now
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link 
              href="/check"
              className="bg-[#12121a] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="p-2.5 bg-blue-500/20 rounded-xl w-fit mb-3">
                <SignalIcon className="w-6 h-6 text-blue-400" />
              </div>
              <p className="font-semibold text-white">Speed Test</p>
              <p className="text-xs text-gray-500 mt-0.5">Check your connection</p>
            </Link>

            <Link 
              href="/dashboard/explore"
              className="bg-[#12121a] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="p-2.5 bg-pink-500/20 rounded-xl w-fit mb-3">
                <MapPinIcon className="w-6 h-6 text-pink-400" />
              </div>
              <p className="font-semibold text-white">Explore</p>
              <p className="text-xs text-gray-500 mt-0.5">Find hotspots nearby</p>
            </Link>

            <Link 
              href="/achievements"
              className="bg-[#12121a] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="p-2.5 bg-amber-500/20 rounded-xl w-fit mb-3">
                <SparklesIcon className="w-6 h-6 text-amber-400" />
              </div>
              <p className="font-semibold text-white">Rewards</p>
              <p className="text-xs text-gray-500 mt-0.5">Earn points & perks</p>
            </Link>

            <Link 
              href="/dashboard/family"
              className="bg-[#12121a] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              <div className="p-2.5 bg-indigo-500/20 rounded-xl w-fit mb-3">
                <UserGroupIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="font-semibold text-white">Family</p>
              <p className="text-xs text-gray-500 mt-0.5">Add family members</p>
            </Link>
          </div>

          {/* Stats */}
          <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{deviceCount}</p>
                <p className="text-xs text-gray-500">Devices</p>
              </div>
              <div className="text-center border-x border-white/5">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-gray-500">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-gray-500">Points</p>
              </div>
            </div>
          </div>

          {/* Download Options */}
          {isProvisioned && (
            <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden mb-6">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-semibold text-white">Download Profile</h3>
                <p className="text-xs text-gray-500 mt-0.5">Install on another device</p>
              </div>
              
              <Link 
                href="/onboarding/passpoint?platform=ios"
                className="flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">iPhone / Mac</p>
                    <p className="text-xs text-gray-500">.mobileconfig profile</p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </Link>

              <Link 
                href="/onboarding/passpoint?platform=android"
                className="flex items-center justify-between p-4 active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Android</p>
                    <p className="text-xs text-gray-500">Passpoint config</p>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center gap-3 p-4 bg-[#12121a] border border-white/5 rounded-2xl mb-6">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <ShieldCheckIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Enterprise Security</p>
              <p className="text-xs text-gray-500">WPA2/WPA3 encrypted connection</p>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthenticatedLayout>
  );
}
