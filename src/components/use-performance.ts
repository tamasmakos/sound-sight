"use client";

import React from "react";
import { soundEngine } from "@/lib/audio-engine";
import { noteColor } from "@/lib/note-colors";

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
  const [taps, setTaps] = React.useState<number[]>([]);
  const voicesRef = React.useRef<VoicedNote[]>([]);
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

  const replaceMidis = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      colorTick.current = 0;
      const used = new Set<string>();
      const next = uniqueSorted(midis).map((midi) => ({ midi, color: takeColor(used) }));
      commit(next);
      play(midis, arpeggiate);
    },
    [commit, play, takeColor]
  );

  const toggleMidi = React.useCallback(
    (midi: number) => {
      const current = voicesRef.current;
      const existing = current.find((note) => note.midi === midi);
      const next = existing
        ? current.filter((note) => note.midi !== midi)
        : [...current, { midi, color: takeColor() }];
      commit(next);
      setTaps((log) => [...log, midi]);
      const sounding = next.map((note) => note.midi);
      play(sounding.length > 0 ? sounding : [midi]);
    },
    [commit, play, takeColor]
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
      setTaps((log) => [...log, ...midis]);
      play(midis);
    },
    [commit, play, takeColor]
  );

  const ensureMidi = React.useCallback(
    (midi: number) => {
      if (!voicesRef.current.some((note) => note.midi === midi)) {
        commit([...voicesRef.current, { midi, color: takeColor() }]);
      }
      play([midi]);
    },
    [commit, play, takeColor]
  );

  const clearChord = React.useCallback(() => {
    colorTick.current = 0;
    commit([]);
  }, [commit]);

  const resetTaps = React.useCallback(() => {
    setTaps([]);
  }, []);

  return {
    activeMidis,
    voices,
    soundColors,
    taps,
    replaceMidis,
    toggleMidi,
    addMidis,
    ensureMidi,
    clearChord,
    resetTaps,
  };
}
