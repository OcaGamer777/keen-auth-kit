import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { topicService } from '@/services/topicService';
import { configService, CONFIG_KEYS } from '@/services/configService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, BookOpen, ChevronRight, Star, Lock } from 'lucide-react';
import { Topic } from '@/types/topic';

interface TopicsPanelProps {
  disabled?: boolean;
}

export function TopicsPanel({ disabled = false }: TopicsPanelProps) {
  const { t } = useLanguage();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [defaultTopicTitle, setDefaultTopicTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [visibleTopics, defaultTopic] = await Promise.all([
        topicService.getVisibleTopics(),
        configService.get<string>(CONFIG_KEYS.DEFAULT_TOPIC)
      ]);
      setTopics(visibleTopics);
      setDefaultTopicTitle(defaultTopic);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: Topic) => {
    // Use window.location to ensure full page reload with new topic
    window.location.href = `/?topic=${encodeURIComponent(topic.title)}`;
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">{t('topics.allTopics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {t('topics.allTopics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
            <Lock className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-primary font-medium">
              Hazte PRO para acceder a todos los temas
            </span>
          </div>
        )}
        {topics.map((topic) => {
          const isDefaultTopic = defaultTopicTitle === topic.title;
          
          return (
            <div
              key={topic.id}
              onClick={() => !disabled && handleTopicClick(topic)}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                disabled
                  ? 'opacity-50 grayscale cursor-not-allowed'
                  : isDefaultTopic 
                    ? 'bg-primary/20 border-2 border-primary cursor-pointer' 
                    : 'bg-muted/50 hover:bg-muted cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isDefaultTopic && !disabled && (
                  <Star className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
                )}
                {disabled && (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`font-medium truncate ${isDefaultTopic && !disabled ? 'text-primary' : ''}`}>
                  {topic.title}
                </span>
                {!disabled && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {topic.explanation_url && (
                      <a
                        href={topic.explanation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-500 hover:text-emerald-400 transition-colors"
                        title={t('topics.viewExplanation')}
                      >
                        <BookOpen className="w-5 h-5" />
                      </a>
                    )}
                    {topic.youtube_url && (
                      <a
                        href={topic.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title={t('topics.viewVideo')}
                      >
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              {disabled ? (
                <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">PRO</span>
              ) : (
                <ChevronRight className={`w-5 h-5 transition-colors flex-shrink-0 ${
                  isDefaultTopic ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                }`} />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
