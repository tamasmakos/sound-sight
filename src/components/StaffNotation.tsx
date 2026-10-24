"use client";

import type { MouseEvent } from "react";
import { BASS, FLAT, SHARP, TREBLE, type MusicGlyph } from "@/lib/music-glyphs";
import { midiFromPosition, spellMidi, staffPosition } from "@/lib/notation";
import { STEP, layoutStaff, ledgerPositions } from "@/lib/staff-geometry";

interface StaffNote {
  midi: number;
  color?: string;
  open?: boolean;
}

interface StaffNotationProps {
  clef?: "treble" | "bass" | "grand";
  notes?: StaffNote[];
  /** Played notes. Matching noteheads turn yellow. */
  litMidis?: number[];
  /** Hollow notehead for the pitch the arrows are aiming at. */
  cursorMidi?: number;
  fifths?: number;
  interactive?: boolean;
  onPickMidi?: (midi: number) => void;
}

function withCursor(notes: StaffNote[], cursorMidi?: number, litMidis?: number[]): StaffNote[] {
  const lit = new Set(litMidis ?? []);
  const painted = notes.map((note) =>
    lit.has(note.midi) ? { ...note, color: "#FACC00", open: false } : note
  );
  if (cursorMidi === undefined || painted.some((note) => note.midi === cursorMidi)) return painted;
  return [...painted, { midi: cursorMidi, open: true }];
}

export function StaffNotation({
  clef = "treble",
  notes = [],
  litMidis,
  cursorMidi,
  fifths = 0,
  interactive = false,
  onPickMidi,
}: StaffNotationProps) {
  const drawn = withCursor(notes, cursorMidi, litMidis);
  if (clef === "grand") {
    return (
      <div className="overflow-hidden rounded-base border-2 border-border bg-white p-2">
        <div className="grid gap-1">
          <StaffBed
            clef="treble"
            notes={drawn.filter((note) => note.midi >= 60)}
            fifths={fifths}
            interactive={interactive}
            onPickMidi={onPickMidi}
          />
          <div className="flex items-center gap-2 px-2 text-[11px] font-heading uppercase tracking-wide text-foreground/60">
            <span className="h-px flex-1 bg-black/30" />
            Middle C sits between the staves
            <span className="h-px flex-1 bg-black/30" />
          </div>
          <StaffBed
            clef="bass"
            notes={drawn.filter((note) => note.midi < 60)}
            fifths={fifths}
            interactive={interactive}
            onPickMidi={onPickMidi}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-base border-2 border-border bg-white p-2">
      <StaffBed
        clef={clef}
        notes={drawn}
        fifths={fifths}
        interactive={interactive}
        onPickMidi={onPickMidi}
      />
    </div>
  );
}

function StaffBed({
  clef,
  notes,
  fifths,
  interactive,
  onPickMidi,
}: {
  clef: "treble" | "bass";
  notes: StaffNote[];
  fifths: number;
  interactive: boolean;
  onPickMidi?: (midi: number) => void;
}) {
  const spelled = notes.map((note) => ({
    ...note,
    position: staffPosition(note.midi, clef, fifths),
    accidental: spellMidi(note.midi, fifths).accidental,
  }));
  const layout = layoutStaff(
    clef,
    fifths,
    spelled.map((note) => ({ position: note.position, accidental: note.accidental }))
  );

  const pickFromEvent = (event: MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPickMidi) return;
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    const position = Math.round(layout.positionAt(local.y));
    const clamped = Math.max(-2, Math.min(9, position));
    onPickMidi(midiFromPosition(clamped, clef));
  };

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={`block h-auto w-full ${interactive ? "cursor-pointer" : ""}`}
      role="img"
      aria-label={clef === "treble" ? "Treble staff" : "Bass staff"}
      onClick={pickFromEvent}
    >
      {[0, 2, 4, 6, 8].map((position) => (
        <line
          key={position}
          x1={8}
          x2={layout.width - 8}
          y1={layout.y(position)}
          y2={layout.y(position)}
          stroke="#000"
          strokeWidth={1.7}
        />
      ))}

      <EngravedGlyph
        glyph={clef === "treble" ? TREBLE : BASS}
        x={layout.anchorX}
        y={layout.y(clef === "treble" ? TREBLE.staffPosition : BASS.staffPosition)}
      />

      {layout.signature.map((mark, index) => (
        <EngravedGlyph
          key={`${mark.position}-${index}`}
          glyph={fifths >= 0 ? SHARP : FLAT}
          x={mark.x}
          y={layout.y(mark.position)}
        />
      ))}

      {layout.notes.map((note, index) => {
        const y = layout.y(note.position);
        const stemUp = note.position < 4;
        const stemX = note.x + (stemUp ? 6.2 : -6.2);
        const stemEnd = layout.y(stemUp ? note.position + 6.5 : note.position - 6.5);
        return (
          <g key={`${spelled[index].midi}-${index}`}>
            {ledgerPositions(note.position).map((line) => (
              <line
                key={line}
                x1={note.x - 12}
                x2={note.x + 12}
                y1={layout.y(line)}
                y2={layout.y(line)}
                stroke="#000"
                strokeWidth={1.7}
              />
            ))}
            {note.accidentalX !== null && (
              <EngravedGlyph
                glyph={note.accidental > 0 ? SHARP : FLAT}
                x={note.accidentalX}
                y={y}
              />
            )}
            <ellipse
              cx={note.x}
              cy={y}
              rx={7.2}
              ry={5.2}
              transform={`rotate(-18 ${note.x} ${y})`}
              fill={spelled[index].open ? "#fff" : (spelled[index].color ?? "#111")}
              stroke="#000"
              strokeWidth={spelled[index].open ? 2 : 1.5}
            />
            {!spelled[index].open && (
              <line x1={stemX} x2={stemX} y1={y} y2={stemEnd} stroke="#000" strokeWidth={1.6} />
            )}
          </g>
        );
      })}

      {interactive && <rect x={0} y={0} width={layout.width} height={layout.height} fill="transparent" />}
    </svg>
  );
}

const GLYPH_SCALE = (2 * STEP) / 250;

function EngravedGlyph({ glyph, x, y }: { glyph: MusicGlyph; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${GLYPH_SCALE} ${-GLYPH_SCALE}) translate(0 ${-glyph.anchorFontY})`}>
      <path d={glyph.d} fill="#000" />
    </g>
  );
}
