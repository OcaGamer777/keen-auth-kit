import { supabase } from '@/integrations/supabase/client';
import { Topic } from '@/types/topic';

export const topicService = {
  async getAllTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics' as any)
      .select('*')
      .order('order_position', { ascending: true });

    if (error) throw error;
    return (data as any[]) || [];
  },

  async getLatestTopic(): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    const topics = (data as any[]) || [];
    return topics.length > 0 ? (topics[0] as Topic) : null;
  },

  async getVisibleTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics' as any)
      .select('*')
      .eq('is_visible', true)
      .order('order_position', { ascending: true });

    if (error) throw error;
    return (data as any[]) || [];
  },

  async getTopicByTitle(title: string): Promise<Topic | null> {
    console.log('Fetching topic with title:', title);
    const decodedTitle = decodeURIComponent(title).trim().toLowerCase();
    
    // Fetch all topics and filter client-side to avoid RLS issues
    const { data, error } = await supabase
      .from('topics' as any)
      .select('*');

    console.log('All topics result:', { data, error });
    if (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
    
    const topics = (data as any[]) || [];
    const topic = topics.find(t => t.title.toLowerCase() === decodedTitle);
    console.log('Found topic:', topic);
    return topic as Topic | null;
  },

  async createTopic(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics' as any)
      .insert({
        title: topic.title,
        description: topic.description,
        youtube_url: topic.youtube_url,
        explanation_url: topic.explanation_url
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Topic;
  },

  async updateTopic(id: string, topic: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at'>>): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics' as any)
      .update({
        ...topic,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Topic;
  },

  async deleteTopic(id: string): Promise<void> {
    const { error } = await supabase
      .from('topics' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
