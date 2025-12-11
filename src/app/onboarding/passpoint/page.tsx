'use client';

// Force dynamic rendering to prevent build-time errors when env vars aren't available
export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Stepper,
  Alert,
} from '@/components/ui';
import {
  WifiIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

type Platform = 'ios' | 'android' | 'manual' | null;

interface ManualSettings {
  ssid: string;
  security: string;
  eap_method: string;
  anonymous_identity: string;
  identity: string;
  password: string;
  realm: string;
}

const steps = [
  { id: 1, title: 'Learn', description: 'What is Passpoint?' },
  { id: 2, title: 'Device', description: 'Choose your device' },
  { id: 3, title: 'Install', description: 'Get your profile' },
];

function PasspointOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [manualSettings, setManualSettings] = useState<ManualSettings | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for platform param to skip to step 2
  useEffect(() => {
    const platform = searchParams.get('platform') as Platform;
    if (platform && ['ios', 'android', 'manual'].includes(platform)) {
      setSelectedPlatform(platform);
      setCurrentStep(1);
    }
  }, [searchParams]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    handleNext();
  };

  const handleDownloadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      if (selectedPlatform === 'ios') {
        const response = await fetch('/api/passpoint/ios-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate profile');
        }

        // Download the profile
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pulse-wifi-passpoint.mobileconfig';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSuccess(true);
      } else if (selectedPlatform === 'android') {
        const response = await fetch('/api/passpoint/android-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate profile');
        }

        const data = await response.json();
        setManualSettings(data);
        setSuccess(true);
      } else if (selectedPlatform === 'manual') {
        const response = await fetch('/api/passpoint/manual-settings');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get settings');
        }

        const data = await response.json();
        setManualSettings(data);
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Get Seamless WiFi</h1>
            <p className="mt-2 text-gray-400">
              Set up Passpoint for automatic WiFi connectivity
            </p>
          </div>

          {/* Stepper */}
          <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

          {/* Step Content */}
          <Card>
            <CardContent className="py-8">
              {/* Step 1: Learn */}
              {currentStep === 0 && (
                <div className="text-center max-w-lg mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-6">
                    <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-4">
                    What is Passpoint?
                  </h2>

                  <p className="text-gray-400 mb-6">
                    Passpoint (Hotspot 2.0) is an industry standard that enables seamless and secure
                    WiFi connectivity. Once configured, your device will automatically connect to
                    Pulse WiFi hotspots without you having to do anything.
                  </p>

                  <div className="grid gap-4 text-left mb-8">
                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Secure Connection</p>
                        <p className="text-sm text-gray-400">
                          Enterprise-grade WPA2/WPA3 encryption protects all your data
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Automatic Authentication</p>
                        <p className="text-sm text-gray-400">
                          No passwords to remember - your device handles it automatically
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Trusted Networks Only</p>
                        <p className="text-sm text-gray-400">
                          Your device only connects to verified Pulse WiFi hotspots
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleNext}>
                    Continue
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Device Selection */}
              {currentStep === 1 && (
                <div className="max-w-lg mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    Select Your Device
                  </h2>
                  <p className="text-gray-400 mb-8 text-center">
                    Choose your device type to get the right configuration
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={() => handlePlatformSelect('ios')}
                      className={`w-full p-5 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
                        selectedPlatform === 'ios'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="p-3 bg-gray-500/20 rounded-lg">
                        <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">iPhone or Mac</p>
                        <p className="text-sm text-gray-400">
                          iOS 11+ or macOS 10.13+
                        </p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-500" />
                    </button>

                    <button
                      onClick={() => handlePlatformSelect('android')}
                      className={`w-full p-5 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
                        selectedPlatform === 'android'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <DevicePhoneMobileIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">Android</p>
                        <p className="text-sm text-gray-400">
                          Android 6.0+ with Passpoint support
                        </p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-500" />
                    </button>

                    <button
                      onClick={() => handlePlatformSelect('manual')}
                      className={`w-full p-5 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
                        selectedPlatform === 'manual'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <ComputerDesktopIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">Other / Manual</p>
                        <p className="text-sm text-gray-400">
                          Windows, Linux, or manual configuration
                        </p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="mt-6 flex justify-start">
                    <Button variant="ghost" onClick={handleBack}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Install */}
              {currentStep === 2 && (
                <div className="max-w-lg mx-auto">
                  {error && (
                    <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  {success ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                        <CheckIcon className="h-8 w-8 text-green-400" />
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-4">
                        {selectedPlatform === 'ios' ? 'Profile Downloaded!' : 'Configuration Ready!'}
                      </h2>

                      {selectedPlatform === 'ios' && (
                        <div className="text-left bg-white/5 rounded-lg p-4 mb-6">
                          <h3 className="font-medium text-white mb-2">Next Steps:</h3>
                          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                            <li>Open the downloaded file on your iPhone or Mac</li>
                            <li>Go to Settings → General → VPN & Device Management</li>
                            <li>Tap on the Pulse WiFi profile</li>
                            <li>Tap &quot;Install&quot; and enter your device passcode</li>
                            <li>Your device will now auto-connect to Pulse WiFi!</li>
                          </ol>
                        </div>
                      )}

                      {(selectedPlatform === 'android' || selectedPlatform === 'manual') && manualSettings && (
                        <div className="text-left bg-white/5 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-white">WiFi Settings</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(JSON.stringify(manualSettings, null, 2))
                              }
                            >
                              <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                              {copied ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">SSID:</span>
                              <span className="text-white font-mono">{manualSettings.ssid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Security:</span>
                              <span className="text-white font-mono">{manualSettings.security}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">EAP Method:</span>
                              <span className="text-white font-mono">{manualSettings.eap_method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Identity:</span>
                              <span className="text-white font-mono">{manualSettings.identity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Password:</span>
                              <span className="text-white font-mono">{manualSettings.password}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Realm:</span>
                              <span className="text-white font-mono">{manualSettings.realm}</span>
                            </div>
                          </div>

                          {selectedPlatform === 'android' && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <div className="flex items-start gap-2">
                                <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                <p className="text-xs text-yellow-400">
                                  For full Passpoint support, your Android device needs to support
                                  Hotspot 2.0. Use these settings for manual WiFi configuration.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Link href="/dashboard">
                        <Button>
                          Go to Dashboard
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-6">
                          <ArrowDownTrayIcon className="h-8 w-8 text-indigo-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                          {selectedPlatform === 'ios'
                            ? 'Download iOS/macOS Profile'
                            : selectedPlatform === 'android'
                            ? 'Get Android Configuration'
                            : 'View Manual Settings'}
                        </h2>

                        <p className="text-gray-400">
                          {selectedPlatform === 'ios'
                            ? 'Click below to download your personalized WiFi profile. Install it on your device to enable automatic connectivity.'
                            : selectedPlatform === 'android'
                            ? 'We\'ll generate your WiFi credentials. Use them to configure your Android device for Pulse WiFi.'
                            : 'Get the manual WiFi settings to configure any device for Pulse WiFi.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button onClick={handleDownloadProfile} loading={loading} className="w-full">
                          {selectedPlatform === 'ios' ? (
                            <>
                              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                              Download Profile
                            </>
                          ) : (
                            <>
                              <WifiIcon className="mr-2 h-5 w-5" />
                              Get Configuration
                            </>
                          )}
                        </Button>

                        <Button variant="ghost" onClick={handleBack}>
                          <ArrowLeftIcon className="mr-2 h-4 w-4" />
                          Choose Different Device
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function OnboardingFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Get Seamless WiFi</h1>
            <p className="mt-2 text-gray-400">
              Set up Passpoint for automatic WiFi connectivity
            </p>
          </div>
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PasspointOnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <PasspointOnboardingContent />
    </Suspense>
  );
}
