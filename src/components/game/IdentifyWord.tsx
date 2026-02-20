import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lightbulb, Check, X } from 'lucide-react';
import { shuffle } from '@/lib/utils';

interface IdentifyWordProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string, isSecondAttempt?: boolean, elapsedSeconds?: number) => void;
  onHintUsed?: () => void;
}

export const IdentifyWord = ({ exercise, onAnswer, onHintUsed }: IdentifyWordProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
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
    setShowHint(false);
    setAttemptCount(0);
    setWrongAnswers([]);
    startTimeRef.current = Date.now();
  }, [exercise.id]);

  const handleSelect = (answer: string) => {
    if (hasAnswered) return;
    
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
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">{exercise.statement}</h2>
          
          <div className="text-7xl">{exercise.emoji}</div>

          {exercise.hint && (
            <div className="flex justify-center">
              {showHint ? (
                <button
                  onClick={() => setShowHint(false)}
                  className="bg-info/20 text-info px-6 py-2 rounded-xl border-2 border-info cursor-pointer hover:bg-info/30 transition-colors"
                >
                  <p className="text-base font-medium">{exercise.hint}</p>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowHint(true);
                    onHintUsed?.();
                  }}
                  className="px-4 py-2 rounded-md hover:bg-info/10 text-info transition-colors"
                >
                  <Lightbulb className="w-4 h-4 mr-2 inline" />
                  {t('exercise.showHint')}
                </button>
              )}
            </div>
          )}
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
