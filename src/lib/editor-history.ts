import { useRef, useState } from "react";

interface HistoryEntry<T> {
  snapshot: T;
  label?: string;
}

interface HistoryState {
  past: number;
  future: number;
  undoLabel: string | null;
  redoLabel: string | null;
  recentLabels: string[];
}

interface HistoryResult<T> {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  recentLabels: string[];
  undo: (current: T) => HistoryEntry<T> | null;
  redo: (current: T) => HistoryEntry<T> | null;
  record: (current: T, label?: string) => void;
  clear: () => void;
}

export function useEditorHistory<T>(limit = 120): HistoryResult<T> {
  const pastRef = useRef<HistoryEntry<T>[]>([]);
  const futureRef = useRef<HistoryEntry<T>[]>([]);
  const [state, setState] = useState<HistoryState>({
    past: 0,
    future: 0,
    undoLabel: null,
    redoLabel: null,
    recentLabels: [],
  });

  const syncState = () => {
    const undoLabel = pastRef.current.at(-1)?.label ?? null;
    const redoLabel = futureRef.current[0]?.label ?? null;
    const recentLabels = pastRef.current
      .map((entry) => entry.label)
      .filter((label): label is string => Boolean(label))
      .slice(-4)
      .reverse();

    setState({
      past: pastRef.current.length,
      future: futureRef.current.length,
      undoLabel,
      redoLabel,
      recentLabels,
    });
  };

  const record = (current: T, label?: string) => {
    pastRef.current = [...pastRef.current, { snapshot: current, label }].slice(-limit);
    futureRef.current = [];
    syncState();
  };

  const undo = (current: T) => {
    const previous = pastRef.current.pop();
    if (!previous) return null;

    futureRef.current = [{ snapshot: current, label: previous.label }, ...futureRef.current].slice(0, limit);
    syncState();
    return previous;
  };

  const redo = (current: T) => {
    const next = futureRef.current.shift();
    if (!next) return null;

    pastRef.current = [...pastRef.current, { snapshot: current, label: next.label }].slice(-limit);
    syncState();
    return next;
  };

  const clear = () => {
    pastRef.current = [];
    futureRef.current = [];
    syncState();
  };

  return {
    canUndo: state.past > 0,
    canRedo: state.future > 0,
    undoLabel: state.undoLabel,
    redoLabel: state.redoLabel,
    recentLabels: state.recentLabels,
    undo,
    redo,
    record,
    clear,
  };
}
