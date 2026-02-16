import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Exercise } from '@/types/exercise';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface WordSearchProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, selectedAnswer: string, penalty?: number) => void;
  onPenalty: (points: number) => void;
}

type Direction = [number, number];

const DIRECTIONS: Direction[] = [
  [0, 1],   // right
  [1, 0],   // down
  [0, -1],  // left
  [-1, 0],  // up
  [1, 1],   // down-right
  [1, -1],  // down-left
  [-1, 1],  // up-right
  [-1, -1], // up-left
];

const GERMAN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';

function generateGrid(word: string, gridSize: number): { grid: string[][]; wordPositions: Set<string> } {
  // Remove spaces for placement — treat multi-word answers as a single string
  const lettersOnly = word.toUpperCase().replace(/\s/g, '');
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  const wordPositions = new Set<string>();

  let placed = false;
  const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

  for (const [dr, dc] of shuffledDirs) {
    if (placed) break;

    const maxRow = dr === 0 ? gridSize - 1 : (dr > 0 ? gridSize - lettersOnly.length : lettersOnly.length - 1);
    const maxCol = dc === 0 ? gridSize - 1 : (dc > 0 ? gridSize - lettersOnly.length : lettersOnly.length - 1);
    const minRow = dr === 0 ? 0 : (dr > 0 ? 0 : lettersOnly.length - 1);
    const minCol = dc === 0 ? 0 : (dc > 0 ? 0 : lettersOnly.length - 1);

    if (minRow > maxRow || minCol > maxCol) continue;

    const startRow = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
    const startCol = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

    let fits = true;
    for (let i = 0; i < lettersOnly.length; i++) {
      const r = startRow + dr * i;
      const c = startCol + dc * i;
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { fits = false; break; }
      if (grid[r][c] !== '' && grid[r][c] !== lettersOnly[i]) { fits = false; break; }
    }

    if (fits) {
      for (let i = 0; i < lettersOnly.length; i++) {
        const r = startRow + dr * i;
        const c = startCol + dc * i;
        grid[r][c] = lettersOnly[i];
        wordPositions.add(`${r}-${c}`);
      }
      placed = true;
    }
  }

  // Fill remaining cells with random letters (no spaces — everything looks uniform)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = GERMAN_LETTERS[Math.floor(Math.random() * GERMAN_LETTERS.length)];
      }
    }
  }

  return { grid, wordPositions };
}

export const WordSearch = ({ exercise, onAnswer, onPenalty }: WordSearchProps) => {
  const { t } = useLanguage();
  const lettersOnly = exercise.correct_answer.toUpperCase().replace(/\s/g, '');
  const gridSize = Math.max(8, Math.min(12, lettersOnly.length + 3));

  const { grid, wordPositions } = useMemo(
    () => generateGrid(exercise.correct_answer, gridSize),
    [exercise.id]
  );

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [penalty, setPenalty] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [solved, setSolved] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedCells(new Set());
    setCorrectCells(new Set());
    setWrongCells(new Set());
    setPenalty(0);
    setCompleted(false);
    setSolved(false);
    startTimeRef.current = Date.now();
  }, [exercise.id]);

  const handleSolve = useCallback(() => {
    if (completed || solved) return;
    setSolved(true);
    setCompleted(true);
    onAnswer(false, exercise.correct_answer, 0);
  }, [completed, solved, exercise.correct_answer, onAnswer]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (completed || solved) return;
    const key = `${row}-${col}`;
    if (selectedCells.has(key)) return;

    const newSelected = new Set(selectedCells);
    newSelected.add(key);
    setSelectedCells(newSelected);

    if (wordPositions.has(key)) {
      const newCorrect = new Set(correctCells);
      newCorrect.add(key);
      setCorrectCells(newCorrect);

      if (newCorrect.size === wordPositions.size) {
        setCompleted(true);
        onAnswer(true, exercise.correct_answer, penalty);
      }
    } else {
      const newWrong = new Set(wrongCells);
      newWrong.add(key);
      setWrongCells(newWrong);
      const newPenalty = penalty + 5;
      setPenalty(newPenalty);
      onPenalty(5);
    }
  }, [completed, solved, selectedCells, wordPositions, correctCells, wrongCells, penalty, exercise.correct_answer, onAnswer, onPenalty]);

  const getCellClass = (row: number, col: number) => {
    const key = `${row}-${col}`;
    if (solved) {
      // Solved: highlight word cells, gray out everything else
      if (wordPositions.has(key)) return 'bg-success text-white scale-95 ring-2 ring-success';
      return 'bg-muted/40 text-muted-foreground/30 scale-95';
    }
    if (correctCells.has(key)) return 'bg-success text-white scale-95';
    if (wrongCells.has(key)) return 'bg-destructive/20 text-destructive scale-95';
    return 'bg-card hover:bg-accent/30 cursor-pointer';
  };

  const cellSize = gridSize <= 8 ? 'w-10 h-10 text-lg' : gridSize <= 10 ? 'w-9 h-9 text-base' : 'w-8 h-8 text-sm';

  return (
    <div className="flex flex-col items-center px-4 pt-2">
      <div className="w-full max-w-2xl space-y-3">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">🔍 {t('exercise.wordSearch') || 'Sopa de Letras'}</h2>
          <p className="text-lg text-muted-foreground">{exercise.statement}</p>
          {exercise.emoji && <div className="text-5xl">{exercise.emoji}</div>}
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {t('exercise.lettersFound') || 'Letras encontradas'}: <span className="font-bold text-primary">{correctCells.size}/{wordPositions.size}</span>
          </span>
          {penalty > 0 && (
            <span className="text-destructive font-medium">-{penalty} pts</span>
          )}
        </div>

        {/* Grid */}
        <div className="flex justify-center">
          <div
            className="inline-grid gap-1"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={completed || solved || selectedCells.has(`${r}-${c}`)}
                  className={`${cellSize} rounded-lg font-bold border border-border transition-all duration-200 select-none ${getCellClass(r, c)}`}
                >
                  {letter}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Solve button */}
        {!completed && !solved && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleSolve} className="gap-2">
              <Eye className="w-4 h-4" />
              {t('exercise.solve') || 'Solucionar'}
            </Button>
          </div>
        )}

        {completed && (
          <div className="text-center">
            <p className="text-xl font-bold text-primary">
              {solved ? '👁️' : '✅'} {exercise.correct_answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
