import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeedbackModalProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  onContinue: () => void;
}

export const FeedbackModal = ({ isCorrect, correctAnswer, explanation, onContinue }: FeedbackModalProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-primary animate-slide-up z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          {isCorrect ? (
            <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">
              {isCorrect ? t('feedback.excellent') : t('feedback.incorrect')}
            </h3>
            
            {!isCorrect && (
              <>
                <p className="text-muted-foreground mb-2">
                  {t('feedback.correctAnswer')} <span className="text-primary font-semibold">{correctAnswer}</span>
                </p>
                {explanation && (
                  <p className="text-sm text-muted-foreground">{explanation}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={onContinue}
            className="btn-duolingo min-w-[200px] text-lg"
          >
            {t('feedback.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};