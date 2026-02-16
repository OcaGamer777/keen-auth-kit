import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  // Initial spread from trophy center
  launchX: number;   // px offset from center
  launchY: number;   // px upward (negative)
  // Final gravity landing
  landX: number;
  landY: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  shape: 'rect' | 'circle' | 'strip';
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(45 100% 70%)',
  'hsl(30 100% 60%)',
  'hsl(200 80% 60%)',
  'hsl(320 70% 60%)',
  'hsl(50 100% 55%)',
];

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 180;
    const shapes: Particle['shape'][] = ['rect', 'circle', 'strip'];
    return {
      launchX: Math.cos(angle) * speed,
      launchY: -(120 + Math.random() * 200), // fly upward
      landX: Math.cos(angle) * speed * 0.6 + (Math.random() - 0.5) * 100,
      landY: 300 + Math.random() * 400,       // fall down past center
      rotation: Math.random() * 1080 - 540,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 5 + Math.random() * 9,
      delay: Math.random() * 0.4,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  });

const getShapeStyle = (p: Particle): React.CSSProperties => {
  switch (p.shape) {
    case 'circle':
      return { width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color };
    case 'strip':
      return { width: p.size * 0.4, height: p.size * 1.8, borderRadius: 2, backgroundColor: p.color };
    default:
      return { width: p.size, height: p.size * 0.6, borderRadius: 2, backgroundColor: p.color };
  }
};

export const ConfettiEffect = () => {
  const particles = useMemo(() => generateParticles(80), []);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {/* All particles originate from center (trophy position) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 0, height: 0 }}>
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={getShapeStyle(p)}
            initial={{
              x: 0,
              y: 0,
              rotate: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: [0, p.launchX, p.landX],
              y: [0, p.launchY, p.landY],
              rotate: [0, p.rotation * 0.4, p.rotation],
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.6],
            }}
            transition={{
              duration: 2.2 + Math.random() * 0.8,
              delay: p.delay,
              times: [0, 0.35, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </div>
    </div>
  );
};
