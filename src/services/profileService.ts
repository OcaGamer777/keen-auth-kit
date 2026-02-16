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

    const since = new Date();
    since.setHours(since.getHours() - 24);

    const { data } = await supabase
      .from('daily_rankings')
      .select('level, score')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());

    if (!data || data.length === 0) {
      return { levelsCompleted: 0, totalScore: 0, highestLevel: 0 };
    }

    // Get unique levels and their best scores
    const levelScores = new Map<number, number>();
    data.forEach(r => {
      const current = levelScores.get(r.level) || 0;
      if (r.score > current) levelScores.set(r.level, r.score);
    });

    const totalScore = Array.from(levelScores.values()).reduce((sum, s) => sum + s, 0);
    const highestLevel = Math.max(...levelScores.keys());

    return {
      levelsCompleted: levelScores.size,
      totalScore,
      highestLevel
    };
  }
};
