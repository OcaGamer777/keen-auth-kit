import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { profileService } from '@/services/profileService';
import { rankingService } from '@/services/rankingService';
import { topicService } from '@/services/topicService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Youtube, BookOpen } from 'lucide-react';
import { Profile } from '@/types/exercise';
import { Topic } from '@/types/topic';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Levels() {
  const { user, loading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const { t } = useLanguage();
  const { topic, getTopicParam } = useTopic();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [highscores24h, setHighscores24h] = useState<Record<number, number>>({});
  const [topicData, setTopicData] = useState<Topic | null>(null);

  useEffect(() => {
    const loadTopic = async () => {
      if (topic) {
        try {
          const data = await topicService.getTopicByTitle(topic);
          setTopicData(data);
        } catch (error) {
          console.error('Error loading topic:', error);
        }
      }
    };
    loadTopic();
  }, [topic]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setUnlockedLevels([1]);
        return;
      }

      try {
        const profileData = await profileService.getCurrentProfile();
        setProfile(profileData);

        if (profileData) {
          if (isPro) {
            setUnlockedLevels([1, 2, 3, 4, 5, 6]);
            return;
          }

          const unlocked = [1];

          for (let level = 1; level <= 5; level++) {
            const progress = profileData.level_progress[level];
            
            if (progress && progress.highscore > 0) {
              const position = await rankingService.getUserRankPosition(level);
              if (position && position <= 5) {
                unlocked.push(level + 1);
              }
            }
          }

          setUnlockedLevels(unlocked);
        }

        const scores: Record<number, number> = {};
        for (let level = 1; level <= 6; level++) {
          scores[level] = await rankingService.getUserHighscoreLast24h(level);
        }
        setHighscores24h(scores);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (!roleLoading) {
      loadProfile();
    }
  }, [user, isPro, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const levelNames = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const levels = [1, 2, 3, 4, 5, 6];

  const youtubeWatchUrl = (() => {
    if (!topicData?.youtube_url) return null;

    let url = topicData.youtube_url.trim();
    if (!url) return null;

    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const embed = url.match(/youtube\.com\/embed\/([^?]+)/i);
    const shorts = url.match(/youtube\.com\/shorts\/([^?]+)/i);
    const shortDomain = url.match(/youtu\.be\/([^?]+)/i);

    const id =
      embed?.[1] ||
      shorts?.[1] ||
      shortDomain?.[1] ||
      (() => {
        try {
          const u = new URL(url);
          return u.searchParams.get('v') || null;
        } catch {
          return null;
        }
      })();

    return id ? `https://www.youtube.com/watch?v=${id}` : url;
  })();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4 pt-20">
        {topicData && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <span className="text-xl font-semibold text-foreground">{topicData.title}</span>
            {youtubeWatchUrl && (
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener"
                className="text-red-500 hover:text-red-400 transition-colors"
                title={t('home.watchVideo')}
              >
                <Youtube className="h-7 w-7" />
              </a>
            )}
            {topicData.explanation_url && (
              <a
                href={topicData.explanation_url}
                target="_blank"
                rel="noopener"
                className="text-primary hover:text-primary/80 transition-colors"
                title={t('levels.viewExplanation') || 'Ver explicación'}
              >
                <BookOpen className="h-7 w-7" />
              </a>
            )}
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent"
        >
          {t('levels.title')}
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {levels.map((level, i) => {
            const isUnlocked = unlockedLevels.includes(level);
            const highscore = highscores24h[level] || 0;

            return (
              <motion.div
                key={level}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card
                  className={`p-3 backdrop-blur-xl border-border transition-all duration-200 ${
                    isUnlocked 
                      ? 'bg-card/50 hover:scale-[1.03] hover:shadow-lg cursor-pointer' 
                      : 'bg-muted/20 opacity-60'
                  }`}
                  onClick={() => isUnlocked && navigate(`/game/${level}${getTopicParam()}`)}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {t('levels.level')} {level}
                    </div>
                    
                    {isUnlocked ? (
                      <>
                        <div className="text-sm text-muted-foreground">
                          {t('levels.highscore24h')}: {highscore}
                        </div>
                        <Button className="w-full btn-interactive">
                          {t('levels.play')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {!user 
                            ? t('levels.loginToUnlock')
                            : isPro 
                              ? t('levels.unlockedWithPro')
                              : t('levels.reachTop5OrPro')}
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
