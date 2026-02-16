import { motion } from 'framer-motion';

interface LevelIntroProps {
  level: number;
  onComplete: () => void;
}

export const LevelIntro = ({ level, onComplete }: LevelIntroProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.6, duration: 0.4 }}
      onAnimationComplete={onComplete}
    >
      {/* Golden glow behind number */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 2], opacity: [0, 0.8, 0] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* Level number */}
      <motion.div
        className="relative flex flex-col items-center gap-2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.span
          className="text-muted-foreground text-xl font-semibold tracking-widest uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          Nivel
        </motion.span>
        <motion.span
          className="text-8xl sm:text-9xl font-black text-primary"
          style={{
            textShadow: '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--primary) / 0.25)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
        >
          {level}
        </motion.span>
      </motion.div>

      {/* Expanding ring */}
      <motion.div
        className="absolute rounded-full border-2 border-primary/40"
        style={{ width: 120, height: 120 }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
      />
    </motion.div>
  );
};
