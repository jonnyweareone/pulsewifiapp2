'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { WifiIcon, CheckIcon, BellIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

type Step = 'form' | 'install-pwa' | 'enable-push' | 'verification-sent';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const { isSupported, isEnabled, playerId, requestPermission, permissionStatus } = usePushNotifications();
  const { isIOS, isStandalone, isInstallable, promptInstall } = usePWAInstall();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if iOS and needs PWA install first
  const needsPWAInstall = isIOS && !isStandalone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Create account without email verification
    const { data, error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      setUserId(data.user.id);
      
      // On iOS, need PWA install first
      if (needsPWAInstall) {
        setStep('install-pwa');
      } else {
        setStep('enable-push');
      }
    }
    
    setLoading(false);
  };

  const handleEnablePush = async () => {
    setLoading(true);
    setError(null);

    try {
      const granted = await requestPermission();
      
      if (!granted) {
        setError('Notifications are required to verify your account and receive Wi-Fi settings');
        setLoading(false);
        return;
      }

      // Wait for player ID to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentPlayerId = playerId || window.OneSignal?.User?.PushSubscription?.id;
      
      if (!currentPlayerId) {
        setError('Failed to register for notifications. Please try again.');
        setLoading(false);
        return;
      }

      // Send verification notification
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          player_id: currentPlayerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification');
      }

      setStep('verification-sent');
    } catch (err) {
      setError('Failed to send verification. Please try again.');
    }
    
    setLoading(false);
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      await promptInstall();
    }
    // After install attempt, move to push step
    // (iOS users need to manually install, so we show instructions)
  };

  // Form step
  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-8 group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
              <WifiIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Pulse WiFi</span>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Create your account</CardTitle>
              <CardDescription className="text-center">
                Sign up to get seamless WiFi across participating venues
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Input
                  type="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  helperText="Must be at least 8 characters"
                />

                <Input
                  type="password"
                  label="Confirm password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <div className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-gray-400">
                    I agree to the{' '}
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-indigo-400 hover:text-indigo-300">
                      Privacy Policy
                    </a>
                  </span>
                </div>

                <Button type="submit" loading={loading} className="w-full">
                  Create account
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">What you get:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    Free WiFi across participating venues
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    Automatic, seamless connections
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    Enterprise-grade security
                  </li>
                </ul>
              </div>

              <p className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // iOS PWA Install step
  if (step === 'install-pwa') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-6">
              <DevicePhoneMobileIcon className="h-8 w-8 text-indigo-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Install Pulse WiFi</h2>
            <p className="text-gray-400 mb-6">
              To receive notifications on iPhone, install the app to your home screen first.
            </p>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-3">Follow these steps:</p>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  Tap the <strong className="text-white">Share</strong> button below
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  Tap <strong className="text-white">"Add"</strong> in the top right
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                  Open <strong className="text-white">Pulse WiFi</strong> from your home screen
                </li>
              </ol>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Already installed? Open the app from your home screen to continue.
            </p>

            <Button 
              onClick={() => setStep('enable-push')}
              variant="secondary"
              className="w-full"
            >
              I've installed the app
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enable Push step
  if (step === 'enable-push') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-6">
              <BellIcon className="h-8 w-8 text-indigo-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Enable Notifications</h2>
            <p className="text-gray-400 mb-6">
              We'll send you a verification link and your Wi-Fi setup instructions via notification.
            </p>

            {error && (
              <Alert variant="error" className="mb-6 text-left">
                {error}
              </Alert>
            )}

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-2">You'll receive:</p>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-400" />
                  Account verification link
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-400" />
                  Wi-Fi setup instructions
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-green-400" />
                  New venue alerts (optional)
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleEnablePush}
              loading={loading}
              className="w-full"
            >
              <BellIcon className="h-5 w-5 mr-2" />
              Enable Notifications
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              You can manage notification preferences anytime in settings
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verification Sent step
  if (step === 'verification-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
              <CheckIcon className="h-8 w-8 text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Notifications!</h2>
            <p className="text-gray-400 mb-6">
              We've sent a verification link to your device. Tap the notification to verify your account and get your Wi-Fi settings.
            </p>

            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-500 rounded-lg p-2 flex-shrink-0">
                  <WifiIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">✅ Verify Your Account</p>
                  <p className="text-xs text-gray-400">Tap to verify your Pulse WiFi account...</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Didn't receive it? Check your notification center or
            </p>

            <Button 
              onClick={handleEnablePush}
              variant="secondary"
              loading={loading}
              className="w-full"
            >
              Resend Verification
            </Button>

            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-sm text-gray-500 hover:text-gray-400"
            >
              Skip for now (limited access)
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
