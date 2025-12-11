import { useState, useEffect, useCallback } from 'react';

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

interface AchievementsState {
  achievements: Achievement[];
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export function useAchievements(userId: string | null) {
  const [state, setState] = useState<AchievementsState>({
    achievements: [],
    totalPoints: 0,
    earnedCount: 0,
    totalCount: 0,
    loading: true,
    error: null,
  });

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`/api/achievements?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setState({
          achievements: data.achievements || [],
          totalPoints: data.total_points || 0,
          earnedCount: data.earned_count || 0,
          totalCount: data.total_count || 0,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load achievements',
      }));
    }
  }, [userId]);

  // Trigger achievement check after an event
  const checkAchievements = useCallback(async (event?: string) => {
    if (!userId) return [];
    
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, event }),
      });
      
      const data = await response.json();
      
      if (data.newly_awarded?.length > 0) {
        // Refresh achievements list
        fetchAchievements();
      }
      
      return data.newly_awarded || [];
    } catch {
      return [];
    }
  }, [userId, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    ...state,
    refresh: fetchAchievements,
    checkAchievements,
  };
}
