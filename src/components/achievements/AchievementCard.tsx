'use client';

import { Card, CardContent } from '@/components/ui';

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned: boolean;
  earned_at: string | null;
}

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <Card className={`relative overflow-hidden ${!achievement.earned ? 'opacity-50' : ''}`}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-center gap-3">
          <div className={`${iconSizes[size]} ${achievement.earned ? '' : 'grayscale'}`}>
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{achievement.name}</h4>
            <p className="text-gray-400 text-sm truncate">{achievement.description}</p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold ${achievement.earned ? 'text-yellow-400' : 'text-gray-500'}`}>
              {achievement.points} pts
            </span>
          </div>
        </div>
        
        {achievement.earned && (
          <div className="absolute top-2 right-2">
            <span className="text-green-400 text-xs">✓</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  showLocked?: boolean;
}

export function AchievementGrid({ achievements, showLocked = true }: AchievementGridProps) {
  const filtered = showLocked ? achievements : achievements.filter(a => a.earned);
  
  // Group by category
  const categories = ['connection', 'usage', 'social', 'premium'];
  const grouped = categories.map(cat => ({
    category: cat,
    achievements: filtered.filter(a => a.category === cat),
  })).filter(g => g.achievements.length > 0);

  const categoryLabels: Record<string, string> = {
    connection: '📡 Connection',
    usage: '📊 Usage',
    social: '👥 Social',
    premium: '💎 Premium',
  };

  return (
    <div className="space-y-6">
      {grouped.map(group => (
        <div key={group.category}>
          <h3 className="text-gray-400 text-sm font-medium mb-3">
            {categoryLabels[group.category] || group.category}
          </h3>
          <div className="grid gap-3">
            {group.achievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface AchievementProgressProps {
  earnedCount: number;
  totalCount: number;
  totalPoints: number;
}

export function AchievementProgress({ earnedCount, totalCount, totalPoints }: AchievementProgressProps) {
  const percentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Achievements</h3>
            <p className="text-gray-400 text-sm">{earnedCount} of {totalCount} unlocked</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-yellow-400">{totalPoints}</span>
            <p className="text-gray-400 text-xs">points</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <Card className="border-yellow-500/50 bg-gray-900/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-bounce">{achievement.icon}</div>
            <div className="flex-1">
              <p className="text-yellow-400 text-xs font-medium uppercase tracking-wide">
                Achievement Unlocked!
              </p>
              <h4 className="text-white font-bold">{achievement.name}</h4>
              <p className="text-gray-400 text-sm">{achievement.description}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
