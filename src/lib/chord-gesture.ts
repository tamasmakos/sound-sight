"use client";

import React from "react";

/**
 * A note sounds and is drawn only while its pointer or key is down.
 * Two pointers on one key share a hold; the note lifts when the last one lifts.
 */
export function useChordGesture(
  onPress: (midi: number) => void,
  onRelease: (midi: number) => void
) {
  const pointers = React.useRef(new Map<number, number>());
  const keys = React.useRef(new Map<string, number>());

  const pointerDown = React.useCallback(
    (id: number, midi: number) => {
      if (pointers.current.has(id)) return;
      pointers.current.set(id, midi);
      onPress(midi);
    },
    [onPress]
  );

  const pointerUp = React.useCallback(
    (id: number) => {
      const midi = pointers.current.get(id);
      if (midi === undefined) return;
      pointers.current.delete(id);
      onRelease(midi);
    },
    [onRelease]
  );

  const keyDown = React.useCallback(
    (code: string, midi: number) => {
      if (keys.current.has(code)) return;
      keys.current.set(code, midi);
      onPress(midi);
    },
    [onPress]
  );

  const keyUp = React.useCallback(
    (code: string) => {
      const midi = keys.current.get(code);
      if (midi === undefined) return;
      keys.current.delete(code);
      onRelease(midi);
    },
    [onRelease]
  );

  return React.useMemo(
    () => ({ pointerDown, pointerUp, pointerCancel: pointerUp, keyDown, keyUp }),
    [pointerDown, pointerUp, keyDown, keyUp]
  );
}
