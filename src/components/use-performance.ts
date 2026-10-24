"use client";

import React from "react";
import { soundEngine } from "@/lib/audio-engine";
import { noteColor } from "@/lib/note-colors";
import { shiftDiatonic } from "@/lib/notation";

export interface VoicedNote {
  midi: number;
  color: string;
}

function uniqueSorted(midis: number[]): number[] {
  return [...new Set(midis)].sort((a, b) => a - b);
}

function sortVoices(notes: VoicedNote[]): VoicedNote[] {
  const seen = new Set<number>();
  return [...notes]
    .sort((a, b) => a.midi - b.midi)
    .filter((note) => {
      if (seen.has(note.midi)) return false;
      seen.add(note.midi);
      return true;
    });
}

export function usePerformance() {
  const [voices, setVoices] = React.useState<VoicedNote[]>([]);
  const [cursorMidi, setCursorMidiState] = React.useState(60);
  const [taps, setTaps] = React.useState<number[]>([]);
  const voicesRef = React.useRef<VoicedNote[]>([]);
  const cursorRef = React.useRef(60);
  const colorTick = React.useRef(0);

  const activeMidis = voices.map((note) => note.midi);
  const soundColors = React.useMemo(() => {
    const colors: Record<number, string> = {};
    for (const note of voices) colors[note.midi] = note.color;
    return colors;
  }, [voices]);

  const setCursorMidi = React.useCallback((midi: number) => {
    cursorRef.current = midi;
    setCursorMidiState(midi);
  }, []);

  const takeColor = React.useCallback(() => {
    const color = noteColor(colorTick.current);
    colorTick.current += 1;
    return color;
  }, []);

  const commit = React.useCallback((notes: VoicedNote[]) => {
    const next = sortVoices(notes);
    voicesRef.current = next;
    setVoices(next);
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
      colorTick.current = 0;
      const next = uniqueSorted(midis).map((midi) => ({ midi, color: takeColor() }));
      commit(next);
      if (next.length > 0) setCursorMidi(next[next.length - 1].midi);
      play(midis, arpeggiate);
    },
    [commit, play, setCursorMidi, takeColor]
  );

  const toggleMidi = React.useCallback(
    (midi: number) => {
      const current = voicesRef.current;
      const existing = current.find((note) => note.midi === midi);
      const next = existing
        ? current.filter((note) => note.midi !== midi)
        : [...current, { midi, color: takeColor() }];
      commit(next);
      setCursorMidi(midi);
      setTaps((log) => [...log, midi]);
      const sounding = next.map((note) => note.midi);
      play(sounding.length > 0 ? sounding : [midi]);
    },
    [commit, play, setCursorMidi, takeColor]
  );

  const addMidis = React.useCallback(
    (midis: number[]) => {
      if (midis.length === 0) return;
      const current = voicesRef.current;
      const next = [...current];
      for (const midi of midis) {
        if (!next.some((note) => note.midi === midi)) {
          next.push({ midi, color: takeColor() });
        }
      }
      commit(next);
      setCursorMidi(midis[midis.length - 1]);
      setTaps((log) => [...log, ...midis]);
      play(midis);
    },
    [commit, play, setCursorMidi, takeColor]
  );

  const ensureMidi = React.useCallback(
    (midi: number) => {
      if (!voicesRef.current.some((note) => note.midi === midi)) {
        commit([...voicesRef.current, { midi, color: takeColor() }]);
      }
      setCursorMidi(midi);
      play([midi]);
    },
    [commit, play, setCursorMidi, takeColor]
  );

  const clearChord = React.useCallback(() => {
    colorTick.current = 0;
    commit([]);
  }, [commit]);

  const resetTaps = React.useCallback(() => {
    setTaps([]);
  }, []);

  const stepCursor = React.useCallback(
    (delta: number, fifths = 0) => {
      const from = cursorRef.current;
      const to = shiftDiatonic(from, delta, fifths);
      const current = voicesRef.current;
      const index = current.findIndex((note) => note.midi === from);
      const blocked = current.some((note) => note.midi === to);
      if (index >= 0 && !blocked) {
        commit(current.map((note, noteIndex) => (noteIndex === index ? { ...note, midi: to } : note)));
      }
      setCursorMidi(to);
      soundEngine.unlock();
      soundEngine.playMidi(to, 0.28);
    },
    [commit, setCursorMidi]
  );

  const moveSelection = React.useCallback(
    (direction: number) => {
      const sorted = sortVoices(voicesRef.current);
      if (sorted.length === 0) return;
      const index = sorted.findIndex((note) => note.midi === cursorRef.current);
      const nextIndex =
        index < 0
          ? direction > 0
            ? 0
            : sorted.length - 1
          : (index + direction + sorted.length) % sorted.length;
      const midi = sorted[nextIndex].midi;
      setCursorMidi(midi);
      soundEngine.unlock();
      soundEngine.playMidi(midi, 0.28);
    },
    [setCursorMidi]
  );

  const addCursor = React.useCallback((fifths = 0) => {
    const midi = cursorRef.current;
    const current = voicesRef.current;
    if (!current.some((note) => note.midi === midi)) {
      commit([...current, { midi, color: takeColor() }]);
      setTaps((log) => [...log, midi]);
      play([midi]);
      return;
    }
    let next = shiftDiatonic(midi, 1, fifths);
    for (let step = 0; step < 14 && current.some((note) => note.midi === next); step += 1) {
      next = shiftDiatonic(next, 1, fifths);
    }
    if (current.some((note) => note.midi === next)) return;
    commit([...current, { midi: next, color: takeColor() }]);
    setCursorMidi(next);
    setTaps((log) => [...log, next]);
    play([next]);
  }, [commit, play, setCursorMidi, takeColor]);

  const removeCursor = React.useCallback(() => {
    const midi = cursorRef.current;
    const current = voicesRef.current;
    if (!current.some((note) => note.midi === midi)) return;
    const next = current.filter((note) => note.midi !== midi);
    commit(next);
    if (next.length === 0) return;
    const sorted = sortVoices(next);
    const neighbor = sorted.find((note) => note.midi > midi) ?? sorted[sorted.length - 1];
    setCursorMidi(neighbor.midi);
  }, [commit, setCursorMidi]);

  return {
    activeMidis,
    voices,
    soundColors,
    cursorMidi,
    taps,
    replaceMidis,
    toggleMidi,
    addMidis,
    ensureMidi,
    clearChord,
    resetTaps,
    stepCursor,
    moveSelection,
    addCursor,
    removeCursor,
    setCursorMidi,
  };
}
