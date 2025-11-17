import { Trophy, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface CongratulationsScreenProps {
  score: number;
  level: number;
  isAuthenticated: boolean;
  onContinue: () => void;
  onSaveResults: () => void;
}

export const CongratulationsScreen = ({ 
  score, 
  level, 
  isAuthenticated, 
  onContinue, 
  onSaveResults 
}: CongratulationsScreenProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl border-primary/30 animate-scale-in">
        <div className="text-center space-y-6">
          {/* Trophy animation */}
          <div className="relative inline-block animate-bounce-slow">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Trophy className="w-24 h-24 text-primary relative z-10" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              {t('congrats.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('congrats.completed')} {level}
            </p>
          </div>

          {/* Score display */}
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-4">
              <Star className="w-8 h-8 text-accent" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">{t('congrats.score')}</p>
                <p className="text-4xl font-bold text-primary">{score}</p>
              </div>
              <Star className="w-8 h-8 text-accent" />
            </div>
          </div>

          {/* Encouragement message */}
          <p className="text-lg text-foreground">
            {t('congrats.encouragement')}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4">
            {!isAuthenticated && level === 1 ? (
              <>
                <Button
                  onClick={onSaveResults}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all py-6 h-auto"
                  size="lg"
                >
                  <Trophy className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base md:text-lg leading-tight">{t('congrats.saveAndContinue')}</span>
                </Button>
                <Button
                  onClick={onContinue}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {t('congrats.backHome')}
                </Button>
              </>
            ) : (
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-lg py-6"
                size="lg"
              >
                {t('congrats.continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
