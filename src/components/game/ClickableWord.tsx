import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WordTranslations } from '@/types/exercise';

interface ClickableWordProps {
  word: string;
  wordTranslations?: WordTranslations | null;
}

export const ClickableWord = ({ word, wordTranslations }: ClickableWordProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Clean the word to match translation keys (lowercase, no punctuation)
  const cleanWord = word.replace(/[.,!?;:"""()[\]{}]/g, '').toLowerCase();
  
  // Get translation from pre-stored translations
  const translation = wordTranslations?.[cleanWord] || null;

  // If no translation available, render as plain text
  if (!translation) {
    return <span>{word}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <span 
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer border-b border-dotted border-primary/40 hover:border-primary hover:text-primary transition-colors"
          >
            {word}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
          <span className="text-sm font-medium">{translation}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
