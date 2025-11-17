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
    return data || [];
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

    if (error) throw error;

    // Check if response contains validation errors
    if (data && typeof data === 'object' && 'error' in data && 'validationErrors' in data) {
      const validationError = new Error((data as any).error as string);
      (validationError as any).validationErrors = (data as any).validationErrors;
      throw validationError;
    }

    return data as Exercise[];
  }
};
