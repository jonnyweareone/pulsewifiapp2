'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { WifiIcon, CheckIcon, BellIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon, ShareIcon } from '@heroicons/react/24/outline';

type Step = 'form' | 'install-pwa' | 'enable-push' | 'verification-sent';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const { 
    isSupported, 
    isEnabled, 
    playerId, 
    requestPermission, 
    permissionStatus,
    isInitializing,
    isReady,
    isIOS,
    isStandalone,
    error: pushError 
  } = usePushNotifications();
  const { isInstallable, promptInstall } = usePWAInstall();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugTaps, setDebugTaps] = useState(0);

  // iOS needs PWA install if not in standalone mode
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
      
      // On iOS not in standalone mode, need PWA install first
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
      console.log('[Register] Starting push enable flow...');
      console.log('[Register] isIOS:', isIOS, 'isStandalone:', isStandalone, 'isSupported:', isSupported);
      
      // Check if we're on iOS but not in standalone mode
      if (isIOS && !isStandalone) {
        setError('On iPhone/iPad, you need to add this app to your home screen first. Tap the Share button and select "Add to Home Screen".');
        setLoading(false);
        setStep('install-pwa');
        return;
      }
      
      const granted = await requestPermission();
      console.log('[Register] Permission granted:', granted);
      
      if (!granted) {
        setError('Please allow notifications when prompted. If you accidentally blocked them, go to your browser/device settings to enable notifications for this site.');
        setLoading(false);
        return;
      }

      // Wait for player ID to be available (with timeout)
      let currentPlayerId = playerId;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (!currentPlayerId && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        currentPlayerId = window.OneSignal?.User?.PushSubscription?.id;
        attempts++;
        console.log('[Register] Waiting for player ID, attempt:', attempts, 'id:', currentPlayerId);
      }
      
      if (!currentPlayerId) {
        console.error('[Register] No player ID after', maxAttempts, 'attempts');
        // Still proceed to dashboard, but without verification
        setError('Notifications enabled but we couldn\'t complete verification. You can continue to the dashboard.');
        setLoading(false);
        return;
      }

      console.log('[Register] Got player ID:', currentPlayerId);

      // Send verification notification
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          player_id: currentPlayerId,
        }),
      });

      const result = await response.json();
      console.log('[Register] Send verification result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification');
      }

      setStep('verification-sent');
    } catch (err: any) {
      console.error('[Register] Error:', err);
      setError(err.message || 'Failed to send verification. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSkipPush = () => {
    // Allow users to skip if notifications aren't working
    router.push('/dashboard');
  };

  const handleDebugTap = () => {
    setDebugTaps(prev => {
      if (prev >= 4) {
        setShowDebug(true);
        return 0;
      }
      return prev + 1;
    });
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
              To receive notifications on iPhone/iPad, you need to install the app to your home screen first.
            </p>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-3 font-medium">Follow these steps:</p>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 font-bold">1</span>
                  <span>Tap the <strong className="text-white inline-flex items-center gap-1"><ShareIcon className="h-4 w-4" /> Share</strong> button at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 font-bold">2</span>
                  <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 font-bold">3</span>
                  <span>Tap <strong className="text-white">"Add"</strong> in the top right corner</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 font-bold">4</span>
                  <span>Open <strong className="text-white">Pulse WiFi</strong> from your home screen and come back here</span>
                </li>
              </ol>
            </div>

            <Alert variant="warning" className="mb-6 text-left text-sm">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Apple requires apps to be installed to the home screen before they can send notifications. This is a security feature.</span>
              </div>
            </Alert>

            <Button 
              onClick={() => setStep('enable-push')}
              className="w-full"
            >
              I've installed the app - Continue
            </Button>
            
            <button
              onClick={handleSkipPush}
              className="mt-4 text-sm text-gray-500 hover:text-gray-400 block w-full"
            >
              Skip for now (no notifications)
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enable Push step
  if (step === 'enable-push') {
    // Check again if iOS and not standalone
    const stillNeedsPWA = isIOS && !isStandalone;
    
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

            {(error || pushError) && (
              <Alert variant="error" className="mb-6 text-left">
                {error || pushError}
              </Alert>
            )}

            {stillNeedsPWA && (
              <Alert variant="warning" className="mb-6 text-left">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Not installed yet</p>
                    <p className="text-sm mt-1">It looks like you're still in the browser. Please install the app to your home screen first.</p>
                    <button 
                      onClick={() => setStep('install-pwa')}
                      className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 underline"
                    >
                      Show me how
                    </button>
                  </div>
                </div>
              </Alert>
            )}

            {!isSupported && !stillNeedsPWA && (
              <Alert variant="warning" className="mb-6 text-left">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Notifications not available</p>
                    <p className="text-sm mt-1">Your browser or device doesn't support push notifications. You can still use Pulse WiFi but won't receive instant updates.</p>
                  </div>
                </div>
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

            {isSupported && !stillNeedsPWA ? (
              <Button 
                onClick={handleEnablePush}
                loading={loading}
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? (
                  'Preparing...'
                ) : loading ? (
                  'Enabling...'
                ) : (
                  <>
                    <BellIcon className="h-5 w-5 mr-2" />
                    Enable Notifications
                  </>
                )}
              </Button>
            ) : stillNeedsPWA ? (
              <Button 
                onClick={() => setStep('install-pwa')}
                className="w-full"
              >
                <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                Install App First
              </Button>
            ) : (
              <Button 
                onClick={handleSkipPush}
                className="w-full"
              >
                Continue to Dashboard
              </Button>
            )}

            <button
              onClick={handleSkipPush}
              className="mt-4 text-sm text-gray-500 hover:text-gray-400 block w-full"
            >
              Skip for now
            </button>

            {/* Debug info - tap 5 times to show */}
            <button 
              onClick={handleDebugTap}
              className="mt-6 text-xs text-gray-700 hover:text-gray-600 w-full h-8"
            >
              {showDebug ? 'Hide debug info' : '\u00A0'}
            </button>
            
            {showDebug && (
              <div className="mt-2 p-3 bg-black/50 rounded text-left text-xs font-mono text-gray-400 border border-gray-800">
                <p>isIOS: {String(isIOS)}</p>
                <p>isStandalone: {String(isStandalone)}</p>
                <p>isSupported: {String(isSupported)}</p>
                <p>isReady: {String(isReady)}</p>
                <p>isInitializing: {String(isInitializing)}</p>
                <p>isEnabled: {String(isEnabled)}</p>
                <p>permission: {permissionStatus || 'null'}</p>
                <p>playerId: {playerId || 'null'}</p>
                <p>pushError: {pushError || 'null'}</p>
                <p>userId: {userId || 'null'}</p>
                <p>userAgent: {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</p>
              </div>
            )}
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
              Continue to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
