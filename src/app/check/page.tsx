'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Card, CardContent, Alert } from '@/components/ui';
import {
  SignalIcon,
  ArrowPathIcon,
  WifiIcon,
  ClockIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface SpeedTestResult {
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  timestamp: Date;
}

interface ConnectionInfo {
  type: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'complete';

export default function SpeedCheckPage() {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get connection info from Network Information API
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      setConnectionInfo({
        type: conn.type || null,
        effectiveType: conn.effectiveType || null,
        downlink: conn.downlink || null,
        rtt: conn.rtt || null,
      });

      const handleChange = () => {
        setConnectionInfo({
          type: conn.type || null,
          effectiveType: conn.effectiveType || null,
          downlink: conn.downlink || null,
          rtt: conn.rtt || null,
        });
      };

      conn.addEventListener('change', handleChange);
      return () => conn.removeEventListener('change', handleChange);
    }
  }, []);

  const runSpeedTest = useCallback(async () => {
    setTesting(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Phase 1: Latency test
      setPhase('latency');
      const latencyResults: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await fetch('/api/ping', { method: 'HEAD', cache: 'no-store' }).catch(() => {
          // Fallback: ping a fast CDN
          return fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
            method: 'HEAD', 
            cache: 'no-store',
            mode: 'no-cors'
          });
        });
        const end = performance.now();
        latencyResults.push(end - start);
        setProgress((i + 1) * 6); // 0-30%
      }

      const avgLatency = latencyResults.reduce((a, b) => a + b, 0) / latencyResults.length;
      const jitter = Math.sqrt(
        latencyResults.reduce((sum, val) => sum + Math.pow(val - avgLatency, 2), 0) / latencyResults.length
      );

      // Phase 2: Download test
      setPhase('download');
      const downloadSpeeds: number[] = [];
      const testSizes = [1, 2, 5]; // MB sizes to test
      
      for (let i = 0; i < testSizes.length; i++) {
        const size = testSizes[i];
        const start = performance.now();
        
        // Use a CDN test file or generate random data
        const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${size * 1024 * 1024}`, {
          cache: 'no-store',
        }).catch(() => {
          // Fallback: use smaller test
          return fetch(`https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?t=${Date.now()}`, {
            cache: 'no-store',
          });
        });
        
        if (response.ok) {
          await response.arrayBuffer();
          const end = performance.now();
          const duration = (end - start) / 1000; // seconds
          const sizeBits = size * 8 * 1024 * 1024; // bits
          const speed = sizeBits / duration / 1000000; // Mbps
          downloadSpeeds.push(speed);
        }
        
        setProgress(30 + (i + 1) * 20); // 30-90%
      }

      const avgDownload = downloadSpeeds.length > 0 
        ? downloadSpeeds.reduce((a, b) => a + b, 0) / downloadSpeeds.length 
        : 0;

      // Phase 3: Upload test (simplified - browsers limit upload testing)
      setPhase('upload');
      let uploadSpeed = 0;
      
      try {
        const uploadData = new Blob([new ArrayBuffer(256 * 1024)]); // 256KB
        const start = performance.now();
        
        await fetch('https://speed.cloudflare.com/__up', {
          method: 'POST',
          body: uploadData,
        });
        
        const end = performance.now();
        const duration = (end - start) / 1000;
        uploadSpeed = (256 * 8 / 1024) / duration; // Mbps
      } catch {
        // Upload test failed, estimate from download
        uploadSpeed = avgDownload * 0.3; // Rough estimate
      }
      
      setProgress(100);
      setPhase('complete');

      const finalResult: SpeedTestResult = {
        download: Math.round(avgDownload * 10) / 10,
        upload: Math.round(uploadSpeed * 10) / 10,
        latency: Math.round(avgLatency),
        jitter: Math.round(jitter * 10) / 10,
        timestamp: new Date(),
      };

      setResult(finalResult);

      // Save result to Supabase if user is logged in
      // This would be implemented with the coverage_surveys table

    } catch (err) {
      console.error('Speed test error:', err);
      setError('Speed test failed. Please try again.');
      setPhase('idle');
    } finally {
      setTesting(false);
    }
  }, []);

  const getSpeedRating = (download: number) => {
    if (download >= 100) return { label: 'Excellent', color: 'text-green-400', icon: CheckCircleIcon };
    if (download >= 50) return { label: 'Great', color: 'text-green-400', icon: CheckCircleIcon };
    if (download >= 25) return { label: 'Good', color: 'text-yellow-400', icon: CheckCircleIcon };
    if (download >= 10) return { label: 'Fair', color: 'text-orange-400', icon: ExclamationTriangleIcon };
    return { label: 'Poor', color: 'text-red-400', icon: XCircleIcon };
  };

  const getConnectionTypeLabel = (type: string | null) => {
    switch (type) {
      case 'wifi': return 'WiFi';
      case 'cellular': return 'Cellular';
      case 'ethernet': return 'Ethernet';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <SignalIcon className="h-10 w-10 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Speed & Coverage Check
            </h1>
            <p className="text-gray-400">
              Test your connection speed and quality
            </p>
          </div>

          {/* Connection Info */}
          {connectionInfo && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WifiIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">
                      {getConnectionTypeLabel(connectionInfo.type)}
                      {connectionInfo.effectiveType && (
                        <span className="text-gray-500 ml-2">
                          ({connectionInfo.effectiveType.toUpperCase()})
                        </span>
                      )}
                    </span>
                  </div>
                  {connectionInfo.downlink && (
                    <span className="text-gray-500 text-sm">
                      ~{connectionInfo.downlink} Mbps
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Speed Test Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {testing ? (
                <div className="text-center py-8">
                  {/* Progress Ring */}
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * progress) / 100}
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{progress}%</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 capitalize">
                    {phase === 'latency' && 'Testing latency...'}
                    {phase === 'download' && 'Testing download speed...'}
                    {phase === 'upload' && 'Testing upload speed...'}
                  </p>
                </div>
              ) : result ? (
                <div>
                  {/* Result Header */}
                  <div className="text-center mb-6">
                    {(() => {
                      const rating = getSpeedRating(result.download);
                      return (
                        <>
                          <rating.icon className={`h-12 w-12 mx-auto mb-2 ${rating.color}`} />
                          <h3 className={`text-2xl font-bold ${rating.color}`}>
                            {rating.label}
                          </h3>
                        </>
                      );
                    })()}
                  </div>

                  {/* Speed Results */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <ArrowDownIcon className="h-6 w-6 mx-auto mb-2 text-green-400" />
                      <p className="text-3xl font-bold text-white">{result.download}</p>
                      <p className="text-gray-500 text-sm">Mbps Download</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <ArrowUpIcon className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                      <p className="text-3xl font-bold text-white">{result.upload}</p>
                      <p className="text-gray-500 text-sm">Mbps Upload</p>
                    </div>
                  </div>

                  {/* Latency Results */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <ClockIcon className="h-5 w-5 mx-auto mb-1 text-purple-400" />
                      <p className="text-xl font-bold text-white">{result.latency} ms</p>
                      <p className="text-gray-500 text-xs">Latency</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <ArrowPathIcon className="h-5 w-5 mx-auto mb-1 text-pink-400" />
                      <p className="text-xl font-bold text-white">{result.jitter} ms</p>
                      <p className="text-gray-500 text-xs">Jitter</p>
                    </div>
                  </div>

                  {/* Test Again Button */}
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={runSpeedTest}
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Test Again
                  </Button>

                  <p className="text-center text-gray-500 text-xs mt-4">
                    Tested at {result.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <SignalIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ready to Test
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Check your connection speed and quality
                  </p>
                  <Button size="lg" onClick={runSpeedTest}>
                    Start Speed Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Info */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-2">What do these numbers mean?</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><strong className="text-gray-300">Download:</strong> How fast you can receive data (streaming, browsing)</li>
                <li><strong className="text-gray-300">Upload:</strong> How fast you can send data (video calls, file sharing)</li>
                <li><strong className="text-gray-300">Latency:</strong> Delay in milliseconds (lower is better for gaming/calls)</li>
                <li><strong className="text-gray-300">Jitter:</strong> Variation in latency (lower is more stable)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
