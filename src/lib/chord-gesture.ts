"use client";

import React from "react";

/**
 * One finger toggles a note when it lifts. Two or more fingers add every
 * held note and leave them sounding, so a chord can be played at once.
 */
export function useChordGesture(
  onToggle: (midi: number) => void,
  onAdd: (midis: number[]) => void
) {
  const pointers = React.useRef(new Map<number, number>());
  const keys = React.useRef(new Map<string, number>());
  const pointerChord = React.useRef(false);
  const keyChord = React.useRef(false);

  const pointerDown = React.useCallback(
    (id: number, midi: number) => {
      pointers.current.set(id, midi);
      if (pointers.current.size > 1) {
        pointerChord.current = true;
        onAdd([...new Set(pointers.current.values())]);
      }
    },
    [onAdd]
  );

  const pointerUp = React.useCallback(
    (id: number, midi: number) => {
      pointers.current.delete(id);
      if (pointers.current.size > 0) return;
      if (!pointerChord.current) onToggle(midi);
      pointerChord.current = false;
    },
    [onToggle]
  );

  const pointerCancel = React.useCallback((id: number) => {
    pointers.current.delete(id);
    if (pointers.current.size === 0) pointerChord.current = false;
  }, []);

  const keyDown = React.useCallback(
    (code: string, midi: number) => {
      if (keys.current.has(code)) return;
      keys.current.set(code, midi);
      if (keys.current.size > 1) {
        keyChord.current = true;
        onAdd([...new Set(keys.current.values())]);
      }
    },
    [onAdd]
  );

  const keyUp = React.useCallback(
    (code: string, midi: number) => {
      if (!keys.current.has(code)) return;
      keys.current.delete(code);
      if (keys.current.size > 0) return;
      if (!keyChord.current) onToggle(midi);
      keyChord.current = false;
    },
    [onToggle]
  );

  return React.useMemo(
    () => ({ pointerDown, pointerUp, pointerCancel, keyDown, keyUp }),
    [pointerDown, pointerUp, pointerCancel, keyDown, keyUp]
  );
}
