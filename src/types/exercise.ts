export type ExerciseType = 'FILL_IN_THE_BLANK' | 'FILL_IN_THE_BLANK_WRITING' | 'LISTENING' | 'IDENTIFY_THE_WORD' | 'WHEEL_OF_FORTUNE' | 'FREE_WRITING' | 'WORD_SEARCH';
export type UserRole = 'FREE' | 'PRO' | 'ADMIN';

export interface WordTranslations {
  [germanWord: string]: string;
}

export interface Exercise {
  id: string;
  level: number;
  type: ExerciseType;
  topic: string;
  statement: string;
  correct_answer: string;
  incorrect_answer_1?: string | null;
  incorrect_answer_2?: string | null;
  incorrect_answer_3?: string | null;
  incorrect_answer_1_explanation?: string | null;
  incorrect_answer_2_explanation?: string | null;
  incorrect_answer_3_explanation?: string | null;
  german_word?: string | null;
  spanish_translation?: string | null;
  emoji?: string | null;
  hint?: string | null;
  word_translations?: WordTranslations | null;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  level_progress: any; // Stored as jsonb in database
  created_at: string;
  updated_at: string;
  email?: string; // Added dynamically when loading profiles in admin
  role?: string; // Added dynamically when loading profiles in admin
}

export interface LevelProgress {
  [level: string]: {
    highscore: number;
    date: string;
  };
}

export interface DailyRanking {
  id: string;
  user_id: string;
  level: number;
  score: number;
  created_at: string;
  username?: string;
}
