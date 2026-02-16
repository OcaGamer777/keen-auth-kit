import { supabase } from '@/integrations/supabase/client';
import { Exercise } from '@/types/exercise';

export const exerciseService = {
  async getExercisesByLevel(level: number, topic?: string): Promise<Exercise[]> {
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('level', level);

    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query;

    if (error) throw error;
    // Cast word_translations from Json to WordTranslations
    return (data || []).map(row => ({
      ...row,
      word_translations: row.word_translations as Exercise['word_translations']
    })) as Exercise[];
  },

  async createExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
    // Normalize enum type to match DB values (e.g., listening -> LISTENING)
    const normalizeType = (t: string) => (t ? t.replace(/[-\s]/g, '_').toUpperCase() : t);
    const payload: any = { ...exercise, type: normalizeType((exercise as any).type) };

    const { data, error } = await supabase
      .from('exercises')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  },

  async updateExercise(id: string, exercise: Partial<Exercise>): Promise<Exercise> {
    const normalizeType = (t: string) => (t ? t.replace(/[-\s]/g, '_').toUpperCase() : t);
    const payload: any = exercise.type ? { ...exercise, type: normalizeType(exercise.type as any) } : exercise;

    const { data, error } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async generateExercises(level: number, topic: string, count: number, type?: string): Promise<Exercise[]> {
    const { data, error } = await supabase.functions.invoke('generate-exercises', {
      body: { level, topic, count, type }
    });

    if (error) {
      // Capture full error details including response body
      const errorDetails = {
        message: error.message,
        name: error.name,
        context: (error as any).context,
        data: data, // The response body is often in data even when there's an error
      };
      const detailedError = new Error(`Edge Function Error: ${JSON.stringify(errorDetails, null, 2)}`);
      (detailedError as any).details = errorDetails;
      throw detailedError;
    }

    // Check if response contains an error in the data
    if (data && typeof data === 'object' && 'error' in data) {
      const errorDetails = {
        error: (data as any).error,
        details: (data as any).details,
        validationErrors: (data as any).validationErrors,
        fullResponse: data
      };
      const detailedError = new Error(`API Error: ${JSON.stringify(errorDetails, null, 2)}`);
      (detailedError as any).details = errorDetails;
      throw detailedError;
    }

    return data as Exercise[];
  }
};
