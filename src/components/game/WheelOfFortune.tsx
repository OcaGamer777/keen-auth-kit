import { useState, useEffect } from 'react';
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
  
  const displayWord = answer.split('').map(char => {
    if (char === ' ') return ' ';
    // Los símbolos de puntuación se muestran siempre
    if (punctuation.includes(char)) return char;
    return guessedLetters.has(char) ? char : '_';
  }).join('');

  const isComplete = !displayWord.includes('_');

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

  const handlePunctuationClick = (symbol: string) => {
    // Los símbolos de puntuación se muestran automáticamente, no necesitan ser clickeados
    return;
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
      return 'border-primary bg-primary/10 border-2';
    }
    return 'border-destructive bg-destructive/10 border-2 opacity-50';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 pt-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">{t('exercise.wheelFortune')}</h2>
          <p className="text-xl text-muted-foreground">{t('exercise.wheelFortuneInstructions')}</p>

          <div className="flex justify-center gap-2 flex-wrap text-4xl font-bold tracking-wider min-h-[60px] items-end">
            {displayWord.split('').map((char, i) => (
              <span key={i} className={char === ' ' ? 'w-4' : 'w-12 h-16 flex items-end justify-center pb-2 bg-card border-2 border-border rounded-lg'}>
                {char !== ' ' && char}
              </span>
            ))}
          </div>

          {showHint && exercise.hint && (
            <div className="bg-accent/10 border border-accent p-4 rounded-lg">
              <p className="text-accent font-medium">
                <Lightbulb className="w-5 h-5 inline mr-2" />
                {exercise.hint}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            {!showHint && exercise.hint && (
              <Button
                onClick={() => {
                  setShowHint(true);
                  onPenalty(5);
                }}
                variant="outline"
                className="gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                {t('exercise.showHint')} (-5 puntos)
              </Button>
            )}
            <Button
              onClick={handleReveal}
              disabled={hasAnswered}
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              {t('exercise.showSolution')} (-50 puntos)
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
            {letters.map(letter => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={guessedLetters.has(letter) || hasAnswered}
                className={`aspect-square rounded-lg border-2 text-lg font-bold transition-all ${getLetterClass(letter)}`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};