'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WifiIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyToken(token);
  }, [token]);

  async function verifyToken(token: string) {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Your account is verified! Redirecting to setup...');
        
        setTimeout(() => {
          router.push('/onboarding/passpoint');
        }, 2000);
      } else if (data.error === 'Token expired') {
        setStatus('expired');
        setMessage('This verification link has expired. Please request a new one.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  async function resendVerification() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setStatus('loading');
    setMessage('Sending new verification...');

    const playerId = (window as any).OneSignal?.User?.PushSubscription?.id;
    
    if (!playerId) {
      setStatus('error');
      setMessage('Please enable notifications first');
      return;
    }

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          player_id: playerId,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('New verification sent! Check your notifications.');
      } else {
        setStatus('error');
        setMessage('Failed to send verification');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to send verification');
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <WifiIcon className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white">Pulse WiFi</span>
      </div>

      {/* Status Icon */}
      <div className="mb-6">
        {status === 'loading' && (
          <div className="h-16 w-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto" />
        )}
        {(status === 'error' || status === 'expired') && (
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto" />
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2">
        {status === 'loading' && 'Verifying...'}
        {status === 'success' && 'Verified!'}
        {status === 'error' && 'Verification Failed'}
        {status === 'expired' && 'Link Expired'}
      </h1>

      {/* Message */}
      <p className="text-white/70 mb-6">{message}</p>

      {/* Actions */}
      {status === 'expired' && (
        <button
          onClick={resendVerification}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Send New Verification
        </button>
      )}

      {status === 'error' && (
        <button
          onClick={() => router.push('/auth/register')}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Back to Sign Up
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <WifiIcon className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white">Pulse WiFi</span>
      </div>
      <div className="mb-6">
        <div className="h-16 w-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Verifying...</h1>
      <p className="text-white/70">Please wait</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingState />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
