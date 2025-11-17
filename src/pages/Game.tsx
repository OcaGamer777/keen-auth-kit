import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { exerciseService } from '@/services/exerciseService';
import { rankingService } from '@/services/rankingService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { Exercise } from '@/types/exercise';
import { GameHeader } from '@/components/game/GameHeader';
import { FeedbackModal } from '@/components/game/FeedbackModal';
import { CongratulationsScreen } from '@/components/game/CongratulationsScreen';
import { FillInTheBlank } from '@/components/game/FillInTheBlank';
import { ListeningExercise } from '@/components/game/ListeningExercise';
import { IdentifyWord } from '@/components/game/IdentifyWord';
import { WheelOfFortune } from '@/components/game/WheelOfFortune';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { shuffle } from '@/lib/utils';

const Game = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getTopicParam } = useTopic();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, [level, searchParams]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const topicFilter = searchParams.get('topic');
      const levelParam = searchParams.get('level') || level;
      
      let data = await exerciseService.getExercisesByLevel(Number(levelParam));
      
      // Filter by topic if specified
      if (topicFilter) {
        data = data.filter(ex => ex.topic === topicFilter);
      }
      
      if (data.length === 0) {
          toast({
            title: t('game.noExercises'),
            description: topicFilter 
              ? `${t('game.noExercisesTopic')} "${topicFilter}"`
              : t('game.noExercisesLevel'),
            variant: 'destructive',
          });
        navigate(`/levels${getTopicParam()}`);
        return;
      }

      // Shuffle and take 10 exercises
      const shuffled = shuffle(data).slice(0, 10);
      setExercises(shuffled);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: t('common.error'),
        description: t('game.errorLoading'),
        variant: 'destructive',
      });
      navigate(`/levels${getTopicParam()}`);
    } finally {
      setLoading(false);
    }
  };


  const handlePenalty = (points: number) => {
    setScore(prev => Math.max(0, prev - points));
  };

  const handleAnswer = (isCorrect: boolean, selectedAnswer: string, penalty: number = 0) => {
    const exercise = exercises[currentIndex];
    
    if (isCorrect) {
      // Base score: 100 points per correct answer
      const earnedScore = Math.max(0, 100 - penalty);
      setScore(prev => prev + earnedScore);
    }

    let explanation = '';
    if (!isCorrect) {
      if (exercise.type === 'FILL_IN_THE_BLANK') {
        if (selectedAnswer === exercise.incorrect_answer_1) {
          explanation = exercise.incorrect_answer_1_explanation || '';
        } else if (selectedAnswer === exercise.incorrect_answer_2) {
          explanation = exercise.incorrect_answer_2_explanation || '';
        } else if (selectedAnswer === exercise.incorrect_answer_3) {
          explanation = exercise.incorrect_answer_3_explanation || '';
        }
      }
    }

    setFeedbackData({
      isCorrect,
      correctAnswer: exercise.type === 'LISTENING' ? exercise.spanish_translation! : exercise.correct_answer,
      explanation,
    });
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setFeedbackData(null);

    // Check if completed all exercises
    if (currentIndex >= exercises.length - 1) {
      handleGameComplete();
      return;
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleGameOver = async () => {
    // Save score to localStorage for non-authenticated users on level 1
    if (!user && Number(level) === 1) {
      localStorage.setItem('pendingScore', JSON.stringify({ level: Number(level), score }));
    }
    
    // Show congratulations screen instead of navigating
    setShowCongratulations(true);
  };

  const handleGameComplete = async () => {
    // For authenticated users, submit score immediately
    if (user) {
      try {
        await rankingService.submitScore(Number(level), score);
      } catch (error) {
        console.error('Error submitting score:', error);
      }
    } else if (Number(level) === 1) {
      // Save score to localStorage for non-authenticated users on level 1
      localStorage.setItem('pendingScore', JSON.stringify({ level: Number(level), score }));
    }
    
    // Show congratulations screen
    setShowCongratulations(true);
  };

  const handleCongratulationsContinue = () => {
    if (user) {
      navigate(`/levels${getTopicParam()}`);
    } else {
      navigate(`/${getTopicParam()}`);
    }
  };

  const handleSaveResults = () => {
    // Redirect to auth page to login/signup
    navigate(`/auth?returnTo=/levels${getTopicParam().replace('?', '&')}`);
  };

  const handleExit = () => {
    navigate(`/levels${getTopicParam()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-2xl">Cargando ejercicios...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return null;
  }

  const currentExercise = exercises[currentIndex];
  const topicLabel = searchParams.get('topic');

  return (
    <div className="min-h-screen pb-32">
      <GameHeader 
        currentQuestion={currentIndex + 1}
        totalQuestions={exercises.length}
        level={Number(level)}
        topic={topicLabel}
        score={score}
      />

      <div className="pt-32">
        {currentExercise.type === 'FILL_IN_THE_BLANK' && (
          <FillInTheBlank exercise={currentExercise} onAnswer={handleAnswer} />
        )}
        {currentExercise.type === 'LISTENING' && (
          <ListeningExercise exercise={currentExercise} onAnswer={handleAnswer} />
        )}
        {currentExercise.type === 'IDENTIFY_THE_WORD' && (
          <IdentifyWord exercise={currentExercise} onAnswer={handleAnswer} />
        )}
        {currentExercise.type === 'WHEEL_OF_FORTUNE' && (
          <WheelOfFortune
            exercise={currentExercise}
            onAnswer={(isCorrect, penalty) => handleAnswer(isCorrect, '', penalty)}
            onPenalty={handlePenalty}
          />
        )}
      </div>

      {showFeedback && feedbackData && (
        <FeedbackModal {...feedbackData} onContinue={handleContinue} />
      )}

      {showCongratulations && (
        <CongratulationsScreen 
          score={score}
          level={Number(level)}
          isAuthenticated={!!user}
          onContinue={handleCongratulationsContinue}
          onSaveResults={handleSaveResults}
        />
      )}
    </div>
  );
};

export default Game;