import { supabase } from '@/integrations/supabase/client';
import { DailyRanking } from '@/types/exercise';

export const rankingService = {
  async getDailyRankings(level: number): Promise<DailyRanking[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_rankings')
      .select(`
        *,
        profiles!inner(username)
      `)
      .eq('level', level)
      .eq('date', today)
      .order('score', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      username: (item.profiles as any).username
    }));
  },

  async submitScore(level: number, score: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];

    // Try to update existing record or insert new one
    const { error } = await supabase
      .from('daily_rankings')
      .upsert(
        {
          user_id: user.id,
          level,
          score,
          date: today
        },
        {
          onConflict: 'user_id,level,date'
        }
      );

    if (error) throw error;

    // Update profile progress
    await profileService.updateLevelProgress(level, score);
  },

  async getUserRankPosition(level: number): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data: userRanking } = await supabase
      .from('daily_rankings')
      .select('score')
      .eq('user_id', user.id)
      .eq('level', level)
      .eq('date', today)
      .maybeSingle();

    if (!userRanking) return null;

    const { count } = await supabase
      .from('daily_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('level', level)
      .eq('date', today)
      .gt('score', userRanking.score);

    return (count || 0) + 1;
  }
};

import { profileService } from './profileService';
