"use client";

import { CHROMATIC_NOTES, ScaleDefinition } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { Fretboard } from "@/components/Fretboard";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export type InstrumentId = "piano" | "guitar";

interface InstrumentStageProps {
  instrument: InstrumentId;
  onInstrumentChange: (instrument: InstrumentId) => void;
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onTriggerMidi: (midi: number) => void;
  onSelectRoot: (pc: number) => void;
  onHearShape?: () => void;
}

export function InstrumentStage({
  instrument,
  onInstrumentChange,
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  labelMode,
  onLabelModeChange,
  scale,
  onTriggerMidi,
  onSelectRoot,
  onHearShape,
}: InstrumentStageProps) {
  return (
    <section className="rounded-base border-2 border-border bg-white p-2 shadow-shadow sm:p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex rounded-base border-2 border-border bg-background p-0.5">
          <Button
            size="xs"
            variant={instrument === "piano" ? "default" : "neutral"}
            className="shadow-none"
            onClick={() => onInstrumentChange("piano")}
          >
            Piano
          </Button>
          <Button
            size="xs"
            variant={instrument === "guitar" ? "default" : "neutral"}
            className="shadow-none"
            onClick={() => onInstrumentChange("guitar")}
          >
            Guitar
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {CHROMATIC_NOTES.map((note, pc) => (
            <button
              key={note}
              onClick={() => {
                onSelectRoot(pc);
                onTriggerMidi(60 + pc);
              }}
              className={`h-8 min-w-8 shrink-0 rounded-base border-2 border-border px-1.5 text-xs font-heading cursor-pointer ${
                rootPc === pc ? "bg-main" : "bg-white"
              }`}
            >
              {note}
            </button>
          ))}
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
              Hear
            </Button>
          )}
        </div>
      </div>

      {instrument === "piano" ? (
        <InteractiveKeyboard
          bare
          rootPc={rootPc}
          highlightedPitchClasses={highlightedPitchClasses}
          activeMidis={activeMidis}
          labelMode={labelMode}
          onLabelModeChange={onLabelModeChange}
          scale={scale}
          onTriggerMidi={onTriggerMidi}
          onSelectRoot={onSelectRoot}
        />
      ) : (
        <Fretboard
          rootPc={rootPc}
          highlightedPitchClasses={highlightedPitchClasses}
          activeMidis={activeMidis}
          labelMode={labelMode}
          scale={scale}
          onTriggerMidi={onTriggerMidi}
        />
      )}
    </section>
  );
}
