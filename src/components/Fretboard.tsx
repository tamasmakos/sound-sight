"use client";

import { CHROMATIC_NOTES, ScaleDefinition, stepLabel } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { soundEngine } from "@/lib/audio-engine";
import { useChordGesture } from "@/lib/chord-gesture";

interface FretboardProps {
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  cursorMidi?: number;
  labelMode: LabelMode;
  scale: ScaleDefinition | null;
  onToggleMidi: (midi: number) => void;
  onAddMidis: (midis: number[]) => void;
}

const STRINGS: { name: string; open: number }[] = [
  { name: "e", open: 64 },
  { name: "B", open: 59 },
  { name: "G", open: 55 },
  { name: "D", open: 50 },
  { name: "A", open: 45 },
  { name: "E", open: 40 },
];

const FRETS = 12;
const INLAYS = new Set([3, 5, 7, 9, 12]);

export function Fretboard({
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  cursorMidi,
  labelMode,
  scale,
  onToggleMidi,
  onAddMidis,
}: FretboardProps) {
  const gesture = useChordGesture(onToggleMidi, onAddMidis);

  return (
    <div className="w-full min-w-0 select-none overflow-x-auto overscroll-x-contain">
      <div className="grid w-max min-w-full grid-cols-[1.75rem_repeat(13,minmax(2.75rem,1fr))] gap-px">
        <div />
        {Array.from({ length: FRETS + 1 }, (_, fret) => (
          <div
            key={fret}
            className="pb-0.5 text-center font-mono text-[9px] leading-none text-foreground/55 sm:text-[10px]"
          >
            {fret}
            {INLAYS.has(fret) && (
              <span className="mx-auto mt-0.5 block size-1 rounded-full bg-black" />
            )}
          </div>
        ))}
        {STRINGS.map((string) => (
          <StringRow
            key={string.open}
            string={string}
            rootPc={rootPc}
            highlightedPitchClasses={highlightedPitchClasses}
            activeMidis={activeMidis}
            cursorMidi={cursorMidi}
            labelMode={labelMode}
            scale={scale}
            onPointerDown={gesture.pointerDown}
            onPointerUp={gesture.pointerUp}
            onPointerCancel={gesture.pointerCancel}
          />
        ))}
      </div>
    </div>
  );
}

function StringRow({
  string,
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  cursorMidi,
  labelMode,
  scale,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: {
  string: { name: string; open: number };
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  cursorMidi?: number;
  labelMode: LabelMode;
  scale: ScaleDefinition | null;
  onPointerDown: (id: number, midi: number) => void;
  onPointerUp: (id: number, midi: number) => void;
  onPointerCancel: (id: number) => void;
}) {
  return (
    <>
      <div className="flex min-w-0 items-center justify-center font-heading text-[11px] sm:text-xs">
        {string.name}
      </div>
      {Array.from({ length: FRETS + 1 }, (_, fret) => {
        const midi = string.open + fret;
        const pc = midi % 12;
        const isActive = activeMidis.includes(midi);
        const isHighlighted = highlightedPitchClasses.includes(pc);
        const isRoot = pc === rootPc;
        const isCursor = cursorMidi === midi;
        const label =
          labelMode === "notes" ? CHROMATIC_NOTES[pc] : stepLabel(pc, rootPc, scale);
        return (
          <button
            key={fret}
            type="button"
            aria-label={`${string.name} string fret ${fret}, ${CHROMATIC_NOTES[pc]}`}
            aria-pressed={isActive}
            onPointerDown={(event) => {
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                // A click without an active pointer still plays the note.
              }
              soundEngine.unlock();
              onPointerDown(event.pointerId, midi);
            }}
            onPointerUp={(event) => onPointerUp(event.pointerId, midi)}
            onPointerCancel={(event) => onPointerCancel(event.pointerId)}
            style={{
              backgroundColor: isActive
                ? "var(--main)"
                : isHighlighted
                  ? "color-mix(in srgb, var(--main) 55%, white)"
                  : fret === 0
                    ? "#f4f4f4"
                    : "#fffdf6",
            }}
            className={`relative flex h-12 min-w-0 items-center justify-center overflow-hidden border-y border-black/70 touch-manipulation cursor-pointer sm:h-11 ${
              fret === 0 ? "border-r-[3px] border-r-black" : "border-r border-r-black/35"
            } ${isCursor ? "ring-2 ring-inset ring-black" : ""}`}
          >
            <span className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/70" />
            {isRoot && <span className="absolute inset-x-0 top-0 h-1 bg-black" />}
            <span className="relative z-10 font-heading text-xs leading-none text-black">
              {label}
            </span>
          </button>
        );
      })}
    </>
  );
}
