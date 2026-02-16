import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { profileService } from '@/services/profileService';
import { topicService } from '@/services/topicService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Target, Award, Youtube, ExternalLink } from 'lucide-react';
import { Topic } from '@/types/topic';
import { TopicsPanel } from '@/components/TopicsPanel';

export default function Home() {
  const { user, loading } = useAuth();
  const { isPro, isAdmin } = useRole();
  const { t } = useLanguage();
  const { getTopicParam } = useTopic();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    levelsCompleted: 0,
    totalScore: 0,
    highestLevel: 0,
  });
  const [username, setUsername] = useState('');
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  useEffect(() => {
    // Load topic data if there's a topic in the URL
    const loadTopic = async () => {
      const topicParam = new URLSearchParams(window.location.search).get('topic');
      if (topicParam) {
        try {
          const topic = await topicService.getTopicByTitle(topicParam);
          setCurrentTopic(topic);
        } catch (error) {
          console.error('Error loading topic:', error);
        }
      }
    };
    loadTopic();
  }, []);

  const loadStats = async () => {
    try {
      const dailyStats = await profileService.getDailyStats();
      setStats(dailyStats);

      const profile = await profileService.getCurrentProfile();
      if (profile) {
        setUsername(profile.username);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            {t('home.hello')}{username ? `, ${username}` : ''}!
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('home.welcome')}{currentTopic ? `. ${t('home.today')}: ${currentTopic.title}` : ''}
          </p>
        </div>

        {/* Topic Video and Explanation Link */}
        {currentTopic && (currentTopic.youtube_url || currentTopic.explanation_url) && (
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Youtube className="w-5 h-5 text-destructive" />
                  <span>{currentTopic.title}</span>
                </div>
                {currentTopic.explanation_url && (
                  <a
                    href={currentTopic.explanation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('home.lection')}
                  </a>
                )}
              </div>
              {currentTopic.youtube_url && (
                <div className="aspect-video w-full">
                  <iframe
                    src={getYoutubeEmbedUrl(currentTopic.youtube_url) || ''}
                    title={currentTopic.title}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* CTA - Go to Levels (moved here, after video) */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl border-primary/30">
          <div className="text-center space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{t('home.ready')}?</h2>
              <p className="text-muted-foreground">
                {t('home.instructions')}
              </p>
            </div>
            <Button
              onClick={() => navigate(`/levels${getTopicParam()}`)}
              className="btn-duolingo text-xl py-6 px-12"
              size="lg"
            >
              {t('home.levels')}
            </Button>
          </div>
        </Card>

        {/* Statistics Cards */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Card className="p-3 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('home.levelsToday')}</p>
                  <p className="text-2xl font-bold text-primary">{stats.levelsCompleted}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-full">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('home.totalPoints')}</p>
                  <p className="text-2xl font-bold text-accent">{stats.totalScore}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-full">
                  <Award className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('home.maxLevel')}</p>
                  <p className="text-2xl font-bold text-destructive">{stats.highestLevel}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Topics Panel - PRO/ADMIN can interact, FREE users see disabled */}
        {(isPro || isAdmin) ? <TopicsPanel /> : <TopicsPanel disabled />}
      </div>
    </div>
  );
}
