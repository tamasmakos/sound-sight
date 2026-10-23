"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  ScaleDefinition,
  stepLabel,
} from "@/lib/music-theory";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import type { LabelMode } from "@/lib/curriculum";
import { soundEngine } from "@/lib/audio-engine";

interface InteractiveKeyboardProps {
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onTriggerMidi: (midi: number) => void;
  onSelectRoot: (pc: number) => void;
  onHearShape?: () => void;
  bare?: boolean;
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.65,
  3: 1.72,
  6: 3.62,
  8: 4.68,
  10: 5.75,
};

const KEY_BINDINGS: Record<string, number> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
  o: 73,
  l: 74,
  p: 75,
  ";": 76,
};

export function InteractiveKeyboard({
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  labelMode,
  onLabelModeChange,
  scale,
  onTriggerMidi,
  onSelectRoot,
  onHearShape,
  bare = false,
}: InteractiveKeyboardProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const midi = KEY_BINDINGS[event.key.toLowerCase()];
      if (midi !== undefined) onTriggerMidi(midi);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTriggerMidi]);

  const octaves = [4, 5];
  const whiteKeys: { midi: number; pc: number }[] = [];
  const blackKeys: { midi: number; pc: number; leftPercent: number }[] = [];
  const totalWhiteCount = 15;

  octaves.forEach((oct, octIdx) => {
    const baseMidi = (oct + 1) * 12;
    WHITE_SEMITONES.forEach((semi) => {
      whiteKeys.push({ midi: baseMidi + semi, pc: semi % 12 });
    });
    Object.entries(BLACK_KEY_OFFSETS).forEach(([semiStr, whiteOffset]) => {
      const semi = Number(semiStr);
      const globalWhiteSlot = octIdx * 7 + whiteOffset;
      blackKeys.push({
        midi: baseMidi + semi,
        pc: semi % 12,
        leftPercent: ((globalWhiteSlot + 0.12) / totalWhiteCount) * 100,
      });
    });
  });

  whiteKeys.push({ midi: 84, pc: 0 });

  const labelFor = (pc: number) =>
    labelMode === "notes"
      ? CHROMATIC_NOTES[pc]
      : stepLabel(pc, rootPc, scale);

  const dimLabel = (pc: number) =>
    labelMode === "steps" &&
    highlightedPitchClasses.length > 0 &&
    !highlightedPitchClasses.includes(pc);

  const playKey = (midi: number) => {
    soundEngine.unlock();
    onTriggerMidi(midi);
  };

  return (
    <section className={bare ? "" : "rounded-base border-2 border-border bg-white p-3 shadow-shadow sm:p-4"}>
      {!bare && (
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-xs font-heading uppercase tracking-wide">
            Home
          </span>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {CHROMATIC_NOTES.map((note, pc) => {
              const isRoot = rootPc === pc;
              return (
                <button
                  key={note}
                  onClick={() => {
                    onSelectRoot(pc);
                    onTriggerMidi(60 + pc);
                  }}
                  className={`h-8 min-w-8 rounded-base border-2 border-border px-1.5 text-xs font-heading cursor-pointer shrink-0 ${
                    isRoot ? "bg-main" : "bg-white hover:bg-background"
                  }`}
                >
                  {note}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-base border-2 border-border bg-background p-0.5">
            <Button
              size="xs"
              variant={labelMode === "notes" ? "default" : "neutral"}
              className="shadow-none"
              onClick={() => onLabelModeChange("notes")}
            >
              Notes
            </Button>
            <Button
              size="xs"
              variant={labelMode === "steps" ? "default" : "neutral"}
              className="shadow-none"
              onClick={() => onLabelModeChange("steps")}
            >
              Steps
            </Button>
          </div>
          {onHearShape && (
            <Button size="sm" onClick={onHearShape}>
              <Volume2 className="size-4" />
              Hear it
            </Button>
          )}
        </div>
      </div>
      )}

      <div className="relative h-32 w-full select-none overflow-hidden rounded-base border-2 border-border bg-neutral-950 p-1 sm:h-36">
        <div className="relative flex h-full w-full">
          {whiteKeys.map((key) => {
            const isHighlighted = highlightedPitchClasses.includes(key.pc);
            const isActive = activeMidis.includes(key.midi);
            const isRoot = key.pc === rootPc;
            return (
              <button
                key={key.midi}
                aria-label={`${CHROMATIC_NOTES[key.pc]}, step ${stepLabel(key.pc, rootPc, scale)}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  playKey(key.midi);
                }}
                className={`relative flex h-full flex-1 flex-col items-center justify-end border-r border-black/80 pb-2 last:border-r-0 cursor-pointer ${
                  isActive ? "translate-y-0.5" : ""
                }`}
                style={{
                  backgroundColor: isActive
                    ? "var(--main)"
                    : isHighlighted
                      ? "color-mix(in srgb, var(--main) 55%, white)"
                      : "#ffffff",
                }}
              >
                {isRoot && (
                  <span className="absolute inset-x-0 top-0 h-1.5 bg-black" />
                )}
                <span
                  className={`font-heading text-xs sm:text-sm text-black ${
                    dimLabel(key.pc) ? "opacity-35" : ""
                  }`}
                >
                  {labelFor(key.pc)}
                </span>
              </button>
            );
          })}

          {blackKeys.map((key) => {
            const isHighlighted = highlightedPitchClasses.includes(key.pc);
            const isActive = activeMidis.includes(key.midi);
            const isRoot = key.pc === rootPc;
            const lit = isHighlighted || isActive;
            return (
              <button
                key={key.midi}
                aria-label={`${CHROMATIC_NOTES[key.pc]}, step ${stepLabel(key.pc, rootPc, scale)}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  playKey(key.midi);
                }}
                style={{
                  left: `${key.leftPercent}%`,
                  width: "4.6%",
                  backgroundColor: lit ? "var(--main)" : "#161616",
                }}
                className={`absolute top-0 z-10 flex h-[62%] flex-col items-center justify-end rounded-b-base border-2 border-black pb-1.5 cursor-pointer ${
                  isActive ? "translate-y-0.5" : ""
                } ${lit ? "text-black" : "text-white"}`}
              >
                {isRoot && (
                  <span className="absolute inset-x-0 top-0 h-1 bg-black" />
                )}
                <span
                  className={`font-heading text-[10px] leading-none sm:text-[11px] ${
                    dimLabel(key.pc) ? "opacity-40" : ""
                  }`}
                >
                  {labelFor(key.pc)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!bare && (
      <p className="mt-2 text-xs text-foreground/65">
        {labelMode === "steps"
          ? `Steps count from ${CHROMATIC_NOTES[rootPc]}. 1 is home. The black bar marks home on the keys.`
          : "Letter names. The same letter returns one octave higher."}{" "}
        Letter keys A through L play along.
      </p>
      )}
    </section>
  );
}
