'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  WifiIcon, 
  MapPinIcon,
  TrophyIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  WifiIcon as WifiIconSolid,
  MapPinIcon as MapPinIconSolid,
  TrophyIcon as TrophyIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon, activeIcon: HomeIconSolid },
  { href: '/dashboard/wifi', label: 'WiFi', icon: WifiIcon, activeIcon: WifiIconSolid },
  { href: '/dashboard/explore', label: 'Explore', icon: MapPinIcon, activeIcon: MapPinIconSolid },
  { href: '/achievements', label: 'Rewards', icon: TrophyIcon, activeIcon: TrophyIconSolid },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircleIcon, activeIcon: UserCircleIconSolid },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)] px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          const Icon = isActive ? tab.activeIcon : tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
                isActive ? 'text-purple-400' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-[env(safe-area-inset-bottom,0px)] w-12 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
