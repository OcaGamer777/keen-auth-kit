import { useState } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle } from 'lucide-react';

interface FreeWritingProps {
  exercise: Exercise;
  onContinue: () => void;
}

export const FreeWriting = ({ exercise, onContinue }: FreeWritingProps) => {
  const { t } = useLanguage();
  const [answer, setAnswer] = useState('');
  const [hasCorrected, setHasCorrected] = useState(false);

  const handleCorrect = () => {
    // Usar la descripción completa del ejercicio (statement) en lugar del título
    const message = `Corrige este ejercicio\n\n${exercise.statement}\n\nRespuesta del alumno:\n${answer}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/34644566471?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setHasCorrected(true);
  };

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
            {t('exercise.optionalNonScoring')}
          </div>
          <h2 className="text-2xl font-bold">{t('exercise.freeWriting')}</h2>
          <p className="text-xl text-muted-foreground whitespace-pre-line">
            {exercise.statement}
          </p>
        </div>

        <div className="space-y-4">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('exercise.typeAnswer')}
            className="min-h-[200px] text-lg"
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
