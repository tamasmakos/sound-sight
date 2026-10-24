"use client";

import type { ReactNode } from "react";
import { CHROMATIC_NOTES, ScaleDefinition } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { fifthsForTonic, spellMidi, type Clef } from "@/lib/notation";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { Fretboard } from "@/components/Fretboard";
import { StaffNotation } from "@/components/StaffNotation";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, Volume2 } from "lucide-react";

export type InstrumentId = "piano" | "guitar";

interface InstrumentStageProps {
  instrument: InstrumentId;
  onInstrumentChange: (instrument: InstrumentId) => void;
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  /** Fill for each sounding pitch. The same color is used on the staff. */
  soundColors?: Record<number, string>;
  cursorMidi: number;
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onToggleMidi: (midi: number) => void;
  onAddMidis: (midis: number[]) => void;
  onSelectRoot: (pc: number) => void;
  onStepCursor: (delta: number, fifths?: number) => void;
  onMoveSelection: (direction: number) => void;
  onAddCursor: (fifths?: number) => void;
  onRemoveCursor: () => void;
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
  soundColors,
  cursorMidi,
  labelMode,
  onLabelModeChange,
  scale,
  onToggleMidi,
  onAddMidis,
  onSelectRoot,
  onStepCursor,
  onMoveSelection,
  onAddCursor,
  onRemoveCursor,
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
              soundColors={soundColors}
              notes={activeMidis.map((midi) => ({ midi, color: soundColors?.[midi] }))}
              cursorMidi={cursorMidi}
              interactive
              onPickMidi={onToggleMidi}
            />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <StaffButton label="Move the note up" onClick={() => onStepCursor(1, fifths)}>
              <ChevronUp className="size-4" />
            </StaffButton>
            <div className="flex gap-1">
              <StaffButton label="Select the previous note" onClick={() => onMoveSelection(-1)}>
                <ChevronLeft className="size-4" />
              </StaffButton>
              <StaffButton
                label={`Add ${spellMidi(cursorMidi, fifths).name}`}
                onClick={() => onAddCursor(fifths)}
                tone="add"
              >
                <Plus className="size-4" />
              </StaffButton>
              <StaffButton label="Select the next note" onClick={() => onMoveSelection(1)}>
                <ChevronRight className="size-4" />
              </StaffButton>
            </div>
            <StaffButton label="Move the note down" onClick={() => onStepCursor(-1, fifths)}>
              <ChevronDown className="size-4" />
            </StaffButton>
            <StaffButton label="Remove the selected note" onClick={onRemoveCursor}>
              <Minus className="size-4" />
            </StaffButton>
          </div>
        </div>
      )}

      {instrument === "piano" ? (
        <InteractiveKeyboard
          bare
          rootPc={rootPc}
          highlightedPitchClasses={highlightedPitchClasses}
          activeMidis={activeMidis}
          soundColors={soundColors}
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
          soundColors={soundColors}
          cursorMidi={cursorMidi}
          labelMode={labelMode}
          scale={scale}
          onToggleMidi={onToggleMidi}
          onAddMidis={onAddMidis}
        />
      )}
      <p className="mt-2 text-xs text-foreground/65">
        Left and right choose a note. Up and down change its pitch. Plus writes a note, minus erases it. Each note keeps its own color.
      </p>
    </section>
  );
}

function StaffButton({
  label,
  onClick,
  tone = "plain",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "plain" | "add";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-base border-2 border-border cursor-pointer ${
        tone === "add" ? "bg-main" : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}
