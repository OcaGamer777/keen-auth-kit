import { useState, useEffect, useMemo } from 'react';
import { Exercise } from '@/types/exercise';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WheelOfFortuneProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, penalty: number) => void;
  onPenalty: (points: number) => void;
}

export const WheelOfFortune = ({ exercise, onAnswer, onPenalty }: WheelOfFortuneProps) => {
  const { t } = useLanguage();
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const answer = exercise.correct_answer.toUpperCase();
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');
  const punctuation = '?!.,'.split('');
  
  // Split answer into words
  const words = answer.split(' ');
  
  // Calculate the longest word length
  const longestWordLength = useMemo(() => {
    return Math.max(...words.map(word => word.length));
  }, [words]);
  
  // Calculate dynamic letter size based on longest word
  // Base size is w-12 (48px), reduce if word is too long
  const letterSizeClass = useMemo(() => {
    if (longestWordLength <= 8) return 'w-8 h-10 sm:w-10 sm:h-12 text-xl sm:text-2xl';
    if (longestWordLength <= 10) return 'w-7 h-9 sm:w-8 sm:h-10 text-lg sm:text-xl';
    if (longestWordLength <= 14) return 'w-5 h-8 sm:w-7 sm:h-9 text-base sm:text-lg';
    return 'w-4 h-7 sm:w-5 sm:h-8 text-sm sm:text-base';
  }, [longestWordLength]);

  const isComplete = !words.some(word => 
    word.split('').some(char => !punctuation.includes(char) && !guessedLetters.has(char))
  );

  // Reset state when exercise changes
  useEffect(() => {
    setGuessedLetters(new Set());
    setShowHint(false);
    setHasAnswered(false);
  }, [exercise.id]);

  useEffect(() => {
    if (isComplete && !hasAnswered) {
      setHasAnswered(true);
      onAnswer(true, 0);
    }
  }, [isComplete, hasAnswered, onAnswer]);

  const handleLetterClick = (letter: string) => {
    if (guessedLetters.has(letter) || hasAnswered) return;
    
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!answer.includes(letter)) {
      onPenalty(10);
    }
  };

  const handleReveal = () => {
    if (hasAnswered) return;
    onPenalty(50);
    // Mostrar todas las letras
    const allChars = new Set(answer.split('').filter(char => char !== ' '));
    setGuessedLetters(allChars);
    setHasAnswered(true);
    // Marcar como incorrecta porque no lo resolvió el alumno
    onAnswer(false, 0);
  };

  const getLetterClass = (letter: string) => {
    if (!guessedLetters.has(letter)) {
      return 'border-border hover:border-primary/50 bg-card';
    }
    if (answer.includes(letter)) {
      return 'border-success bg-success/10 border-2';
    }
    return 'border-destructive bg-destructive/10 border-2 opacity-50';
  };

  const renderWord = (word: string, wordIndex: number) => (
    <span key={wordIndex} className="inline-flex gap-1 sm:gap-2 whitespace-nowrap">
      {word.split('').map((char, charIndex) => (
        <span 
          key={`${wordIndex}-${charIndex}`} 
          className={`${letterSizeClass} flex items-end justify-center pb-0.5 sm:pb-1 bg-card border-2 border-border rounded-md font-bold`}
        >
          {punctuation.includes(char) ? char : (guessedLetters.has(char) ? char : '_')}
        </span>
      ))}
    </span>
  );

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-4xl space-y-4">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">{t('exercise.wheelFortune')}</h2>
          <p className="text-xl text-muted-foreground">{t('exercise.wheelFortuneInstructions')}</p>

          {/* Words container - words stay together, spaces between them */}
          <div className="flex justify-center flex-wrap gap-y-2 min-h-[60px] items-end">
            {words.map((word, index) => (
              <span key={index} className="inline-flex items-end">
                {renderWord(word, index)}
                {index < words.length - 1 && <span className="w-5 sm:w-6" />}
              </span>
            ))}
          </div>

          {isComplete && exercise.spanish_translation && (
            <div className="bg-success/10 border-2 border-success p-4 rounded-lg animate-in fade-in slide-in-from-top-4">
              <p className="text-lg font-semibold text-success">
                {t('exercise.translation')}: {exercise.spanish_translation}
              </p>
            </div>
          )}



          {!showHint && exercise.hint && (
            <Button
              onClick={() => {
                setShowHint(true);
                onPenalty(5);
              }}
              variant="outline"
              className="w-full h-8 text-xs gap-1"
            >
              <Lightbulb className="w-3 h-3" />
              {t('exercise.showHint')} (-5 pts)
            </Button>
          )}
          {showHint && exercise.hint && (
            <button
              onClick={() => setShowHint(false)}
              className="w-full bg-info/10 border border-info p-2 rounded-lg cursor-pointer hover:bg-info/20 transition-colors"
            >
              <p className="text-info text-sm font-medium">
                <Lightbulb className="w-4 h-4 inline mr-1" />
                {exercise.hint}
              </p>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-1">
            {letters.map(letter => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={guessedLetters.has(letter) || hasAnswered}
                className={`aspect-square rounded-md border text-base font-bold transition-all ${getLetterClass(letter)}`}
              >
                {letter}
              </button>
            ))}
          </div>
          <Button
            onClick={handleReveal}
            disabled={hasAnswered}
            variant="outline"
            className="w-full h-8 text-xs text-destructive border-destructive hover:bg-destructive/10"
          >
            {t('exercise.showSolution')} (-50 pts)
          </Button>
        </div>
      </div>
    </div>
  );
};