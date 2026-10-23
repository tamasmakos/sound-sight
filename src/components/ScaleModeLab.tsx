"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  PITCH_COLORS,
  SCALES,
  ScaleDefinition,
} from "@/lib/music-theory";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sun, Moon, Layers } from "lucide-react";

interface ScaleModeLabProps {
  rootPc: number;
  selectedScale: ScaleDefinition;
  onSelectScale: (scale: ScaleDefinition) => void;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onPlaySingleMidi: (midi: number) => void;
  embedded?: boolean;
}

const BRIGHTNESS_MODES = [
  "lydian",
  "ionian",
  "mixolydian",
  "dorian",
  "aeolian",
  "phrygian",
  "locrian",
];

export function ScaleModeLab({
  rootPc,
  selectedScale,
  onSelectScale,
  onPlayNotes,
  onPlaySingleMidi,
  embedded = false,
}: ScaleModeLabProps) {
  const [activeStepIndex, setActiveStepIndex] = React.useState<number | null>(
    null
  );

  const ionianIntervals = [0, 2, 4, 5, 7, 9, 11];

  const playFullScale = (scale = selectedScale) => {
    const midis = [
      ...scale.intervals.map((semi) => 60 + rootPc + semi),
      72 + rootPc,
    ];
    midis.forEach((midi, idx) => {
      setTimeout(() => {
        setActiveStepIndex(idx);
        onPlaySingleMidi(midi);
        if (idx === midis.length - 1) {
          setTimeout(() => setActiveStepIndex(null), 320);
        }
      }, idx * 210);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Left: Brightness Slider & 12-Semitone Staircase Ruler */}
      <Card className="bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!embedded && (
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Same seven notes, a new home
                </CardTitle>
                <CardDescription className="mt-1">
                  Each step from bright to dark changes exactly one degree.
                </CardDescription>
              </div>
            )}
            <Button size="sm" onClick={() => playFullScale(selectedScale)}>
              <Play className="size-4" />
              Play {CHROMATIC_NOTES[rootPc]} {selectedScale.name}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Brightness Spectrum Strip */}
          <div className="rounded-base border-2 border-border bg-background p-3 shadow-shadow">
            <div className="flex items-center justify-between text-xs font-heading mb-2">
              <span className="flex items-center gap-1">
                <Sun className="size-4" /> Bright
              </span>
              <span className="flex items-center gap-1">
                Dark <Moon className="size-4" />
              </span>
            </div>

            <div className="overflow-x-auto">
            <div className="grid min-w-[42rem] grid-cols-7 gap-1.5">
              {BRIGHTNESS_MODES.map((modeId) => {
                const mode = SCALES.find((s) => s.id === modeId)!;
                const isSelected = selectedScale.id === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onSelectScale(mode);
                      playFullScale(mode);
                    }}
                    className={`p-2 rounded-base border-2 border-border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-main translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                        : "bg-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-1 rounded bg-black text-white">
                        {mode.brightness > 0
                          ? `+${mode.brightness}`
                          : mode.brightness}
                      </span>
                    </div>
                    <div className="font-heading text-xs mt-1.5 leading-tight">
                      {mode.name.replace(" Mode", "").replace(" (Ionian)", "").replace(" (Aeolian)", "")}
                    </div>
                    <div className="mt-1 text-[10px] leading-tight text-foreground/75">
                      {mode.characterNote}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </div>

          {/* 12-Semitone Physical Ruler */}
          <div className="rounded-base border-2 border-border bg-white p-4 shadow-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-sm font-heading">
                12-Semitone Architecture Ruler ({CHROMATIC_NOTES[rootPc]} Root)
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span>Formula:</span>
                {selectedScale.stepPattern.map((step, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded border border-black font-bold ${
                      step === "H"
                        ? "bg-[#FF4D50] text-white"
                        : step === "WH"
                          ? "bg-[#C084FC] text-black"
                          : "bg-[#FACC00] text-black"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-13 gap-1">
              {Array.from({ length: 13 }, (_, semi) => {
                const pc = (rootPc + semi) % 12;
                const scaleDegIndex = selectedScale.intervals.indexOf(
                  semi === 12 ? 0 : semi
                );
                const isInScale = scaleDegIndex !== -1;
                const isRootOrOctave = semi === 0 || semi === 12;
                const isStepPlaying =
                  (activeStepIndex !== null &&
                    selectedScale.intervals[activeStepIndex] === semi) ||
                  (activeStepIndex === selectedScale.intervals.length &&
                    semi === 12);

                return (
                  <button
                    key={semi}
                    onClick={() => onPlaySingleMidi(60 + rootPc + semi)}
                    className={`h-28 rounded-base border-2 border-border flex flex-col justify-between items-center p-1.5 transition-all cursor-pointer ${
                      isStepPlaying
                        ? "scale-105 ring-2 ring-black"
                        : isInScale
                          ? "shadow-[2px_2px_0px_0px_#000] hover:translate-y-0.5"
                          : "opacity-35 bg-neutral-100"
                    }`}
                    style={{
                      backgroundColor: isInScale
                        ? PITCH_COLORS[pc]
                        : undefined,
                    }}
                  >
                    <span className="font-mono text-[10px] font-bold">
                      +{semi}
                    </span>

                    <div className="flex flex-col items-center">
                      <span className="font-heading text-xs sm:text-sm">
                        {CHROMATIC_NOTES[pc]}
                      </span>
                      {isInScale && (
                        <span className="text-[10px] font-mono bg-white/90 px-1 rounded border border-black mt-0.5">
                          {semi === 12 ? "8" : `Deg ${scaleDegIndex + 1}`}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-heading uppercase">
                      {isRootOrOctave ? "ROOT" : isInScale ? "ON" : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parallel Comparison vs Major (Ionian) */}
          <div className="rounded-base border-2 border-border bg-background p-4">
            <div className="text-xs font-mono uppercase text-foreground/70">
              CHARACTER NOTE & EMOTIONAL SIGNATURE
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
              <h4 className="text-lg font-heading">
                {CHROMATIC_NOTES[rootPc]} {selectedScale.name} —{" "}
                <span className="underline decoration-2">
                  {selectedScale.mood}
                </span>
              </h4>
              <Badge className="bg-black text-white">
                Spice Note: {selectedScale.characterNote}
              </Badge>
            </div>
            <p className="text-sm mt-2 text-foreground/85">
              {selectedScale.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right: Complete Scale Library & Parallel Difference Matrix */}
      <Card>
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="size-5" />
            Scale & Mode Explorer + Parallel Comparison
          </CardTitle>
          <CardDescription>
            Compare any scale directly against {CHROMATIC_NOTES[rootPc]} Major to see which degrees are raised or lowered.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {SCALES.map((scale) => {
            const isSelected = selectedScale.id === scale.id;
            return (
              <div
                key={scale.id}
                onClick={() => {
                  onSelectScale(scale);
                  playFullScale(scale);
                }}
                className={`p-3 rounded-base border-2 border-border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-main translate-x-[2px] translate-y-[2px] shadow-none"
                    : "bg-background shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-heading text-sm sm:text-base">
                      {CHROMATIC_NOTES[rootPc]} {scale.name}
                    </span>
                    <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-black">
                      {scale.category}
                    </span>
                  </div>
                  <Button
                    size="xs"
                    variant="neutral"
                    onClick={(e) => {
                      e.stopPropagation();
                      const chordMidis = [
                        60 + rootPc + scale.intervals[0],
                        60 + rootPc + (scale.intervals[2] ?? 4),
                        60 + rootPc + (scale.intervals[4] ?? 7),
                      ];
                      onPlayNotes(chordMidis, false);
                    }}
                  >
                    Tonic Triad
                  </Button>
                </div>

                {/* Note pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scale.intervals.map((semi, idx) => {
                    const pc = (rootPc + semi) % 12;
                    const diffFromMajor =
                      scale.intervals.length === 7
                        ? semi - ionianIntervals[idx]
                        : 0;
                    return (
                      <span
                        key={semi}
                        className="px-2 py-0.5 rounded border-2 border-black text-xs font-heading flex items-center gap-1"
                        style={{ backgroundColor: PITCH_COLORS[pc] }}
                      >
                        {CHROMATIC_NOTES[pc]}
                        {diffFromMajor !== 0 && (
                          <span className="text-[10px] font-mono bg-black text-white px-1 rounded">
                            {diffFromMajor > 0 ? "♯" : "♭"}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
