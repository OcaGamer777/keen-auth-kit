import { useState, useMemo, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { Button } from '@/components/ui/button';
import { Volume2, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { shuffle } from '@/lib/utils';

interface ListeningExerciseProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void;
}

export const ListeningExercise = ({ exercise, onAnswer }: ListeningExerciseProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showWord, setShowWord] = useState(false);

  const options = useMemo(() => shuffle([
    exercise.spanish_translation,
    exercise.incorrect_answer_1,
    exercise.incorrect_answer_2,
    exercise.incorrect_answer_3,
  ].filter(Boolean) as string[]), [exercise.id]);

  // Reset state when exercise changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setShowWord(false);
  }, [exercise.id]);

  const speak = () => {
    if (!exercise.german_word) return;
    
    // Cancelar cualquier reproducción anterior
    speechSynthesis.cancel();
    
    // Función para reproducir el audio
    const speakNow = () => {
      // Load TTS settings from localStorage
      const ttsSettings = localStorage.getItem('ttsSettings');
      const settings = ttsSettings ? JSON.parse(ttsSettings) : { voice: 'default', rate: 0.8, pitch: 1 };
      
      const utterance = new SpeechSynthesisUtterance(exercise.german_word);
      utterance.lang = 'de-DE';
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      
      // Set voice if configured and not default
      if (settings.voice && settings.voice !== 'default') {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === settings.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      speechSynthesis.speak(utterance);
    };
    
    // Asegurarse de que las voces estén cargadas
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakNow();
    } else {
      // Esperar a que se carguen las voces
      speechSynthesis.addEventListener('voiceschanged', speakNow, { once: true });
    }
  };

  const handleSelect = (answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answer);
    setHasAnswered(true);
    const isCorrect = answer === exercise.spanish_translation;
    onAnswer(isCorrect, answer);
  };

  const getButtonClass = (option: string) => {
    if (!hasAnswered) {
      return option === selectedAnswer 
        ? 'border-primary bg-primary/10 border-2' 
        : 'border-border hover:border-primary/50';
    }
    
    if (option === exercise.spanish_translation) {
      return 'border-primary bg-primary/10 border-2';
    }
    
    if (option === selectedAnswer && option !== exercise.spanish_translation) {
      return 'border-destructive bg-destructive/10 border-2';
    }
    
    return 'border-border opacity-50';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 pt-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">{t('exercise.listening')}</h2>
          
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={speak}
              className="p-6 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <Volume2 className="w-10 h-10 text-primary-foreground" />
            </button>

            {showWord ? (
              <p className="text-2xl font-bold text-primary">{exercise.german_word}</p>
            ) : (
              <Button
                onClick={() => setShowWord(true)}
                variant="ghost"
                className="text-accent hover:text-accent/80"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('exercise.showWord')}
              </Button>
            )}
          </div>
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