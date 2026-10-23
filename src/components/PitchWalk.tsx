"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  MAJOR_DEGREE_LABELS,
  SCALES,
  stepLabel,
} from "@/lib/music-theory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";

const WHITE = new Set([0, 2, 4, 5, 7, 9, 11]);
const IONIAN = SCALES.find((scale) => scale.id === "ionian")!;

interface PitchWalkProps {
  kind: "keyboard" | "steps" | "major";
  rootPc: number;
  onPlayMidi: (midi: number) => void;
}

export function PitchWalk({ kind, rootPc, onPlayMidi }: PitchWalkProps) {
  if (kind === "keyboard") {
    return <OctaveStrip rootPc={rootPc} onPlayMidi={onPlayMidi} />;
  }
  if (kind === "steps") {
    return <StepRuler rootPc={rootPc} onPlayMidi={onPlayMidi} />;
  }
  return <MajorPath rootPc={rootPc} onPlayMidi={onPlayMidi} />;
}

function OctaveStrip({
  rootPc,
  onPlayMidi,
}: {
  rootPc: number;
  onPlayMidi: (midi: number) => void;
}) {
  const cells = Array.from({ length: 13 }, (_, index) => {
    const midi = 60 + rootPc + index;
    const pc = midi % 12;
    return {
      midi,
      pc,
      name: CHROMATIC_NOTES[pc],
      white: WHITE.has(pc),
      edge: index === 0 || index === 12,
    };
  });

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <p className="text-sm">
          From {CHROMATIC_NOTES[rootPc]} back to {CHROMATIC_NOTES[rootPc]} is
          twelve half steps. The letter returns. The pitch does not.
        </p>
        <div className="flex items-end gap-1 overflow-x-auto pb-1">
          {cells.map((cell) => (
            <button
              key={cell.midi}
              onClick={() => onPlayMidi(cell.midi)}
              className={`flex flex-col items-center justify-end rounded-base border-2 border-border px-1 pb-1.5 cursor-pointer shrink-0 ${
                cell.edge ? "bg-main" : cell.white ? "bg-white" : "bg-neutral-900 text-white"
              } ${cell.white || cell.edge ? "h-24 w-10" : "h-16 w-9"}`}
            >
              <span
                className={`text-[11px] font-heading leading-none ${
                  !cell.white && !cell.edge ? "text-white" : "text-black"
                }`}
              >
                {cell.name}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/70">
          The two marked keys are the same name, one octave apart. Click either
          one, then find it on the piano.
        </p>
      </CardContent>
    </Card>
  );
}

function StepRuler({
  rootPc,
  onPlayMidi,
}: {
  rootPc: number;
  onPlayMidi: (midi: number) => void;
}) {
  const stops = [
    { semi: 0, caption: "Home" },
    { semi: 1, caption: "Half step" },
    { semi: 2, caption: "Whole step" },
  ];

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {stops.map((stop) => {
            const pc = (rootPc + stop.semi) % 12;
            return (
              <button
                key={stop.semi}
                onClick={() => onPlayMidi(60 + rootPc + stop.semi)}
                className={`rounded-base border-2 border-border px-2 py-3 text-center cursor-pointer ${
                  stop.semi === 0 ? "bg-main" : "bg-white"
                }`}
              >
                <div className="text-2xl font-heading leading-none">
                  {MAJOR_DEGREE_LABELS[stop.semi]}
                </div>
                <div className="mt-1 text-[11px] font-heading uppercase tracking-wide">
                  {stop.caption}
                </div>
                <div className="mt-1 text-xs text-foreground/70">
                  {CHROMATIC_NOTES[pc]}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-heading text-foreground/70">
          <span className="h-px flex-1 bg-black" />
          two half steps make the whole step
          <span className="h-px flex-1 bg-black" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {MAJOR_DEGREE_LABELS.map((label, semi) => (
            <button
              key={label}
              onClick={() => onPlayMidi(60 + rootPc + semi)}
              className={`h-9 min-w-8 flex-1 rounded-base border-2 border-border text-[11px] font-heading cursor-pointer ${
                semi === 0 ? "bg-main" : semi < 3 ? "bg-white" : "bg-background"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const MAJOR_WALK = [
  { degree: "1", semi: 0, join: "W" },
  { degree: "2", semi: 2, join: "W" },
  { degree: "3", semi: 4, join: "H" },
  { degree: "4", semi: 5, join: "W" },
  { degree: "5", semi: 7, join: "W" },
  { degree: "6", semi: 9, join: "W" },
  { degree: "7", semi: 11, join: "H" },
  { degree: "1", semi: 12, join: null },
] as const;

function MajorPath({
  rootPc,
  onPlayMidi,
}: {
  rootPc: number;
  onPlayMidi: (midi: number) => void;
}) {
  const playWalk = () => {
    MAJOR_WALK.forEach((step, index) => {
      window.setTimeout(() => {
        onPlayMidi(60 + rootPc + step.semi);
      }, index * 280);
    });
  };

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm max-w-xl">
            Follow the letters between the numbers.{" "}
            <span className="font-heading">W</span> steps over a key.{" "}
            <span className="font-heading">H</span> moves to the next key. The
            half steps sit between 3–4 and 7–1.
          </p>
          <Button size="sm" onClick={playWalk}>
            <Play className="size-4" />
            Play the walk
          </Button>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {MAJOR_WALK.map((step, index) => {
            const pc = (rootPc + step.semi) % 12;
            return (
              <React.Fragment key={`${step.degree}-${index}`}>
                <button
                  onClick={() => onPlayMidi(60 + rootPc + step.semi)}
                  className="flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-base border-2 border-border bg-white cursor-pointer"
                >
                  <span className="text-lg font-heading leading-none">
                    {stepLabel(pc, rootPc, IONIAN)}
                  </span>
                  <span className="mt-1 text-[10px] text-foreground/60">
                    {CHROMATIC_NOTES[pc]}
                  </span>
                </button>
                {step.join && (
                  <span
                    className={`shrink-0 px-1 text-[11px] font-heading ${
                      step.join === "H"
                        ? "text-black bg-main rounded-base border-2 border-border"
                        : "text-foreground/70"
                    }`}
                  >
                    {step.join}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
