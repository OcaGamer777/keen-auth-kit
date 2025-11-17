import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { profileService } from '@/services/profileService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Target, Award } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { getTopicParam } = useTopic();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    levelsCompleted: 0,
    totalScore: 0,
    highestLevel: 0,
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to levels page where they can access level 1
      navigate(`/levels${getTopicParam()}`);
    }
  }, [user, loading, navigate, getTopicParam]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            {t('home.hello')}, {username}!
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('home.welcome')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('home.levelsToday')}</p>
                <p className="text-3xl font-bold text-primary">{stats.levelsCompleted}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-full">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('home.totalPoints')}</p>
                <p className="text-3xl font-bold text-accent">{stats.totalScore}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20 hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/20 rounded-full">
                <Award className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('home.maxLevel')}</p>
                <p className="text-3xl font-bold text-destructive">{stats.highestLevel}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl border-primary/30">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">¿Listo para aprender?</h2>
              <p className="text-muted-foreground">
                Completa ejercicios, sube en el ranking y desbloquea nuevos niveles
              </p>
            </div>
            <Button
              onClick={() => navigate(`/levels${getTopicParam()}`)}
              className="btn-duolingo text-xl py-6 px-12"
              size="lg"
            >
              IR A LOS NIVELES
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}