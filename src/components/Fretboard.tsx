"use client";

import { CHROMATIC_NOTES, ScaleDefinition, stepLabel } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { soundEngine } from "@/lib/audio-engine";

interface FretboardProps {
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  labelMode: LabelMode;
  scale: ScaleDefinition | null;
  onTriggerMidi: (midi: number) => void;
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
  labelMode,
  scale,
  onTriggerMidi,
}: FretboardProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[40rem]">
        <div className="grid grid-cols-[2.25rem_repeat(13,minmax(0,1fr))] gap-px">
          <div />
          {Array.from({ length: FRETS + 1 }, (_, fret) => (
            <div key={fret} className="pb-1 text-center text-[10px] font-mono text-foreground/55">
              {fret}
              {INLAYS.has(fret) && (
                <span className="mx-auto mt-0.5 block size-1.5 rounded-full bg-black" />
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
              labelMode={labelMode}
              scale={scale}
              onTriggerMidi={onTriggerMidi}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StringRow({
  string,
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  labelMode,
  scale,
  onTriggerMidi,
}: {
  string: { name: string; open: number };
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  labelMode: LabelMode;
  scale: ScaleDefinition | null;
  onTriggerMidi: (midi: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-center font-heading text-xs">{string.name}</div>
      {Array.from({ length: FRETS + 1 }, (_, fret) => {
        const midi = string.open + fret;
        const pc = midi % 12;
        const lit = highlightedPitchClasses.includes(pc) || activeMidis.includes(midi);
        const isRoot = pc === rootPc;
        const label =
          labelMode === "notes" ? CHROMATIC_NOTES[pc] : stepLabel(pc, rootPc, scale);
        const showLabel = lit || fret === 0 || isRoot;
        return (
          <button
            key={fret}
            aria-label={`${string.name} string fret ${fret}, ${CHROMATIC_NOTES[pc]}`}
            onClick={() => {
              soundEngine.unlock();
              onTriggerMidi(midi);
            }}
            className={`relative h-9 border-y border-black/70 cursor-pointer ${
              fret === 0 ? "border-r-4 border-r-black bg-neutral-100" : "border-r border-r-black/40 bg-[#f4e2b0]"
            }`}
          >
            <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/80" />
            {showLabel && (
              <span
                className={`relative z-10 inline-flex min-w-5 items-center justify-center rounded-full border border-black px-1 text-[10px] font-heading leading-none ${
                  lit ? "bg-main text-black" : "bg-white/90 text-black"
                } ${isRoot ? "ring-2 ring-black" : ""}`}
              >
                {label}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}
