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
import { useChordGesture } from "@/lib/chord-gesture";
import { spellMidi } from "@/lib/notation";
import { playedColor } from "@/lib/note-colors";

interface InteractiveKeyboardProps {
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  soundColors?: Record<number, string>;
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onToggleMidi: (midi: number) => void;
  onAddMidis: (midis: number[]) => void;
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
  soundColors,
  labelMode,
  onLabelModeChange,
  scale,
  onToggleMidi,
  onAddMidis,
  onSelectRoot,
  onHearShape,
  bare = false,
}: InteractiveKeyboardProps) {
  const gesture = useChordGesture(onToggleMidi, onAddMidis);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const midi = KEY_BINDINGS[event.key.toLowerCase()];
      if (midi === undefined) return;
      soundEngine.unlock();
      gesture.keyDown(event.key.toLowerCase(), midi);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const midi = KEY_BINDINGS[event.key.toLowerCase()];
      if (midi === undefined) return;
      gesture.keyUp(event.key.toLowerCase(), midi);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gesture]);

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

  const pressKey = (event: React.PointerEvent<HTMLButtonElement>, midi: number) => {
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A click without an active pointer still plays the note.
    }
    soundEngine.unlock();
    gesture.pointerDown(event.pointerId, midi);
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
                    onAddMidis([60 + pc]);
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

      <div className="relative h-44 w-full select-none overflow-hidden rounded-base border-2 border-border bg-neutral-950 p-1 sm:h-52">
        <div className="relative flex h-full w-full">
          {whiteKeys.map((key) => {
            const isHighlighted = highlightedPitchClasses.includes(key.pc);
            const isActive = activeMidis.includes(key.midi);
            const isRoot = key.pc === rootPc;
            return (
              <button
                key={key.midi}
                type="button"
                aria-pressed={isActive}
                aria-label={`${spellMidi(key.midi).name}, step ${stepLabel(key.pc, rootPc, scale)}`}
                onPointerDown={(event) => pressKey(event, key.midi)}
                onPointerUp={(event) => gesture.pointerUp(event.pointerId, key.midi)}
                onPointerCancel={(event) => gesture.pointerCancel(event.pointerId)}
                className={`relative flex h-full flex-1 touch-manipulation flex-col items-center justify-end border-r border-black/80 pb-2 last:border-r-0 cursor-pointer ${
                  isActive ? "translate-y-0.5" : ""
                }`}
                style={{
                  backgroundColor: isActive
                    ? playedColor(soundColors?.[key.midi])
                    : isHighlighted
                      ? "color-mix(in srgb, var(--main) 55%, white)"
                      : "#ffffff",
                }}
              >
                {isRoot && (
                  <span className="absolute inset-x-0 top-0 h-1.5 bg-black" />
                )}
                <span className="font-heading text-xs text-black sm:text-sm">
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
                type="button"
                aria-pressed={isActive}
                aria-label={`${spellMidi(key.midi).name}, step ${stepLabel(key.pc, rootPc, scale)}`}
                onPointerDown={(event) => pressKey(event, key.midi)}
                onPointerUp={(event) => gesture.pointerUp(event.pointerId, key.midi)}
                onPointerCancel={(event) => gesture.pointerCancel(event.pointerId)}
                style={{
                  left: `${key.leftPercent}%`,
                  width: "3.5%",
                  backgroundColor: isActive
                    ? playedColor(soundColors?.[key.midi])
                    : isHighlighted
                      ? "color-mix(in srgb, var(--main) 72%, #161616)"
                      : "#161616",
                }}
                className={`absolute top-0 z-10 flex h-[46%] touch-manipulation flex-col items-center justify-end rounded-b-base border-2 border-black pb-1 cursor-pointer ${
                  isActive ? "translate-y-0.5 text-black" : lit ? "text-black" : "text-white"
                }`}
              >
                {isRoot && (
                  <span className="absolute inset-x-0 top-0 h-1 bg-black" />
                )}
                <span className="font-heading text-[10px] leading-none sm:text-[11px]">
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
        Letter keys A through L play along. Hold more than one for a chord.
      </p>
      )}
    </section>
  );
}
