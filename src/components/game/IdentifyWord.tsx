import { useState, useMemo, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lightbulb } from 'lucide-react';
import { shuffle } from '@/lib/utils';

interface IdentifyWordProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void;
}

export const IdentifyWord = ({ exercise, onAnswer }: IdentifyWordProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

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
    setShowHint(false);
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
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">{exercise.statement}</h2>
          
          <div className="text-9xl">{exercise.emoji}</div>

          {exercise.hint && (
            <div className="flex justify-center">
              {showHint ? (
                <div className="bg-accent/20 text-accent px-6 py-3 rounded-xl border-2 border-accent">
                  <p className="text-lg font-medium">{exercise.hint}</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-accent transition-colors"
                >
                  <Lightbulb className="w-4 h-4 mr-2 inline" />
                  {t('exercise.showHint')}
                </button>
              )}
            </div>
          )}
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