import { useState, useMemo, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { shuffle } from '@/lib/utils';

interface FillInTheBlankProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void;
}

export const FillInTheBlank = ({ exercise, onAnswer }: FillInTheBlankProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const options = useMemo(() => shuffle([
    exercise.correct_answer,
    exercise.incorrect_answer_1,
    exercise.incorrect_answer_2,
    exercise.incorrect_answer_3,
  ].filter(Boolean) as string[]), [exercise.id]);

  // Reset state when exercise changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
  }, [exercise.id]);

  const handleSelect = (answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answer);
    setHasAnswered(true);
    const isCorrect = answer === exercise.correct_answer;
    onAnswer(isCorrect, answer);
  };

  const getButtonClass = (option: string) => {
    if (!hasAnswered) {
      return option === selectedAnswer 
        ? 'border-primary bg-primary/10 border-2' 
        : 'border-border hover:border-primary/50';
    }
    
    if (option === exercise.correct_answer) {
      return 'border-primary bg-primary/10 border-2';
    }
    
    if (option === selectedAnswer && option !== exercise.correct_answer) {
      return 'border-destructive bg-destructive/10 border-2';
    }
    
    return 'border-border opacity-50';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 pt-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{t('exercise.fillBlank')}</h2>
          <p className="text-xl text-muted-foreground whitespace-pre-line">
            {exercise.statement}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered}
              className={`p-6 rounded-2xl border-2 text-lg font-medium transition-all ${getButtonClass(option)}`}
            >
              {option}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};