import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/exercise';

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateLevelProgress(
    level: number,
    score: number
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('level_progress')
      .eq('user_id', user.id)
      .single();

    const currentProgress = (profile?.level_progress as any) || {};
    const today = new Date().toISOString().split('T')[0];
    const currentHighscore = currentProgress[level]?.highscore || 0;

    // Only update if new score is higher
    if (score > currentHighscore) {
      const updatedProgress = {
        ...currentProgress,
        [level]: { highscore: score, date: today }
      };

      const { error } = await supabase
        .from('profiles')
        .update({ level_progress: updatedProgress })
        .eq('user_id', user.id);

      if (error) throw error;
    }
  },

  async getDailyStats(): Promise<{
    levelsCompleted: number;
    totalScore: number;
    highestLevel: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { levelsCompleted: 0, totalScore: 0, highestLevel: 0 };

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_rankings')
      .select('level, score')
      .eq('user_id', user.id)
      .eq('date', today);

    if (!data || data.length === 0) {
      return { levelsCompleted: 0, totalScore: 0, highestLevel: 0 };
    }

    const totalScore = data.reduce((sum, r) => sum + r.score, 0);
    const highestLevel = Math.max(...data.map(r => r.level));

    return {
      levelsCompleted: data.length,
      totalScore,
      highestLevel
    };
  }
};
