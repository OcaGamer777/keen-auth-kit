import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { shuffle } from '@/lib/utils';
import { ClickableWord } from './ClickableWord';
import { Check, X } from 'lucide-react';

interface FillInTheBlankProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string, isSecondAttempt?: boolean, elapsedSeconds?: number) => void;
}

export const FillInTheBlank = ({ exercise, onAnswer }: FillInTheBlankProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);

  const options = useMemo(() => shuffle([
    exercise.correct_answer,
    exercise.incorrect_answer_1,
    exercise.incorrect_answer_2,
    exercise.incorrect_answer_3,
  ].filter(Boolean) as string[]), [exercise.id]);

  const startTimeRef = useRef<number>(Date.now());

  // Reset state when exercise changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setAttemptCount(0);
    setWrongAnswers([]);
    startTimeRef.current = Date.now();
  }, [exercise.id]);

  const handleSelect = (answer: string) => {
    if (hasAnswered || wrongAnswers.includes(answer)) return;
    
    const isCorrect = answer === exercise.correct_answer;
    const currentAttempt = attemptCount + 1;
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    setSelectedAnswer(answer);
    
    if (isCorrect) {
      setHasAnswered(true);
      onAnswer(true, answer, currentAttempt > 1, elapsedSeconds);
    } else {
      if (currentAttempt >= 2) {
        // Second wrong attempt - game over for this exercise
        setHasAnswered(true);
        onAnswer(false, answer, true, elapsedSeconds);
      } else {
        // First wrong attempt - allow retry
        setAttemptCount(currentAttempt);
        setWrongAnswers(prev => [...prev, answer]);
        onAnswer(false, answer, false, elapsedSeconds);
      }
    }
  };

  const getButtonClass = (option: string) => {
    if (wrongAnswers.includes(option)) {
      return 'border-destructive bg-destructive/20 border-2 opacity-60 cursor-not-allowed';
    }
    
    if (!hasAnswered) {
      return 'border-border hover:border-primary/50';
    }
    
    if (option === exercise.correct_answer) {
      return 'border-success bg-success text-success-foreground border-2';
    }
    
    if (option === selectedAnswer && option !== exercise.correct_answer) {
      return 'border-destructive bg-destructive text-destructive-foreground border-2';
    }
    
    return 'border-border opacity-50';
  };

  const showIcon = (option: string) => {
    if (wrongAnswers.includes(option)) return <X className="w-5 h-5 ml-auto flex-shrink-0" />;
    if (!hasAnswered) return null;
    if (option === exercise.correct_answer) return <Check className="w-5 h-5 ml-auto flex-shrink-0" />;
    if (option === selectedAnswer) return <X className="w-5 h-5 ml-auto flex-shrink-0" />;
    return null;
  };

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t('exercise.fillBlank')}</h2>
          <p className="text-xl text-muted-foreground whitespace-pre-line">
            {exercise.statement.split(/(\s+)/).map((part, index) => {
              if (/^\s+$/.test(part)) {
                return <span key={index}>{part}</span>;
              }
              return (
                <ClickableWord 
                  key={index} 
                  word={part} 
                  wordTranslations={exercise.word_translations} 
                />
              );
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered || wrongAnswers.includes(option)}
              className={`py-2.5 px-4 rounded-2xl border-2 text-lg font-medium transition-all btn-option shadow-sm flex items-center justify-center ${getButtonClass(option)}`}
            >
              <span className="flex-1">{option}</span>
              {showIcon(option)}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
