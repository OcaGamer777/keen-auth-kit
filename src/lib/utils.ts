import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Shuffles an array of items with a 'type' property, avoiding consecutive items of the same type when possible.
 * Falls back to regular shuffle if no valid arrangement can be found.
 */
export function shuffleAvoidingConsecutiveTypes<T extends { type: string }>(array: T[]): T[] {
  if (array.length <= 1) return [...array];
  
  // First, do a regular shuffle to randomize
  const shuffled = shuffle(array);
  
  // Group by type
  const byType: Map<string, T[]> = new Map();
  for (const item of shuffled) {
    const list = byType.get(item.type) || [];
    list.push(item);
    byType.set(item.type, list);
  }
  
  // Check if it's possible to avoid consecutive types
  // It's impossible if any single type has more than ceil(n/2) items
  const maxAllowed = Math.ceil(array.length / 2);
  let canAvoid = true;
  for (const [, items] of byType) {
    if (items.length > maxAllowed) {
      canAvoid = false;
      break;
    }
  }
  
  if (!canAvoid) {
    // Impossible to avoid consecutive types, return regular shuffle
    return shuffled;
  }
  
  // Build result by picking from types that differ from the last one
  const result: T[] = [];
  const remaining = new Map(byType);
  
  while (result.length < array.length) {
    const lastType = result.length > 0 ? result[result.length - 1].type : null;
    
    // Find available types (not the same as last, and with items remaining)
    const availableTypes = Array.from(remaining.entries())
      .filter(([type, items]) => type !== lastType && items.length > 0)
      .sort((a, b) => b[1].length - a[1].length); // Prioritize types with more items
    
    if (availableTypes.length > 0) {
      // Pick from the type with most remaining items (greedy approach)
      const [chosenType, items] = availableTypes[0];
      result.push(items.shift()!);
      if (items.length === 0) {
        remaining.delete(chosenType);
      }
    } else {
      // No different type available, we have to pick from the same type
      const sameTypeItems = remaining.get(lastType!);
      if (sameTypeItems && sameTypeItems.length > 0) {
        result.push(sameTypeItems.shift()!);
        if (sameTypeItems.length === 0) {
          remaining.delete(lastType!);
        }
      } else {
        // Should not happen, but safety fallback
        break;
      }
    }
  }
  
  return result;
}
