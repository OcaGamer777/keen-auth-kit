import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle } from 'lucide-react';
import { ClickableWord } from './ClickableWord';

interface FillInTheBlankWritingProps {
  exercise: Exercise;
  onContinue: () => void;
}

export const FillInTheBlankWriting = ({ exercise, onContinue }: FillInTheBlankWritingProps) => {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState('');
  const [hasCorrected, setHasCorrected] = useState(false);

  // Reset state when exercise changes
  useEffect(() => {
    setAnswer('');
    setHasCorrected(false);
  }, [exercise.id]);

  const handleCorrect = () => {
    const message = `Corrige este ejercicio de rellenar huecos:\n\n${exercise.statement}\n\nRespuesta del alumno: ${answer}\n\nPosible respuesta correcta (se puede admitir otra que sea gramaticalmente y por significado correcta): ${exercise.correct_answer}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/34644566471?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setHasCorrected(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim()) {
      handleCorrect();
    }
  };

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
            {t('exercise.optionalNonScoring')}
          </div>
          <h2 className="text-2xl font-bold">{t('exercise.fillBlankWriting')}</h2>
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

        <div className="space-y-4">
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('exercise.typeAnswer')}
            className="text-lg h-14 text-center"
            autoFocus
          />
          
          <div className="flex gap-3">
            <Button
              onClick={handleCorrect}
              disabled={!answer.trim()}
              className="flex-1 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {t('exercise.correct')}
            </Button>
            <Button
              onClick={onContinue}
              variant="outline"
              className="flex-1"
            >
              {hasCorrected ? t('feedback.continue') : t('exercise.skipExercise')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
