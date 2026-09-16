import { useCallback, useRef, useState } from 'react';

// A small undo/redo stack around a single piece of state. Every call to
// `set` pushes the *previous* value onto the past stack and clears the
// future stack (a fresh edit after undoing invalidates the redone branch,
// same as any standard undo model). `set` accepts either a value or an
// updater function, mirroring useState.
export function useUndoableState(initial) {
  const [present, setPresent] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const [, forceRender] = useState(0);

  const set = useCallback((updater) => {
    setPresent((current) => {
      const value = typeof updater === 'function' ? updater(current) : updater;
      past.current.push(current);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
      return value;
    });
  }, []);

  // Replaces the current value without touching the history stacks — used
  // when loading/reloading a song, where "undo" shouldn't step back to a
  // different song.
  const reset = useCallback((value) => {
    past.current = [];
    future.current = [];
    setPresent(value);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setPresent((current) => {
      const previous = past.current.pop();
      future.current.push(current);
      return previous;
    });
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setPresent((current) => {
      const next = future.current.pop();
      past.current.push(current);
      return next;
    });
    forceRender((n) => n + 1);
  }, []);

  return {
    value: present,
    set,
    reset,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
