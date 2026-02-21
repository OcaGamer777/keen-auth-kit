import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { rankingService } from '@/services/rankingService';
import { DailyRanking } from '@/types/exercise';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Ranking() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [rankings, setRankings] = useState<DailyRanking[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadRankings();
    }
  }, [user, selectedLevel]);

  const loadRankings = async () => {
    setLoadingRankings(true);
    try {
      const data = await rankingService.getDailyRankings(selectedLevel);
      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const getMedalColor = (position: number) => {
    if (position === 1) return 'text-yellow-500';
    if (position === 2) return 'text-gray-400';
    if (position === 3) return 'text-orange-600';
    return '';
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-10 h-10 text-primary" />
            {t('ranking.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('ranking.subtitle')}
          </p>
        </motion.div>

        <Tabs value={String(selectedLevel)} onValueChange={(v) => setSelectedLevel(Number(v))}>
          <TabsList className="grid grid-cols-6 w-full">
            {[1, 2, 3, 4, 5, 6].map(level => (
              <TabsTrigger key={level} value={String(level)}>
                {t('ranking.level')} {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {[1, 2, 3, 4, 5, 6].map(level => (
            <TabsContent key={level} value={String(level)}>
              <Card className="p-3 bg-card/50 backdrop-blur-xl">
                {loadingRankings ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t('ranking.noRanking')}
                      </p>
                    ) : (
                      <AnimatePresence mode="wait">
                        {rankings.map((ranking, index) => {
                          const position = index + 1;
                          const isCurrentUser = ranking.user_id === user?.id;

                          return (
                            <motion.div
                              key={ranking.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.06, duration: 0.3 }}
                              className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                                isCurrentUser
                                  ? 'bg-primary/20 border-2 border-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]'
                                  : 'bg-secondary'
                              }`}
                            >
                              <div className="w-12 text-center">
                                {position <= 3 ? (
                                  <Medal className={`w-8 h-8 mx-auto ${getMedalColor(position)}`} />
                                ) : (
                                  <span className="text-2xl font-bold text-muted-foreground">
                                    {position}
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-2xl">{ranking.avatar_icon || '😀'}</span>
                                <p className={`font-semibold ${isCurrentUser ? 'text-primary' : ''}`}>
                                  {ranking.username}
                                  {isCurrentUser && ` (${t('ranking.you')})`}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                  {ranking.score}
                                </p>
                                <p className="text-xs text-muted-foreground">{t('ranking.score').toLowerCase()}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
