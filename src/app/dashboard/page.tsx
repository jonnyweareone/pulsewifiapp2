'use client';

// Force dynamic rendering to prevent build-time errors when env vars aren't available
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
} from '@/components/ui';
import {
  WifiIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

interface PasspointCredential {
  id: string;
  username: string;
  is_active: boolean;
  provisioned_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface UserDevice {
  id: string;
  device_name: string | null;
  device_type: string | null;
  mac_address: string;
  is_active: boolean;
  first_seen: string;
  last_seen: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [credential, setCredential] = useState<PasspointCredential | null>(null);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const supabase = createClient();

      // First get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Fetch passpoint credential
        const { data: credData } = await supabase
          .from('passpoint_credentials')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_active', true)
          .single();

        setCredential(credData as PasspointCredential | null);

        // Fetch user devices
        const { data: devicesData } = await supabase
          .from('user_devices')
          .select('*')
          .eq('profile_id', profile.id)
          .order('last_seen', { ascending: false });

        setDevices((devicesData as UserDevice[]) || []);
      }

      setLoadingData(false);
    };

    fetchUserData();
  }, [user]);

  const isProvisioned = credential !== null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const getDeviceIcon = (type: string | null) => {
    if (!type) return DevicePhoneMobileIcon;
    if (type.toLowerCase().includes('mac') || type.toLowerCase().includes('windows') || type.toLowerCase().includes('laptop')) {
      return ComputerDesktopIcon;
    }
    return DevicePhoneMobileIcon;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8" style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-gray-400">
              Welcome back, {user?.email}. Manage your Pulse WiFi access here.
            </p>
          </div>

          {/* Status Alert */}
          {!isProvisioned && (
            <Alert variant="info" className="mb-8" title="Get Seamless WiFi">
              You haven&apos;t set up Passpoint yet. Complete the onboarding to get automatic WiFi
              connectivity across participating venues.
              <div className="mt-3">
                <Link href="/onboarding/passpoint">
                  <Button size="sm">
                    Set Up Now
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WiFi Status Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your WiFi Status</CardTitle>
                    <CardDescription>
                      Passpoint 2.0 configuration status for your account
                    </CardDescription>
                  </div>
                  {isProvisioned ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      Provisioned
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <ExclamationCircleIcon className="h-3 w-3" />
                      Not Provisioned
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Status Info */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <WifiIcon className="h-5 w-5 text-indigo-400" />
                      </div>
                      <span className="font-medium text-white">Passpoint Status</span>
                    </div>
                    {isProvisioned ? (
                      <div className="text-sm text-gray-400">
                        <p>
                          Username:{' '}
                          <span className="text-white font-mono">{credential.username}</span>
                        </p>
                        <p className="mt-1">
                          Provisioned:{' '}
                          {credential.provisioned_at
                            ? new Date(credential.provisioned_at).toLocaleDateString()
                            : 'N/A'}
                        </p>
                        {credential.last_used_at && (
                          <p className="mt-1">
                            Last used:{' '}
                            {new Date(credential.last_used_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Complete the onboarding to get your Passpoint credentials.
                      </p>
                    )}
                  </div>

                  {/* Devices Connected */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="font-medium text-white">Registered Devices</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p className="text-2xl font-bold text-white mb-1">{devices.length}</p>
                      <p>device{devices.length !== 1 ? 's' : ''} registered</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-3">
                <Link href="/onboarding/passpoint">
                  <Button variant={isProvisioned ? 'secondary' : 'primary'}>
                    {isProvisioned ? 'Download Profile' : 'Get Seamless WiFi'}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/check">
                  <Button variant="secondary">
                    <SignalIcon className="h-4 w-4 mr-2" />
                    Speed Test
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Download Configuration</CardTitle>
                <CardDescription>Quick access to download your WiFi profile</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Link href="/onboarding/passpoint?platform=ios" className="block">
                  <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-3 group">
                    <div className="p-2 bg-gray-500/20 rounded-lg group-hover:bg-gray-500/30 transition-colors">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">iPhone / Mac</p>
                      <p className="text-xs text-gray-500">.mobileconfig profile</p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/onboarding/passpoint?platform=android" className="block">
                  <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-3 group">
                    <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Android</p>
                      <p className="text-xs text-gray-500">Passpoint config</p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/onboarding/passpoint?platform=manual" className="block">
                  <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-3 group">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Manual Settings</p>
                      <p className="text-xs text-gray-500">For advanced users</p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Devices Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Devices</CardTitle>
                    <CardDescription>
                      Devices registered with your Pulse WiFi account
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                  </div>
                ) : devices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                            Device
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                            Type
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                            MAC Address
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                            Last Seen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map((device) => {
                          const DeviceIcon = getDeviceIcon(device.device_type);
                          return (
                            <tr
                              key={device.id}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <DeviceIcon className="h-5 w-5 text-gray-400" />
                                  <span className="text-white">
                                    {device.device_name || 'Unknown Device'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-400">
                                {device.device_type || 'Unknown'}
                              </td>
                              <td className="py-3 px-4 text-gray-400 font-mono text-sm">
                                {device.mac_address}
                              </td>
                              <td className="py-3 px-4">
                                {device.is_active ? (
                                  <Badge variant="success" size="sm">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="default" size="sm">
                                    Inactive
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-sm">
                                {new Date(device.last_seen).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DevicePhoneMobileIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Devices Yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Devices will appear here after you connect to Pulse WiFi for the first time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
