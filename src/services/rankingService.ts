import { supabase } from '@/integrations/supabase/client';
import { DailyRanking } from '@/types/exercise';

const get24HoursAgo = () => {
  const date = new Date();
  date.setHours(date.getHours() - 24);
  return date.toISOString();
};

export const rankingService = {
  async getDailyRankings(level: number): Promise<DailyRanking[]> {
    const since = get24HoursAgo();

    // Get rankings from last 24 hours - username is stored in daily_rankings
    const { data, error } = await supabase
      .from('daily_rankings')
      .select('*')
      .eq('level', level)
      .gte('created_at', since)
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }

    // Cast to include username field (added via migration)
    return (data || []).map(ranking => ({
      id: ranking.id,
      user_id: ranking.user_id,
      level: ranking.level,
      score: ranking.score,
      created_at: ranking.created_at,
      username: (ranking as any).username || 'Usuario',
      avatar_icon: (ranking as any).avatar_icon || '😀'
    }));
  },

  async submitScore(level: number, score: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get username and avatar_icon from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_icon')
      .eq('user_id', user.id)
      .maybeSingle();

    // Insert with username and avatar_icon denormalized
    const { error } = await supabase
      .from('daily_rankings')
      .insert({
        user_id: user.id,
        level,
        score,
        username: profile?.username || 'Usuario',
        avatar_icon: (profile as any)?.avatar_icon || '😀'
      } as any);

    if (error) throw error;

    // Update profile progress
    await profileService.updateLevelProgress(level, score);
  },

  async getUserHighscoreLast24h(level: number): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const since = get24HoursAgo();

    const { data } = await supabase
      .from('daily_rankings')
      .select('score')
      .eq('user_id', user.id)
      .eq('level', level)
      .gte('created_at', since)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.score || 0;
  },

  async getUserRankPosition(level: number): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const since = get24HoursAgo();

    // Get user's best score in last 24h
    const { data: userRanking } = await supabase
      .from('daily_rankings')
      .select('score')
      .eq('user_id', user.id)
      .eq('level', level)
      .gte('created_at', since)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!userRanking) return null;

    const { count } = await supabase
      .from('daily_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('level', level)
      .gte('created_at', since)
      .gt('score', userRanking.score);

    return (count || 0) + 1;
  }
};

import { profileService } from './profileService';
