import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playCorrect: () => void;
  playIncorrect: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const STORAGE_KEY = 'sound-notifications-enabled';

// Generate a short synth tone using Web Audio API
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, ramp?: 'up' | 'down') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    if (ramp === 'up') {
      osc.frequency.setValueAtTime(frequency * 0.8, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(frequency, ctx.currentTime + duration * 0.5);
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // Silently fail if audio not supported
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const playCorrect = useCallback(() => {
    if (!soundEnabled) return;
    // Pleasant ascending two-tone chime
    playTone(523.25, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659.25, 0.25, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.35, 'sine', 0.15), 200); // G5
  }, [soundEnabled]);

  const playIncorrect = useCallback(() => {
    if (!soundEnabled) return;
    // Low descending buzz
    playTone(330, 0.15, 'square', 0.12);
    setTimeout(() => playTone(262, 0.25, 'square', 0.1), 120);
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, playCorrect, playIncorrect }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider');
  return context;
}
