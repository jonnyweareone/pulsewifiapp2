'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
  WifiIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface ProvisioningData {
  childName: string;
  username: string;
  password: string;
  policyProfile: string;
  expiresAt: string;
}

export default function ProvisionPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProvisioningData | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|mac/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    }

    // Fetch provisioning data
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/provision/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid or expired link');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provisioning data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleInstall = async () => {
    setInstalling(true);

    try {
      if (platform === 'ios') {
        // Download iOS mobileconfig
        window.location.href = `/api/provision/${token}/ios-profile`;
      } else if (platform === 'android') {
        // Trigger Android Passpoint installation
        window.location.href = `/api/provision/${token}/android-profile`;
      }

      // Mark as installed after a delay
      setTimeout(() => {
        setInstalled(true);
        setInstalling(false);
      }, 2000);
    } catch (err) {
      setInstalling(false);
      alert('Failed to download profile. Please try again.');
    }
  };

  const getPolicyInfo = (policy: string) => {
    switch (policy) {
      case 'child-safe':
        return {
          label: 'Child Safe',
          color: 'success',
          features: ['Adult content blocked', 'Safe search enforced', 'Social media restricted'],
        };
      case 'teen':
        return {
          label: 'Teen',
          color: 'warning',
          features: ['Adult content blocked', 'Safe search enforced', 'Social media allowed'],
        };
      case 'young-adult':
        return {
          label: 'Young Adult',
          color: 'info',
          features: ['Adult content blocked', 'Safe search on by default'],
        };
      default:
        return {
          label: 'Standard',
          color: 'default',
          features: ['Basic protection'],
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Link Invalid</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Ask your parent to generate a new QR code from the Pulse WiFi app.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const policyInfo = getPolicyInfo(data.policyProfile);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-indigo-500/20 rounded-full w-fit">
            <WifiIcon className="h-10 w-10 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl">Set Up Pulse WiFi</CardTitle>
          <p className="text-gray-400 mt-2">
            Hi {data.childName}! Let&apos;s get you connected to safe WiFi.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Safety Badge */}
          <div className="flex items-center justify-center">
            <Badge variant={policyInfo.color as any} className="text-sm py-1 px-3">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              {policyInfo.label} Mode
            </Badge>
          </div>

          {/* Features */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Your WiFi includes:</h3>
            <ul className="space-y-2">
              {policyInfo.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Detection */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400 mb-4">
              {platform === 'ios' ? (
                <>
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  iPhone/iPad detected
                </>
              ) : platform === 'android' ? (
                <>
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  Android detected
                </>
              ) : (
                <>
                  <ComputerDesktopIcon className="h-4 w-4" />
                  Device detected
                </>
              )}
            </div>
          </div>

          {/* Install Button */}
          {!installed ? (
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full py-3 text-lg"
            >
              {installing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                  Installing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Install WiFi Profile
                </span>
              )}
            </Button>
          ) : (
            <div className="text-center py-4">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">All Done!</h3>
              <p className="text-gray-400 text-sm">
                You&apos;ll now automatically connect to Pulse WiFi whenever it&apos;s available.
              </p>
            </div>
          )}

          {/* Manual Setup Link */}
          {!installed && (
            <p className="text-center text-sm text-gray-500">
              Having trouble?{' '}
              <a
                href={`/provision/${token}/manual`}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Set up manually
              </a>
            </p>
          )}

          {/* Expiry Notice */}
          <p className="text-center text-xs text-gray-600">
            This link expires{' '}
            {new Date(data.expiresAt).toLocaleDateString(undefined, {
              weekday: 'long',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
