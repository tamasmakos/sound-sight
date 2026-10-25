"use client";

import { CHROMATIC_NOTES, ScaleDefinition } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { fifthsForTonic, spellMidi, type Clef } from "@/lib/notation";
import { playedColor } from "@/lib/note-colors";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { Fretboard } from "@/components/Fretboard";
import { StaffNotation } from "@/components/StaffNotation";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export type InstrumentId = "piano" | "guitar";

interface InstrumentStageProps {
  instrument: InstrumentId;
  onInstrumentChange: (instrument: InstrumentId) => void;
  rootPc: number;
  highlightedPitchClasses: number[];
  activeMidis: number[];
  /** Fill for each sounding pitch. The same color is used on the staff. */
  soundColors?: Record<number, string>;
  labelMode: LabelMode;
  onLabelModeChange: (mode: LabelMode) => void;
  scale: ScaleDefinition | null;
  onToggleMidi: (midi: number) => void;
  onAddMidis: (midis: number[]) => void;
  onSelectRoot: (pc: number) => void;
  onClear: () => void;
  onHearShape?: () => void;
  /** Hide the live staff when a page already shows the question staff above. */
  showStaff?: boolean;
}

function staffClef(activeMidis: number[]): Clef {
  if (activeMidis.length === 0) return "treble";
  const low = activeMidis.some((midi) => midi < 60);
  const high = activeMidis.some((midi) => midi >= 60);
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
  labelMode,
  onLabelModeChange,
  scale,
  onToggleMidi,
  onAddMidis,
  onSelectRoot,
  onClear,
  onHearShape,
  showStaff = true,
}: InstrumentStageProps) {
  const clef = staffClef(activeMidis);
  const fifths = fifthsForTonic(rootPc);
  const sounding = [...activeMidis].sort((a, b) => a - b);

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          {instrument === "piano" ? (
            <InteractiveKeyboard
              bare
              rootPc={rootPc}
              highlightedPitchClasses={highlightedPitchClasses}
              activeMidis={activeMidis}
              soundColors={soundColors}
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
              labelMode={labelMode}
              scale={scale}
              onToggleMidi={onToggleMidi}
              onAddMidis={onAddMidis}
            />
          )}
        </div>

        {showStaff && (
          <div className="mx-auto w-full max-w-[17rem] shrink-0">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-heading uppercase tracking-wide text-foreground/55">
                On the staff
              </span>
              <span className="text-[10px] font-heading text-foreground/55">
                {sounding.length === 0 ? "Waiting" : sounding.length === 1 ? "One note" : "Chord"}
              </span>
            </div>
            <StaffNotation
              compact
              chord
              clef={clef}
              fifths={fifths}
              soundColors={soundColors}
              notes={sounding.map((midi) => ({ midi, color: soundColors?.[midi] }))}
            />
            {sounding.length === 0 ? (
              <p className="mt-1 text-center text-[11px] leading-snug text-foreground/60">
                Play a key. It is written here in the same color. Play it again to lift it.
              </p>
            ) : (
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {sounding.map((midi, index) => (
                  <span
                    key={midi}
                    className="rounded-base border-2 border-border px-1.5 py-0.5 font-heading text-[11px] leading-none text-black"
                    style={{ backgroundColor: playedColor(soundColors?.[midi], index) }}
                  >
                    {spellMidi(midi, fifths).name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
