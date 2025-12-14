'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  UserCircleIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    window.location.href = '/';
  };

  const menuItems = [
    {
      label: 'Account',
      items: [
        { icon: DevicePhoneMobileIcon, label: 'My Devices', href: '/dashboard/devices', color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { icon: ShieldCheckIcon, label: 'Security', href: '/dashboard/security', color: 'text-green-400', bg: 'bg-green-500/20' },
        { icon: BellIcon, label: 'Notifications', href: '/dashboard/notifications', color: 'text-purple-400', bg: 'bg-purple-500/20' },
      ]
    },
    {
      label: 'Support',
      items: [
        { icon: QuestionMarkCircleIcon, label: 'Help & FAQ', href: '/help', color: 'text-amber-400', bg: 'bg-amber-500/20' },
        { icon: DocumentTextIcon, label: 'Terms & Privacy', href: '/legal', color: 'text-gray-400', bg: 'bg-gray-500/20' },
      ]
    },
  ];

  return (
    <AuthenticatedLayout>
      <AppShell
        header={
          <div className="px-5 py-4">
            <h1 className="text-lg font-semibold text-white">Profile</h1>
          </div>
        }
      >
        <div className="px-5 pt-4">
          {/* Profile Card */}
          <div className="bg-[#12121a] border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{user?.email}</p>
                <p className="text-sm text-gray-500">Free Plan</p>
              </div>
              <Link 
                href="/dashboard/edit-profile"
                className="p-2 bg-white/5 rounded-xl"
              >
                <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Menu Sections */}
          {menuItems.map((section, i) => (
            <div key={i} className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">
                {section.label}
              </p>
              <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden">
                {section.items.map((item, j) => (
                  <Link
                    key={j}
                    href={item.href}
                    className={`flex items-center justify-between p-4 active:bg-white/5 transition-colors ${
                      j < section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="font-medium text-white">{item.label}</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-medium active:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>

          {/* App Version */}
          <p className="text-center text-xs text-gray-600 mt-6 mb-4">
            Pulse WiFi v1.0.0
          </p>
        </div>
      </AppShell>
    </AuthenticatedLayout>
  );
}
