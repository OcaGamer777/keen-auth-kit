import { CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Exercise } from '@/types/exercise';
import { motion } from 'framer-motion';

interface FeedbackModalProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  onContinue: () => void;
  exercise?: Exercise;
  selectedAnswer?: string;
  isFirstAttemptWrong?: boolean;
  isSecondAttempt?: boolean;
  elapsedSeconds?: number;
  earnedScore?: number;
}

/** Renders the correct answer word-by-word with stagger */
const WordByWord = ({ text }: { text: string }) => {
  const words = text.split(/\s+/);
  return (
    <span className="inline-flex flex-wrap gap-1">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.25 }}
          className="text-success font-semibold"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

export const FeedbackModal = ({ 
  isCorrect, 
  correctAnswer, 
  explanation, 
  onContinue, 
  exercise, 
  selectedAnswer,
  isFirstAttemptWrong,
  isSecondAttempt,
  elapsedSeconds,
  earnedScore
}: FeedbackModalProps) => {
  const { t } = useLanguage();
  
  const handleRequestExplanation = () => {
    if (!exercise) return;
    
    let statement = '';
    if (exercise.type === 'LISTENING') {
      statement = `Palabra en alemán: ${exercise.german_word}`;
    } else if (exercise.type === 'IDENTIFY_THE_WORD') {
      statement = `Enunciado: ${exercise.statement}`;
      if (exercise.emoji) statement += `\nEmoji: ${exercise.emoji}`;
      if (exercise.hint) statement += `\nPista: ${exercise.hint}`;
    } else {
      statement = `Enunciado: ${exercise.statement}`;
    }
    
    const incorrectOptions: string[] = [];
    if (exercise.incorrect_answer_1) incorrectOptions.push(exercise.incorrect_answer_1);
    if (exercise.incorrect_answer_2) incorrectOptions.push(exercise.incorrect_answer_2);
    if (exercise.incorrect_answer_3) incorrectOptions.push(exercise.incorrect_answer_3);
    
    const incorrectOptionsText = incorrectOptions.length > 0 
      ? `\n\nOpciones incorrectas mostradas: ${incorrectOptions.join(', ')}`
      : '';
    
    const message = `Explicame detalladamente el porqué de la respuesta correcta de este ejercicio:\n\n${statement}\n\nRespuesta correcta: ${correctAnswer}\n\nMi respuesta: ${selectedAnswer}${incorrectOptionsText}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/34644566471?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // First attempt wrong - show encouragement to try again
  if (isFirstAttemptWrong) {
    return (
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-info z-50"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
            >
              <AlertCircle className="w-8 h-8 text-info flex-shrink-0" />
            </motion.div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                ¡Casi! Inténtalo de nuevo
              </h3>
              
              {explanation && (
                <p className="text-muted-foreground">{explanation}</p>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                Tienes una segunda oportunidad (valdrá la mitad de puntos)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={onContinue}
              className="btn-duolingo btn-interactive min-w-[200px] text-lg"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed bottom-0 left-0 right-0 bg-card border-t-4 ${isCorrect ? 'border-success' : 'border-destructive'} z-50`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          {isCorrect ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
              className="animate-bounce-confirm"
            >
              <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, -3, 3, -2, 2, 0] }}
              transition={{ duration: 0.4 }}
            >
              <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
            </motion.div>
          )}
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">
              {isCorrect 
                ? (elapsedSeconds !== undefined && earnedScore !== undefined
                    ? `¡Correcto en ${elapsedSeconds}s! (+${earnedScore} puntos)`
                    : t('feedback.excellent'))
                : t('feedback.incorrect')
              }
            </h3>
            
            {!isCorrect && (
              <>
                <p className="text-muted-foreground mb-2">
                  {t('feedback.correctAnswer')}{' '}
                  <WordByWord text={correctAnswer} />
                </p>
                {explanation && (
                  <p className="text-sm text-muted-foreground">{explanation}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3">
          {exercise && selectedAnswer && (
            <Button 
              onClick={handleRequestExplanation}
              variant="outline"
              className="gap-2 w-full md:w-auto btn-interactive"
            >
              <MessageCircle className="w-4 h-4" />
              Pedir explicación
            </Button>
          )}
          <Button 
            onClick={onContinue}
            className="btn-duolingo btn-interactive w-full md:min-w-[200px] text-lg"
          >
            {t('feedback.continue')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
