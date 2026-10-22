"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  PITCH_COLORS,
  midiToFreq,
  midiToNoteLabel,
} from "@/lib/music-theory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles } from "lucide-react";

interface InteractiveKeyboardProps {
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  onTriggerMidi: (midi: number) => void;
  onSelectRoot: (pc: number) => void;
  onStrumHighlighted: () => void;
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.65,
  3: 1.72,
  6: 3.62,
  8: 4.68,
  10: 5.75,
};

// Computer keyboard bindings for C4 to E5
const KEY_BINDINGS: Record<string, number> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5
  l: 74, // D5
  p: 75, // D#5
  ";": 76, // E5
};

const MIDI_TO_SHORTCUT: Record<number, string> = Object.entries(
  KEY_BINDINGS
).reduce(
  (acc, [k, v]) => {
    acc[v] = k.toUpperCase();
    return acc;
  },
  {} as Record<number, string>
);

export function InteractiveKeyboard({
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  onTriggerMidi,
  onSelectRoot,
  onStrumHighlighted,
}: InteractiveKeyboardProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const midi = KEY_BINDINGS[e.key.toLowerCase()];
      if (midi !== undefined) {
        onTriggerMidi(midi);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTriggerMidi]);

  // Build 2 octaves: C4 (60) to B5 (83) + C6 (84)
  const octaves = [4, 5];
  const whiteKeys: { midi: number; pc: number; label: string }[] = [];
  const blackKeys: {
    midi: number;
    pc: number;
    label: string;
    leftPercent: number;
  }[] = [];

  const totalWhiteCount = 15; // 7 * 2 + 1 (C6)

  octaves.forEach((oct, octIdx) => {
    const baseMidi = (oct + 1) * 12;
    WHITE_SEMITONES.forEach((semi) => {
      const midi = baseMidi + semi;
      const pc = semi % 12;
      whiteKeys.push({
        midi,
        pc,
        label: `${CHROMATIC_NOTES[pc]}${oct}`,
      });
    });

    Object.entries(BLACK_KEY_OFFSETS).forEach(([semiStr, whiteOffset]) => {
      const semi = Number(semiStr);
      const midi = baseMidi + semi;
      const pc = semi % 12;
      const globalWhiteSlot = octIdx * 7 + whiteOffset;
      const leftPercent = ((globalWhiteSlot + 0.12) / totalWhiteCount) * 100;
      blackKeys.push({
        midi,
        pc,
        label: `${CHROMATIC_NOTES[pc]}${oct}`,
        leftPercent,
      });
    });
  });

  // Add top C6
  whiteKeys.push({
    midi: 84,
    pc: 0,
    label: "C6",
  });

  const lastMidi = activeMidis[activeMidis.length - 1] ?? 60 + rootPc;

  return (
    <div className="rounded-base border-2 border-border bg-secondary-background shadow-shadow p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-black text-white border-black font-mono text-xs px-2.5 py-1">
            SYNTHESIS DECK // C4 – C6
          </Badge>
          <span className="text-xs sm:text-sm font-base text-foreground/80">
            Click keys or type{" "}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-main border-2 border-border rounded-base">
              A S D F G H J K L
            </kbd>{" "}
            to play live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-base border-2 border-border bg-background px-2.5 py-1 text-xs font-mono">
            <span className="font-bold">LAST NOTE:</span>
            <span
              className="px-1.5 py-0.5 rounded-base border border-border font-bold"
              style={{ backgroundColor: PITCH_COLORS[lastMidi % 12] }}
            >
              {midiToNoteLabel(lastMidi)}
            </span>
            <span>{midiToFreq(lastMidi).toFixed(1)} Hz</span>
          </div>

          <Button size="xs" onClick={onStrumHighlighted}>
            <Volume2 className="size-3.5" />
            Play Active Shape
          </Button>
        </div>
      </div>

      {/* Root Pitch Quick Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar">
        <span className="text-xs font-heading uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Sparkles className="size-3.5" /> Root Key:
        </span>
        {CHROMATIC_NOTES.map((note, pc) => {
          const isRoot = rootPc === pc;
          const isInHighlight = highlightedPitchClasses.includes(pc);
          return (
            <button
              key={note}
              onClick={() => {
                onSelectRoot(pc);
                onTriggerMidi(60 + pc);
              }}
              className={`px-2.5 py-1 rounded-base border-2 border-border text-xs font-heading transition-all cursor-pointer shrink-0 ${
                isRoot
                  ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                  : "shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              }`}
              style={{
                backgroundColor: isRoot
                  ? PITCH_COLORS[pc]
                  : isInHighlight
                    ? `${PITCH_COLORS[pc]}55`
                    : "#ffffff",
              }}
            >
              {note}
              {isRoot && " ★"}
            </button>
          );
        })}
      </div>

      {/* Piano Keyboard */}
      <div className="relative h-36 sm:h-44 w-full select-none overflow-hidden rounded-base border-2 border-border bg-black p-1">
        <div className="relative flex h-full w-full">
          {whiteKeys.map((key) => {
            const isHighlighted = highlightedPitchClasses.includes(key.pc);
            const isActive = activeMidis.includes(key.midi);
            const isRoot = key.pc === rootPc;
            const shortcut = MIDI_TO_SHORTCUT[key.midi];
            const color = PITCH_COLORS[key.pc];

            return (
              <button
                key={key.midi}
                onMouseDown={() => onTriggerMidi(key.midi)}
                className={`relative flex-1 h-full border-r-2 last:border-r-0 border-black flex flex-col justify-between items-center pb-2 pt-1.5 transition-transform cursor-pointer ${
                  isActive ? "translate-y-1" : "hover:bg-neutral-100"
                }`}
                style={{
                  backgroundColor: isActive
                    ? color
                    : isHighlighted
                      ? `${color}66`
                      : "#FFFFFF",
                }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  {shortcut && (
                    <span className="text-[10px] font-mono px-1 rounded border border-black/40 bg-white/80 text-black">
                      {shortcut}
                    </span>
                  )}
                  {isRoot && (
                    <span className="text-[9px] font-heading px-1 rounded bg-black text-white">
                      ROOT
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  {isHighlighted && (
                    <span
                      className="size-3 rounded-full border-2 border-black"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span className="text-[11px] font-heading text-black">
                    {key.label}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Black Keys Overlay */}
          {blackKeys.map((key) => {
            const isHighlighted = highlightedPitchClasses.includes(key.pc);
            const isActive = activeMidis.includes(key.midi);
            const isRoot = key.pc === rootPc;
            const shortcut = MIDI_TO_SHORTCUT[key.midi];
            const color = PITCH_COLORS[key.pc];

            return (
              <button
                key={key.midi}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onTriggerMidi(key.midi);
                }}
                style={{
                  left: `${key.leftPercent}%`,
                  width: "4.4%",
                  backgroundColor: isActive
                    ? color
                    : isHighlighted
                      ? color
                      : "#141414",
                }}
                className={`absolute top-0 h-[62%] z-10 rounded-b-base border-2 border-black shadow-[2px_3px_0px_0px_rgba(0,0,0,0.85)] flex flex-col justify-between items-center py-1.5 transition-transform cursor-pointer ${
                  isActive ? "translate-y-1" : ""
                } ${
                  isHighlighted || isActive ? "text-black" : "text-white"
                }`}
              >
                {shortcut ? (
                  <span className="text-[9px] font-mono opacity-80">
                    {shortcut}
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex flex-col items-center gap-0.5">
                  {isRoot && (
                    <span className="text-[8px] font-heading px-1 rounded bg-black text-[#FACC00]">
                      R
                    </span>
                  )}
                  <span className="text-[9px] font-heading leading-none">
                    {CHROMATIC_NOTES[key.pc]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
