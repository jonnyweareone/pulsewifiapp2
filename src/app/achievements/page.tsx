'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AchievementGrid, AchievementProgress } from '@/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { createClient } from '@/lib/supabase/client';
import { TrophyIcon } from '@heroicons/react/24/outline';

export default function AchievementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [showLocked, setShowLocked] = useState(true);
  
  const { 
    achievements, 
    totalPoints, 
    earnedCount, 
    totalCount, 
    loading 
  } = useAchievements(userId);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      } else {
        setUserId(user.id);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading achievements...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <TrophyIcon className="h-10 w-10 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Achievements
            </h1>
            <p className="text-gray-400">
              Complete challenges to earn points and rewards
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <AchievementProgress 
              earnedCount={earnedCount}
              totalCount={totalCount}
              totalPoints={totalPoints}
            />
          </div>

          {/* Filter toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowLocked(!showLocked)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showLocked ? 'Hide locked' : 'Show all'}
            </button>
          </div>

          {/* Achievement Grid */}
          <AchievementGrid 
            achievements={achievements} 
            showLocked={showLocked}
          />

          {/* Empty state */}
          {achievements.length === 0 && (
            <div className="text-center py-12">
              <TrophyIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No achievements yet. Start using Pulse WiFi to unlock rewards!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
