"use client";

import { CHROMATIC_NOTES, ScaleDefinition } from "@/lib/music-theory";
import type { LabelMode } from "@/lib/curriculum";
import { fifthsForTonic, type Clef } from "@/lib/notation";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { Fretboard } from "@/components/Fretboard";
import { StaffNotation } from "@/components/StaffNotation";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export type InstrumentId = "piano" | "guitar";

export interface WrittenMusic {
  midis: number[];
  /** Stack the notes. A scale is a line, so this stays false. */
  chord: boolean;
  fifths?: number;
}

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
  onPress: (midi: number) => void;
  onRelease: (midi: number) => void;
  onReleaseAll: () => void;
  onSelectRoot: (pc: number) => void;
  onHearShape?: () => void;
  /** Lesson music shown until a key is actually held. */
  written?: WrittenMusic | null;
  /** Hide the live staff when a page already shows the question staff above. */
  showStaff?: boolean;
}

function staffClef(midis: number[]): Clef {
  if (midis.length === 0) return "treble";
  const low = midis.some((midi) => midi < 60);
  const high = midis.some((midi) => midi >= 60);
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
  onPress,
  onRelease,
  onReleaseAll,
  onSelectRoot,
  onHearShape,
  written = null,
  showStaff = true,
}: InstrumentStageProps) {
  const holding = activeMidis.length > 0;
  const midis = holding ? [...activeMidis].sort((a, b) => a - b) : written?.midis ?? [];
  const chord = holding ? true : Boolean(written?.chord);
  const wide = !chord && midis.length > 4;
  const clef = staffClef(midis);
  const fifths = written?.fifths ?? fifthsForTonic(rootPc);
  const showNotation = showStaff;

  const switchInstrument = (next: InstrumentId) => {
    if (next === instrument) return;
    onReleaseAll();
    onInstrumentChange(next);
  };

  return (
    <section className="min-w-0 rounded-base border-2 border-border bg-white p-2 shadow-shadow sm:p-3">
      <div className="mb-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-base border-2 border-border bg-background p-0.5">
            <Button
              size="xs"
              variant={instrument === "piano" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => switchInstrument("piano")}
            >
              Piano
            </Button>
            <Button
              size="xs"
              variant={instrument === "guitar" ? "default" : "neutral"}
              className="shadow-none hover:translate-x-0 hover:translate-y-0"
              onClick={() => switchInstrument("guitar")}
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

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
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
              onPress={onPress}
              onRelease={onRelease}
              onReleaseAll={onReleaseAll}
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
              onPress={onPress}
              onRelease={onRelease}
            />
          )}
        </div>

        {showNotation && (
          <div
            className={
              wide
                ? "order-1 w-full shrink-0 lg:order-2 lg:w-[46%]"
                : "order-1 mx-auto w-full max-w-[13rem] shrink-0 lg:order-2"
            }
          >
            <StaffNotation
              compact={!wide}
              chord={chord}
              clef={clef}
              fifths={fifths}
              soundColors={holding ? soundColors : undefined}
              notes={midis.map((midi) => ({
                midi,
                color: holding ? soundColors?.[midi] : undefined,
              }))}
            />
          </div>
        )}
      </div>
    </section>
  );
}
