import { useState } from 'react';
import { cn } from '@/lib/utils';

const AVATAR_ICONS = [
  '😀', '😎', '🤓', '🥳', '😈', '🤖',
  '🦁', '🐯', '🐼', '🦊', '🐻', '🦋',
  '🦄', '🐉', '🦅', '🐬', '🐺', '🦉',
  '🌟', '🚀', '⚡', '🔥', '❄️', '💎',
  '🎯', '🏆', '🎮', '🎸', '👑', '🌈',
];

interface AvatarIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  size?: 'sm' | 'md';
}

export function AvatarIconPicker({ value, onChange, size = 'md' }: AvatarIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-all border-2 border-transparent hover:border-primary/50",
          size === 'md' ? 'w-20 h-20 text-4xl' : 'w-12 h-12 text-2xl'
        )}
      >
        {value}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-2 p-3 bg-popover border border-border rounded-xl shadow-xl grid grid-cols-6 gap-1.5 w-[240px] left-0">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => { onChange(icon); setIsOpen(false); }}
                className={cn(
                  "w-9 h-9 text-xl rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all",
                  value === icon && "bg-primary/30 ring-2 ring-primary"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
