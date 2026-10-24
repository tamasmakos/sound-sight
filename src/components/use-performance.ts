"use client";

import React from "react";
import { soundEngine } from "@/lib/audio-engine";
import { shiftDiatonic } from "@/lib/notation";

function uniqueSorted(midis: number[]): number[] {
  return [...new Set(midis)].sort((a, b) => a - b);
}

export function usePerformance() {
  const [activeMidis, setActiveMidis] = React.useState<number[]>([]);
  const [cursorMidi, setCursorMidiState] = React.useState(60);
  const [taps, setTaps] = React.useState<number[]>([]);
  const activeRef = React.useRef<number[]>([]);
  const cursorRef = React.useRef(60);

  const setCursorMidi = React.useCallback((midi: number) => {
    cursorRef.current = midi;
    setCursorMidiState(midi);
  }, []);

  const play = React.useCallback((midis: number[], arpeggiate = false) => {
    if (midis.length === 0) return;
    soundEngine.unlock();
    if (arpeggiate) soundEngine.playScaleSequence(midis, 0.19);
    else if (midis.length === 1) soundEngine.playMidi(midis[0], 0.5);
    else soundEngine.playChord(midis, 0.8, 0.012);
  }, []);

  const replaceMidis = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      const next = uniqueSorted(midis);
      activeRef.current = next;
      setActiveMidis(next);
      if (next.length > 0) setCursorMidi(next[next.length - 1]);
      play(midis, arpeggiate);
    },
    [play, setCursorMidi]
  );

  const toggleMidi = React.useCallback(
    (midi: number) => {
      const current = activeRef.current;
      const next = current.includes(midi)
        ? current.filter((note) => note !== midi)
        : uniqueSorted([...current, midi]);
      activeRef.current = next;
      setActiveMidis(next);
      setCursorMidi(midi);
      setTaps((log) => [...log, midi]);
      play(next.length > 0 ? next : [midi]);
    },
    [play, setCursorMidi]
  );

  const addMidis = React.useCallback(
    (midis: number[]) => {
      if (midis.length === 0) return;
      const next = uniqueSorted([...activeRef.current, ...midis]);
      activeRef.current = next;
      setActiveMidis(next);
      setCursorMidi(midis[midis.length - 1]);
      setTaps((log) => [...log, ...midis]);
      play(midis);
    },
    [play, setCursorMidi]
  );

  const ensureMidi = React.useCallback(
    (midi: number) => {
      const next = uniqueSorted([...activeRef.current, midi]);
      activeRef.current = next;
      setActiveMidis(next);
      setCursorMidi(midi);
      play([midi]);
    },
    [play, setCursorMidi]
  );

  const clearChord = React.useCallback(() => {
    activeRef.current = [];
    setActiveMidis([]);
  }, []);

  const resetTaps = React.useCallback(() => {
    setTaps([]);
  }, []);

  const stepCursor = React.useCallback(
    (delta: number) => {
      const next = shiftDiatonic(cursorRef.current, delta);
      setCursorMidi(next);
      soundEngine.unlock();
      soundEngine.playMidi(next, 0.28);
    },
    [setCursorMidi]
  );

  const addCursor = React.useCallback(() => {
    const midi = cursorMidi;
    if (activeRef.current.includes(midi)) {
      play([midi]);
      setTaps((log) => [...log, midi]);
      return;
    }
    addMidis([midi]);
  }, [addMidis, cursorMidi, play]);

  return {
    activeMidis,
    cursorMidi,
    taps,
    replaceMidis,
    toggleMidi,
    addMidis,
    ensureMidi,
    clearChord,
    resetTaps,
    stepCursor,
    addCursor,
    setCursorMidi,
  };
}
