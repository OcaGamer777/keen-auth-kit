import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { exerciseService } from '@/services/exerciseService';
import { rankingService } from '@/services/rankingService';
import { topicService } from '@/services/topicService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { Exercise } from '@/types/exercise';
import { GameHeader } from '@/components/game/GameHeader';
import { FeedbackModal } from '@/components/game/FeedbackModal';
import { CongratulationsScreen } from '@/components/game/CongratulationsScreen';
import { LevelIntro } from '@/components/game/LevelIntro';
import { FillInTheBlank } from '@/components/game/FillInTheBlank';
import { ListeningExercise } from '@/components/game/ListeningExercise';
import { IdentifyWord } from '@/components/game/IdentifyWord';
import { WheelOfFortune } from '@/components/game/WheelOfFortune';
import { FreeWriting } from '@/components/game/FreeWriting';
import { FillInTheBlankWriting } from '@/components/game/FillInTheBlankWriting';
import { WordSearch } from '@/components/game/WordSearch';
import { AnswerFlash } from '@/components/game/AnswerFlash';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useSound } from '@/contexts/SoundContext';
import { shuffleAvoidingConsecutiveTypes } from '@/lib/utils';

const exerciseVariants = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, x: '-30%', transition: { duration: 0.25 } },
};

const Game = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPro } = useRole();
  const { t } = useLanguage();
  const { getTopicParam } = useTopic();
  const { playCorrect, playIncorrect } = useSound();
  const [answerFlash, setAnswerFlash] = useState<'correct' | 'incorrect' | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showLevelIntro, setShowLevelIntro] = useState(true);
  const [topicExplanationUrl, setTopicExplanationUrl] = useState<string | null>(null);
  const [topicYoutubeUrl, setTopicYoutubeUrl] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
    exercise?: Exercise;
    selectedAnswer?: string;
    isFirstAttemptWrong?: boolean;
    isSecondAttempt?: boolean;
    elapsedSeconds?: number;
    earnedScore?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Scroll to top whenever exercise changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  useEffect(() => {
    setShowLevelIntro(true);
    loadExercises();
  }, [level, searchParams]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const topicFilter = searchParams.get('topic');
      const levelParam = searchParams.get('level') || level;
      
      if (topicFilter) {
        try {
          const topicData = await topicService.getTopicByTitle(topicFilter);
          setTopicExplanationUrl(topicData?.explanation_url || null);
          setTopicYoutubeUrl(topicData?.youtube_url || null);
        } catch (error) {
          console.error('Error loading topic:', error);
          setTopicExplanationUrl(null);
          setTopicYoutubeUrl(null);
        }
      } else {
        setTopicExplanationUrl(null);
        setTopicYoutubeUrl(null);
      }
      
      let data = await exerciseService.getExercisesByLevel(Number(levelParam));
      
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

      const bonusTypes = ['FREE_WRITING'];
      const regularExercises = data.filter(ex => !bonusTypes.includes(ex.type));
      const shuffled = shuffleAvoidingConsecutiveTypes(regularExercises).slice(0, 10);
      
      const bonusExercises = data.filter(ex => bonusTypes.includes(ex.type));
      if (bonusExercises.length > 0) {
        const randomBonus = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
        shuffled.push(randomBonus);
      }
      
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

  const handleAnswer = (isCorrect: boolean, selectedAnswer: string, isSecondAttemptOrPenalty: boolean | number = false, elapsedSeconds?: number) => {
    const exercise = exercises[currentIndex];
    
    const penalty = typeof isSecondAttemptOrPenalty === 'number' ? isSecondAttemptOrPenalty : 0;
    const isSecondAttempt = typeof isSecondAttemptOrPenalty === 'boolean' ? isSecondAttemptOrPenalty : false;
    
    const supportsSecondAttempt = exercise.type === 'IDENTIFY_THE_WORD' || exercise.type === 'LISTENING' || exercise.type === 'FILL_IN_THE_BLANK';
    
    if (supportsSecondAttempt && !isCorrect && !isSecondAttempt) {
      let explanation = '';
      if (selectedAnswer === exercise.incorrect_answer_1) {
        explanation = exercise.incorrect_answer_1_explanation || '';
      } else if (selectedAnswer === exercise.incorrect_answer_2) {
        explanation = exercise.incorrect_answer_2_explanation || '';
      } else if (selectedAnswer === exercise.incorrect_answer_3) {
        explanation = exercise.incorrect_answer_3_explanation || '';
      }
      
      // Flash and sound for first wrong attempt
      setAnswerFlash('incorrect');
      playIncorrect();
      setTimeout(() => setAnswerFlash(null), 600);

      setFeedbackData({
        isCorrect: false,
        correctAnswer: exercise.type === 'LISTENING' ? exercise.spanish_translation! : exercise.correct_answer,
        explanation,
        exercise,
        selectedAnswer,
        isFirstAttemptWrong: true,
        isSecondAttempt: false,
      });
      setShowFeedback(true);
      return;
    }
    
    let earnedScore = 0;
    const nonScoringTypes = ['FREE_WRITING'];
    if (!nonScoringTypes.includes(exercise.type) && isCorrect) {
      earnedScore = 100;
      
      if (isSecondAttempt) {
        const seconds = elapsedSeconds ?? 0;
        earnedScore = Math.max(0, 50 - seconds);
      } else if (penalty > 0) {
        earnedScore = Math.max(0, 100 - penalty);
      } else if (elapsedSeconds !== undefined) {
        const timePenalty = Math.min(elapsedSeconds, 50);
        earnedScore = 100 - timePenalty;
      }
      
      setScore(prev => prev + earnedScore);
    }

    let explanation = '';
    if (!isCorrect) {
      if (selectedAnswer === exercise.incorrect_answer_1) {
        explanation = exercise.incorrect_answer_1_explanation || '';
      } else if (selectedAnswer === exercise.incorrect_answer_2) {
        explanation = exercise.incorrect_answer_2_explanation || '';
      } else if (selectedAnswer === exercise.incorrect_answer_3) {
        explanation = exercise.incorrect_answer_3_explanation || '';
      }
    }

    // Trigger visual flash and sound
    if (isCorrect) {
      setAnswerFlash('correct');
      playCorrect();
    } else {
      setAnswerFlash('incorrect');
      playIncorrect();
    }
    setTimeout(() => setAnswerFlash(null), 600);

    setFeedbackData({
      isCorrect,
      correctAnswer: exercise.type === 'LISTENING' ? exercise.spanish_translation! : exercise.correct_answer,
      explanation,
      exercise,
      selectedAnswer,
      isFirstAttemptWrong: false,
      isSecondAttempt,
      elapsedSeconds: isCorrect ? elapsedSeconds : undefined,
      earnedScore: isCorrect ? earnedScore : undefined,
    });
    setShowFeedback(true);
  };

  const handleContinue = () => {
    if (feedbackData?.isFirstAttemptWrong) {
      setShowFeedback(false);
      setFeedbackData(null);
      return;
    }
    
    setShowFeedback(false);
    setFeedbackData(null);

    if (currentIndex >= exercises.length - 1) {
      handleGameComplete();
      return;
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleGameOver = async () => {
    if (!user && Number(level) === 1) {
      localStorage.setItem('pendingScore', JSON.stringify({ level: Number(level), score }));
    }
    setShowCongratulations(true);
  };

  const handleGameComplete = async () => {
    if (user) {
      try {
        await rankingService.submitScore(Number(level), score);
      } catch (error) {
        console.error('Error submitting score:', error);
      }
    } else if (Number(level) === 1) {
      localStorage.setItem('pendingScore', JSON.stringify({ level: Number(level), score }));
    }
    setShowCongratulations(true);
  };

  const handleCongratulationsContinue = () => {
    if (user) {
      navigate(`/levels${getTopicParam()}`);
    } else {
      navigate(`/${getTopicParam()}`);
    }
  };

  const handleNextLevel = () => {
    const nextLevel = Number(level) + 1;
    setShowCongratulations(false);
    setCurrentIndex(0);
    setScore(0);
    setExercises([]);
    if (nextLevel <= 6) {
      navigate(`/game/${nextLevel}${getTopicParam()}`);
    } else {
      navigate(`/levels${getTopicParam()}`);
    }
  };

  const handleChangeTopic = () => {
    navigate('/#topics');
  };

  const handleSaveResults = () => {
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

  const renderExercise = () => {
    switch (currentExercise.type) {
      case 'FILL_IN_THE_BLANK':
        return <FillInTheBlank exercise={currentExercise} onAnswer={handleAnswer} />;
      case 'LISTENING':
        return <ListeningExercise exercise={currentExercise} onAnswer={handleAnswer} />;
      case 'IDENTIFY_THE_WORD':
        return <IdentifyWord exercise={currentExercise} onAnswer={handleAnswer} onHintUsed={() => setScore(prev => Math.max(0, prev - 5))} />;
      case 'WHEEL_OF_FORTUNE':
        return <WheelOfFortune exercise={currentExercise} onAnswer={(isCorrect, penalty) => handleAnswer(isCorrect, '', penalty)} onPenalty={handlePenalty} />;
      case 'FREE_WRITING':
        return <FreeWriting exercise={currentExercise} onContinue={handleContinue} />;
      case 'FILL_IN_THE_BLANK_WRITING':
        return <FillInTheBlankWriting exercise={currentExercise} onContinue={handleContinue} />;
      case 'WORD_SEARCH':
        return <WordSearch exercise={currentExercise} onAnswer={(isCorrect, answer, penalty) => handleAnswer(isCorrect, answer, penalty ?? 0)} onPenalty={handlePenalty} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <AnswerFlash type={answerFlash} />
      {showLevelIntro && !loading && exercises.length > 0 && (
        <LevelIntro level={Number(level)} onComplete={() => setShowLevelIntro(false)} />
      )}

      <GameHeader 
        currentQuestion={currentIndex + 1}
        totalQuestions={exercises.length}
        level={Number(level)}
        topic={topicLabel}
        topicExplanationUrl={topicExplanationUrl}
        topicYoutubeUrl={topicYoutubeUrl}
        score={score}
      />

      <div className="pt-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise.id}
            variants={exerciseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderExercise()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showFeedback && feedbackData && (
        <FeedbackModal {...feedbackData} onContinue={handleContinue} />
      )}

      {showCongratulations && (
        <CongratulationsScreen 
          score={score}
          level={Number(level)}
          isAuthenticated={!!user}
          isPro={isPro}
          onContinue={handleCongratulationsContinue}
          onSaveResults={handleSaveResults}
          onNextLevel={handleNextLevel}
          onChangeTopic={handleChangeTopic}
        />
      )}
    </div>
  );
};

export default Game;
