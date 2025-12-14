'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
  XMarkIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

interface QRProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  username: string;
  password: string;
  provisioningToken: string;
}

export function QRProvisioningModal({
  isOpen,
  onClose,
  childName,
  username,
  password,
  provisioningToken,
}: QRProvisioningModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');

  useEffect(() => {
    const generateQR = async () => {
      // The QR code contains a URL to the provisioning page with the token
      const provisioningUrl = `${window.location.origin}/provision/${provisioningToken}`;

      try {
        const dataUrl = await QRCode.toDataURL(provisioningUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    if (isOpen && provisioningToken) {
      generateQR();
    }
  }, [isOpen, provisioningToken]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <Card className="relative w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5 text-indigo-400" />
              Set Up {childName}&apos;s Device
            </CardTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Manual Setup
            </button>
          </div>

          {activeTab === 'qr' ? (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Provisioning QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-4 text-center">
                  Scan this QR code with {childName}&apos;s device camera
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Instructions:</h4>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      1
                    </span>
                    <span>Open the camera app on {childName}&apos;s device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      2
                    </span>
                    <span>Point it at the QR code above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      3
                    </span>
                    <span>Tap the notification to install the WiFi profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      4
                    </span>
                    <span>Follow the prompts to complete setup</span>
                  </li>
                </ol>
              </div>
            </>
          ) : (
            <>
              {/* Manual Credentials */}
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Username</p>
                  <p className="font-mono text-white">{username}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Password</p>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-white break-all">{password}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Network</p>
                  <p className="font-mono text-white">Pulse WiFi</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Security</p>
                  <p className="font-mono text-white">WPA2-Enterprise</p>
                </div>
              </div>

              {/* Manual Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Manual Setup:</h4>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      1
                    </span>
                    <span>Go to WiFi settings on {childName}&apos;s device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      2
                    </span>
                    <span>Select &quot;Pulse WiFi&quot; network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">
                      3
                    </span>
                    <span>Enter the username and password above</span>
                  </li>
                </ol>
              </div>
            </>
          )}

          {/* Safety Badge */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
            <Badge variant="success" size="sm">
              <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
              Safe browsing enabled
            </Badge>
          </div>

          {/* Close Button */}
          <Button variant="secondary" onClick={onClose} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
