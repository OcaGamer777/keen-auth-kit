import { useEffect, useState, useRef } from 'react';
import { Trophy, Star, ArrowRight, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ConfettiEffect } from './ConfettiEffect';

interface CongratulationsScreenProps {
  score: number;
  level: number;
  isAuthenticated: boolean;
  isPro: boolean;
  onContinue: () => void;
  onSaveResults: () => void;
  onNextLevel?: () => void;
  onChangeTopic?: () => void;
}

/** Animated score counter */
const AnimatedScore = ({ target }: { target: number }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const duration = 500;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return <>{display}</>;
};

/** Simple gold particles burst */
const GoldParticles = () => {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 60 + Math.random() * 40;
    return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, delay: Math.random() * 0.15, size: 4 + Math.random() * 6 };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full bg-primary"
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 + p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

export const CongratulationsScreen = ({ 
  score, 
  level, 
  isAuthenticated, 
  isPro,
  onContinue, 
  onSaveResults,
  onNextLevel,
  onChangeTopic,
}: CongratulationsScreenProps) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <ConfettiEffect />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20, stiffness: 250 }}
      >
        <Card className="max-w-2xl w-full p-6 sm:p-8 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl border-primary/30 my-4">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Trophy animation with particles */}
            <div className="relative inline-block">
              <GoldParticles />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary relative z-10" />
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                {t('congrats.title')}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                {t('congrats.completed')} {level}
              </p>
            </motion.div>

            {/* Score display with count-up */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 300 }}
              className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 inline-block"
            >
              <div className="flex items-center gap-4">
                <Star className="w-8 h-8 text-accent" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">{t('congrats.score')}</p>
                  <p className="text-4xl font-bold text-primary">
                    <AnimatedScore target={score} />
                  </p>
                </div>
                <Star className="w-8 h-8 text-accent" />
              </div>
            </motion.div>

            {/* Encouragement message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg text-foreground"
            >
              {t('congrats.encouragement')}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3 pt-4"
            >
              {isPro && isAuthenticated ? (
                <>
                  <Button
                    onClick={onNextLevel}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all py-6 h-auto btn-interactive"
                    size="lg"
                  >
                    <ArrowRight className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg leading-tight">
                      {t('congrats.nextLevel')}
                    </span>
                  </Button>
                  <Button
                    onClick={onChangeTopic}
                    variant="outline"
                    className="w-full py-6 h-auto btn-interactive"
                    size="lg"
                  >
                    <Repeat className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg leading-tight">
                      {t('congrats.changeTopic')}
                    </span>
                  </Button>
                </>
              ) : !isAuthenticated && level === 1 ? (
                <>
                  <Button
                    onClick={onSaveResults}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all py-6 h-auto btn-interactive"
                    size="lg"
                  >
                    <Trophy className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base md:text-lg leading-tight">{t('congrats.saveAndContinue')}</span>
                  </Button>
                  <Button
                    onClick={onContinue}
                    variant="outline"
                    className="w-full btn-interactive"
                    size="lg"
                  >
                    {t('congrats.backHome')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all text-lg py-6 btn-interactive"
                  size="lg"
                >
                  {t('congrats.continue')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
