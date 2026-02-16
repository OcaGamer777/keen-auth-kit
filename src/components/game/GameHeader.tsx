import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookOpen, Youtube } from 'lucide-react';

interface GameHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  level: number;
  topic?: string | null;
  topicExplanationUrl?: string | null;
  topicYoutubeUrl?: string | null;
  score: number;
}

export const GameHeader = ({ currentQuestion, totalQuestions, level, topic, topicExplanationUrl, topicYoutubeUrl, score }: GameHeaderProps) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const TopicDisplay = () => {
    if (!topic) return null;
    
    return (
      <span className="inline-flex items-center gap-1">
        {topicYoutubeUrl && (
          <a 
            href={topicYoutubeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
            title="Ver vídeo"
          >
            <Youtube className="w-4 h-4 text-red-500" />
          </a>
        )}
        {topicExplanationUrl ? (
          <a 
            href={topicExplanationUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {topic}
          </a>
        ) : (
          <span>{topic}</span>
        )}
      </span>
    );
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-2">
        {isMobile ? (
          <div className="flex items-center justify-between gap-3 mb-1 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">{currentQuestion}/{totalQuestions}</span>
            <span className="font-bold text-primary text-lg whitespace-nowrap">
              {score} {t('common.points')}
            </span>
            <span className="text-muted-foreground text-right">
              {t('game.level')} {level}{topic && <> • <TopicDisplay /></>}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mb-1 text-sm">
            <span className="text-muted-foreground">{t('game.exercise')} {currentQuestion} {t('game.of')} {totalQuestions}</span>
            <span className="font-semibold text-primary text-lg">
              {score} {t('common.points')}
            </span>
            <span className="text-muted-foreground">
              {t('game.level')} {level}{topic && <> • <TopicDisplay /></>}
            </span>
          </div>
        )}
        <Progress value={progress} className="h-4" />
      </div>
    </div>
  );
};