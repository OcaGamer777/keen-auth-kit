import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTopic } from '@/contexts/TopicContext';
import { profileService } from '@/services/profileService';
import { rankingService } from '@/services/rankingService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Profile } from '@/types/exercise';

export default function Levels() {
  const { user, loading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const { t } = useLanguage();
  const { getTopicParam } = useTopic();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);

  useEffect(() => {
    // Don't redirect if not logged in - allow access to levels page
    // Users can view locked levels and play level 1
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        // Non-authenticated users can only access level 1
        setUnlockedLevels([1]);
        return;
      }

      try {
        const profileData = await profileService.getCurrentProfile();
        setProfile(profileData);

        if (profileData) {
          // Unlock all levels for PRO/ADMIN users
          if (isPro) {
            setUnlockedLevels([1, 2, 3, 4, 5, 6]);
            return;
          }

          // For FREE users, check completion and ranking
          const unlocked = [1]; // Level 1 always unlocked

          for (let level = 1; level <= 5; level++) {
            const progress = profileData.level_progress[level];
            
            if (progress && progress.highscore > 0) {
              // Check if user is in top 5
              const position = await rankingService.getUserRankPosition(level);
              if (position && position <= 5) {
                unlocked.push(level + 1);
              }
            }
          }

          setUnlockedLevels(unlocked);
        }
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 pt-20">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
          {t('levels.title')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const isUnlocked = unlockedLevels.includes(level);
            const highscore = profile?.level_progress[level]?.highscore || 0;

            return (
              <Card
                key={level}
                className={`p-6 backdrop-blur-xl border-border transition-all ${
                  isUnlocked 
                    ? 'bg-card/50 hover:scale-105 cursor-pointer' 
                    : 'bg-muted/20 opacity-60'
                }`}
                onClick={() => isUnlocked && navigate(`/game/${level}${getTopicParam()}`)}
              >
                <div className="text-center space-y-3">
                  <div className="text-3xl font-bold text-primary">
                    {levelNames[level - 1]}
                  </div>
                  <div className="text-lg font-semibold">
                    {t('levels.level')} {level}
                  </div>
                  
                  {isUnlocked ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Highscore: {highscore}
                      </div>
                      <Button className="w-full">
                        Jugar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {!user 
                          ? 'Inicia sesión para desbloquear'
                          : isPro 
                            ? 'Desbloqueado con PRO'
                            : 'Alcanza el top 5 en el nivel anterior'}
                      </p>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
