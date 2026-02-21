import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AVATAR_ICONS = [
  // Caras
  '😀', '😃', '😄', '😁', '😆', '😅',
  '🤣', '😂', '😊', '😇', '🙂', '😉',
  '😍', '🥰', '😘', '😎', '🤓', '🧐',
  '🥳', '😏', '😈', '👻', '🤖', '👽',
  // Animales
  '🦁', '🐯', '🐼', '🦊', '🐻', '🦋',
  '🦄', '🐉', '🦅', '🐬', '🐺', '🦉',
  '🐸', '🐧', '🐨', '🐮', '🐷', '🐵',
  '🦈', '🐙', '🦜', '🐝', '🐞', '🦎',
  // Naturaleza y objetos
  '🌟', '🚀', '⚡', '🔥', '❄️', '💎',
  '🎯', '🏆', '🎮', '🎸', '👑', '🌈',
  '🌻', '🍀', '🌙', '☀️', '🌊', '🏔️',
  '🎭', '🎨', '🎪', '🎬', '📚', '🔮',
  // Comida y más
  '🍕', '🍩', '🍦', '🎂', '🍉', '🌮',
  '☕', '🧁', '🍣', '🥑', '🍿', '🧃',
  // Deportes y actividades
  '⚽', '🏀', '🎾', '🏄', '🚴', '🎿',
  '🛹', '🏋️', '🤺', '🧗', '🎳', '🏹',
  // Símbolos y corazones
  '❤️', '💜', '💙', '💚', '🧡', '💛',
  '✨', '💫', '🌀', '🎵', '♾️', '🔱',
];

const ICONS_PER_PAGE = 18;

interface AvatarIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  size?: 'sm' | 'md';
}

export function AvatarIconPicker({ value, onChange, size = 'md' }: AvatarIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(AVATAR_ICONS.length / ICONS_PER_PAGE);
  const pageIcons = AVATAR_ICONS.slice(page * ICONS_PER_PAGE, (page + 1) * ICONS_PER_PAGE);

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
          <div className="absolute z-50 mt-2 p-3 bg-popover border border-border rounded-xl shadow-xl w-[240px] left-1/2 -translate-x-1/2">
            <p className="text-xs text-muted-foreground text-center mb-2">¡Elige tu icono! 👇</p>
            <div className="grid grid-cols-6 gap-1.5">
              {pageIcons.map((icon) => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded-md hover:bg-primary/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded-md hover:bg-primary/20 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
