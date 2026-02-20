import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise } from '@/types/exercise';
import { Button } from '@/components/ui/button';
import { Volume2, Eye, AlertTriangle, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { shuffle } from '@/lib/utils';

interface ListeningExerciseProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string, isSecondAttempt?: boolean, elapsedSeconds?: number) => void;
}

export const ListeningExercise = ({ exercise, onAnswer }: ListeningExerciseProps) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([]);
  const [audioError, setAudioError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const attemptRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

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
    setAttemptCount(0);
    setWrongAnswers([]);
    setAudioError(false);
    attemptRef.current = 0;
    startTimeRef.current = Date.now();
  }, [exercise.id]);

  const speakWithDetection = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve(false);
        return;
      }

      const synth = speechSynthesis;
      synth.cancel();

      // Load TTS settings from localStorage
      const ttsSettings = localStorage.getItem('ttsSettings');
      const settings = ttsSettings ? JSON.parse(ttsSettings) : { voice: 'default', rate: 0.8, pitch: 1 };

      const utterance = new SpeechSynthesisUtterance(text);
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

      let completed = false;

      utterance.onend = () => {
        completed = true;
        resolve(true);
      };

      utterance.onerror = () => {
        completed = true;
        synth.cancel();
        resolve(false);
      };

      synth.speak(utterance);

      // Simple timeout: if after 3 seconds nothing happened, it failed
      setTimeout(() => {
        if (!completed) {
          synth.cancel();
          resolve(false);
        }
      }, 3000);
    });
  };

  const trySpeak = async () => {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      await new Promise<void>((resolve) => {
        speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
        // Timeout in case voiceschanged never fires
        setTimeout(resolve, 500);
      });
    }

    const success = await speakWithDetection(exercise.german_word || '');
    return success;
  };

  const speak = async () => {
    if (!exercise.german_word || isPlaying) {
      return;
    }
    
    setIsPlaying(true);
    setAudioError(false);
    attemptRef.current = 0;

    // Try up to 10 times with 500ms intervals
    const maxAttempts = 10;
    
    const attemptSpeak = async (): Promise<boolean> => {
      attemptRef.current++;
      
      try {
        const success = await trySpeak();
        
        if (success) {
          return true;
        }
        
        if (attemptRef.current < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return attemptSpeak();
        }
        
        return false;
      } catch {
        return false;
      }
    };

    const success = await attemptSpeak();
    
    if (!success) {
      setAudioError(true);
      setShowWord(true);
    }
    
    setIsPlaying(false);
  };

  const handleSelect = (answer: string) => {
    if (hasAnswered) return;
    
    const isCorrect = answer === exercise.spanish_translation;
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
      return 'border-destructive/60 bg-gradient-to-r from-destructive/30 to-destructive/10 border-2 opacity-60 cursor-not-allowed';
    }
    
    if (!hasAnswered) {
      return 'border-border hover:border-primary/50';
    }
    
    if (option === exercise.spanish_translation) {
      return 'border-success bg-gradient-to-r from-success to-success/80 text-success-foreground border-2 shadow-[0_0_15px_hsl(var(--success)/0.4)] ring-2 ring-success/30';
    }
    
    if (option === selectedAnswer && option !== exercise.spanish_translation) {
      return 'border-destructive bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground border-2 shadow-[0_0_15px_hsl(var(--destructive)/0.4)]';
    }
    
    return 'border-border opacity-50';
  };

  const showIcon = (option: string) => {
    if (wrongAnswers.includes(option)) return <X className="w-5 h-5 ml-auto flex-shrink-0" />;
    if (!hasAnswered) return null;
    if (option === exercise.spanish_translation) return <Check className="w-5 h-5 ml-auto flex-shrink-0" />;
    if (option === selectedAnswer) return <X className="w-5 h-5 ml-auto flex-shrink-0" />;
    return null;
  };

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">{t('exercise.listening')}</h2>
          
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={speak}
              disabled={isPlaying}
              className={`p-6 rounded-full transition-all active:scale-95 ${
                isPlaying 
                  ? 'bg-primary/50 cursor-wait animate-audio-pulse' 
                  : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              <Volume2 className="w-10 h-10 text-primary-foreground" />
            </button>

            {audioError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive max-w-md">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{t('exercise.audioError')}</p>
              </div>
            )}

            {showWord ? (
              <button
                onClick={() => setShowWord(false)}
                className="text-2xl font-bold text-primary cursor-pointer hover:opacity-70 transition-opacity"
              >
                {exercise.german_word}
              </button>
            ) : (
              <Button
                onClick={() => setShowWord(true)}
                variant="ghost"
                className="text-accent hover:text-accent-foreground hover:bg-accent/20"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('exercise.showWord')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered || wrongAnswers.includes(option)}
              className={`py-2.5 px-4 rounded-2xl border-2 text-lg font-medium transition-all btn-option shadow-md hover:shadow-lg flex items-center justify-center ${getButtonClass(option)}`}
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
