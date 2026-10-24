"use client";

import { CHROMATIC_NOTES, ScaleDefinition } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { fifthsForTonic, spellMidi, type Clef } from "@/lib/notation";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { Fretboard } from "@/components/Fretboard";
import { StaffNotation } from "@/components/StaffNotation";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Volume2 } from "lucide-react";

export type InstrumentId = "piano" | "guitar";

interface InstrumentStageProps {
  instrument: InstrumentId;
  onInstrumentChange: (instrument: InstrumentId) => void;
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  cursorMidi: number;
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onToggleMidi: (midi: number) => void;
  onAddMidis: (midis: number[]) => void;
  onSelectRoot: (pc: number) => void;
  onStepCursor: (delta: number) => void;
  onAddCursor: () => void;
  onClear: () => void;
  onHearShape?: () => void;
  /** Hide the live staff when a page already shows the question staff above. */
  showStaff?: boolean;
}

function staffClef(activeMidis: number[], cursorMidi: number): Clef {
  const pitches = activeMidis.length > 0 ? activeMidis : [cursorMidi];
  const low = pitches.some((midi) => midi < 60);
  const high = pitches.some((midi) => midi >= 60);
  if (low && high) return "grand";
  if (low) return "bass";
  return "treble";
}

export function InstrumentStage({
  instrument,
  onInstrumentChange,
  rootPc,
  highlightedPitchClasses,
  activeMidis,
  cursorMidi,
  labelMode,
  onLabelModeChange,
  scale,
  onToggleMidi,
  onAddMidis,
  onSelectRoot,
  onStepCursor,
  onAddCursor,
  onClear,
  onHearShape,
  showStaff = true,
}: InstrumentStageProps) {
  const clef = staffClef(activeMidis, cursorMidi);
  const fifths = fifthsForTonic(rootPc);

  return (
    <section className="min-w-0 rounded-base border-2 border-border bg-white p-2 shadow-shadow sm:p-3">
      <div className="mb-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-base border-2 border-border bg-background p-0.5">
            <Button
              size="xs"
              variant={instrument === "piano" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => onInstrumentChange("piano")}
            >
              Piano
            </Button>
            <Button
              size="xs"
              variant={instrument === "guitar" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => onInstrumentChange("guitar")}
            >
              Guitar
            </Button>
          </div>
          <div className="flex rounded-base border-2 border-border bg-background p-0.5">
            <Button
              size="xs"
              variant={labelMode === "notes" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => onLabelModeChange("notes")}
            >
              Notes
            </Button>
            <Button
              size="xs"
              variant={labelMode === "steps" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => onLabelModeChange("steps")}
            >
              Steps
            </Button>
          </div>
          {onHearShape && (
            <Button
              size="sm"
              className="hover:translate-x-0 hover:translate-y-0"
              onClick={onHearShape}
            >
              <Volume2 className="size-4" />
              Hear
            </Button>
          )}
          <Button
            size="sm"
            variant="neutral"
            className="hover:translate-x-0 hover:translate-y-0"
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {CHROMATIC_NOTES.map((note, pc) => (
            <button
              key={note}
              type="button"
              onClick={() => onSelectRoot(pc)}
              className={`h-8 min-w-8 shrink-0 rounded-base border-2 border-border px-1.5 text-xs font-heading cursor-pointer ${
                rootPc === pc ? "bg-main" : "bg-white"
              }`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {showStaff && (
        <div className="mb-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <StaffNotation
              clef={clef}
              fifths={fifths}
              notes={activeMidis.map((midi) => ({ midi, color: "#FACC00" }))}
              cursorMidi={cursorMidi}
              interactive
              onPickMidi={onToggleMidi}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              aria-label="Move the note up"
              onClick={() => onStepCursor(1)}
              className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-white cursor-pointer"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Add ${spellMidi(cursorMidi, fifths).name}`}
              onClick={onAddCursor}
              className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-main cursor-pointer"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Move the note down"
              onClick={() => onStepCursor(-1)}
              className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-white cursor-pointer"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      )}

      {instrument === "piano" ? (
        <InteractiveKeyboard
          bare
          rootPc={rootPc}
          highlightedPitchClasses={highlightedPitchClasses}
          activeMidis={activeMidis}
          cursorMidi={cursorMidi}
          labelMode={labelMode}
          onLabelModeChange={onLabelModeChange}
          scale={scale}
          onToggleMidi={onToggleMidi}
          onAddMidis={onAddMidis}
          onSelectRoot={onSelectRoot}
        />
      ) : (
        <Fretboard
          rootPc={rootPc}
          highlightedPitchClasses={highlightedPitchClasses}
          activeMidis={activeMidis}
          cursorMidi={cursorMidi}
          labelMode={labelMode}
          scale={scale}
          onToggleMidi={onToggleMidi}
          onAddMidis={onAddMidis}
        />
      )}
      <p className="mt-2 text-xs text-foreground/65">
        Tap a key to add it. Tap again to remove it. Hold several keys for a chord. The hollow note is where Add will write.
      </p>
    </section>
  );
}
