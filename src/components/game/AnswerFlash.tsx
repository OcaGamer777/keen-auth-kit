import { motion, AnimatePresence } from 'framer-motion';

interface AnswerFlashProps {
  type: 'correct' | 'incorrect' | null;
}

export const AnswerFlash = ({ type }: AnswerFlashProps) => {
  return (
    <AnimatePresence>
      {type === 'correct' && (
        <motion.div
          key="correct-flash"
          className="fixed inset-0 pointer-events-none z-[60]"
          style={{
            boxShadow: 'inset 0 0 80px 30px hsl(var(--success) / 0.4), inset 0 0 200px 60px hsl(var(--success) / 0.15)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {type === 'incorrect' && (
        <motion.div
          key="incorrect-flash"
          className="fixed inset-0 pointer-events-none z-[60]"
          style={{
            backgroundColor: 'hsl(var(--destructive) / 0.08)',
            boxShadow: 'inset 0 0 80px 30px hsl(var(--destructive) / 0.3)',
          }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0.8],
            x: [0, -6, 6, -4, 4, -2, 2, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.4 },
            x: { duration: 0.4, ease: 'easeOut' },
          }}
        />
      )}
    </AnimatePresence>
  );
};
