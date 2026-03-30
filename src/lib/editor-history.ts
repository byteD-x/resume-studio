import { useRef, useState } from "react";

interface HistoryEntry<T> {
  snapshot: T;
  label?: string;
}

interface HistoryState {
  past: number;
  future: number;
}

interface HistoryResult<T> {
  canUndo: boolean;
  canRedo: boolean;
  undo: (current: T) => HistoryEntry<T> | null;
  redo: (current: T) => HistoryEntry<T> | null;
  record: (current: T, label?: string) => void;
  clear: () => void;
}

export function useEditorHistory<T>(limit = 120): HistoryResult<T> {
  const pastRef = useRef<HistoryEntry<T>[]>([]);
  const futureRef = useRef<HistoryEntry<T>[]>([]);
  const [counts, setCounts] = useState<HistoryState>({ past: 0, future: 0 });

  const syncCounts = () => {
    setCounts({
      past: pastRef.current.length,
      future: futureRef.current.length,
    });
  };

  const record = (current: T, label?: string) => {
    pastRef.current = [...pastRef.current, { snapshot: current, label }].slice(-limit);
    futureRef.current = [];
    syncCounts();
  };

  const undo = (current: T) => {
    const previous = pastRef.current.pop();
    if (!previous) return null;

    futureRef.current = [{ snapshot: current, label: previous.label }, ...futureRef.current].slice(0, limit);
    syncCounts();
    return previous;
  };

  const redo = (current: T) => {
    const next = futureRef.current.shift();
    if (!next) return null;

    pastRef.current = [...pastRef.current, { snapshot: current, label: next.label }].slice(-limit);
    syncCounts();
    return next;
  };

  const clear = () => {
    pastRef.current = [];
    futureRef.current = [];
    syncCounts();
  };

  return {
    canUndo: counts.past > 0,
    canRedo: counts.future > 0,
    undo,
    redo,
    record,
    clear,
  };
}
