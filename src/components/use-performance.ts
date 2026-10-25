"use client";

import React from "react";
import { soundEngine } from "@/lib/audio-engine";
import { noteColor } from "@/lib/note-colors";

export interface VoicedNote {
  midi: number;
  color: string;
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
  const [taps, setTaps] = React.useState<number[]>([]);
  const [answered, setAnswered] = React.useState<number[]>([]);
  const voicesRef = React.useRef<VoicedNote[]>([]);
  const holdCounts = React.useRef(new Map<number, number>());
  const colorTick = React.useRef(0);

  const activeMidis = voices.map((note) => note.midi);
  const soundColors = React.useMemo(() => {
    const colors: Record<number, string> = {};
    for (const note of voices) colors[note.midi] = note.color;
    return colors;
  }, [voices]);

  const takeColor = React.useCallback((used?: Set<string>) => {
    const taken = used ?? new Set(voicesRef.current.map((note) => note.color));
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const color = noteColor(colorTick.current);
      colorTick.current += 1;
      if (!taken.has(color)) {
        taken.add(color);
        return color;
      }
    }
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

  const remember = React.useCallback((notes: VoicedNote[]) => {
    if (notes.length === 0) return;
    setAnswered(notes.map((note) => note.midi));
  }, []);

  const press = React.useCallback(
    (midi: number) => {
      const count = holdCounts.current.get(midi) ?? 0;
      holdCounts.current.set(midi, count + 1);
      if (count > 0) return;
      const next = [...voicesRef.current, { midi, color: takeColor() }];
      commit(next);
      setTaps((log) => [...log, midi]);
      remember(next);
      play([midi]);
    },
    [commit, play, remember, takeColor]
  );

  const release = React.useCallback(
    (midi: number) => {
      const count = (holdCounts.current.get(midi) ?? 0) - 1;
      if (count > 0) {
        holdCounts.current.set(midi, count);
        return;
      }
      holdCounts.current.delete(midi);
      if (!voicesRef.current.some((note) => note.midi === midi)) return;
      commit(voicesRef.current.filter((note) => note.midi !== midi));
    },
    [commit]
  );

  const releaseAll = React.useCallback(() => {
    holdCounts.current.clear();
    commit([]);
  }, [commit]);

  /** Hear a figure without coloring the keys or writing it as a held chord. */
  const playFigure = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      play(midis, arpeggiate);
    },
    [play]
  );

  const clearChord = React.useCallback(() => {
    colorTick.current = 0;
    holdCounts.current.clear();
    commit([]);
    setAnswered([]);
    setTaps([]);
  }, [commit]);

  const resetTaps = React.useCallback(() => {
    setTaps([]);
  }, []);

  return {
    activeMidis,
    voices,
    soundColors,
    taps,
    answered,
    press,
    release,
    releaseAll,
    playFigure,
    clearChord,
    resetTaps,
  };
}
