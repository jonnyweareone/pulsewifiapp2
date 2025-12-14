'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import {
  MapPinIcon,
  WifiIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Hotspot {
  id: string;
  name: string;
  type: string;
  distance: string;
  status: 'online' | 'offline';
}

// Mock data for now
const MOCK_HOTSPOTS: Hotspot[] = [
  { id: '1', name: 'Portsmouth Central Library', type: 'Library', distance: '0.3 mi', status: 'online' },
  { id: '2', name: 'Gunwharf Quays', type: 'Shopping', distance: '0.5 mi', status: 'online' },
  { id: '3', name: 'The Coffee House', type: 'Cafe', distance: '0.7 mi', status: 'online' },
  { id: '4', name: 'Portsmouth Guildhall', type: 'Venue', distance: '1.2 mi', status: 'online' },
  { id: '5', name: 'Southsea Beach Cafe', type: 'Cafe', distance: '1.5 mi', status: 'offline' },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hotspots] = useState<Hotspot[]>(MOCK_HOTSPOTS);

  const filteredHotspots = hotspots.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <AppShell
        header={
          <div className="px-5 py-4">
            <h1 className="text-lg font-semibold text-white">Explore</h1>
          </div>
        }
      >
        <div className="px-5 pt-4">
          {/* Search Bar */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search hotspots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-[#12121a] border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Map Preview */}
          <div className="relative h-48 bg-[#12121a] border border-white/5 rounded-2xl mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPinIcon className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Map view coming soon</p>
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute top-8 left-12 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute top-16 right-20 w-3 h-3 bg-green-500 rounded-full animate-pulse delay-75" />
            <div className="absolute bottom-12 left-1/3 w-3 h-3 bg-green-500 rounded-full animate-pulse delay-150" />
          </div>

          {/* Hotspots List */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-1 mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nearby Hotspots
              </p>
              <span className="text-xs text-purple-400">{filteredHotspots.length} found</span>
            </div>

            <div className="space-y-3">
              {filteredHotspots.map((hotspot) => (
                <div
                  key={hotspot.id}
                  className="bg-[#12121a] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${hotspot.status === 'online' ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      <WifiIcon className={`w-5 h-5 ${hotspot.status === 'online' ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">{hotspot.name}</p>
                        <div className={`w-2 h-2 rounded-full ${hotspot.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{hotspot.type}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{hotspot.distance}</span>
                      </div>
                    </div>
                    <MapPinIcon className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredHotspots.length === 0 && (
            <div className="text-center py-12">
              <MapPinIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hotspots found</p>
              <p className="text-gray-600 text-sm mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </AppShell>
    </AuthenticatedLayout>
  );
}
