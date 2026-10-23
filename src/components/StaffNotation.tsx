"use client";

import type { MouseEvent } from "react";
import { midiFromPosition, spellMidi, staffPosition } from "@/lib/notation";
import { STEP, layoutStaff, ledgerPositions } from "@/lib/staff-geometry";

interface StaffNote {
  midi: number;
  color?: string;
}

interface StaffNotationProps {
  clef?: "treble" | "bass" | "grand";
  notes?: StaffNote[];
  fifths?: number;
  interactive?: boolean;
  onPickMidi?: (midi: number) => void;
}

export function StaffNotation({
  clef = "treble",
  notes = [],
  fifths = 0,
  interactive = false,
  onPickMidi,
}: StaffNotationProps) {
  if (clef === "grand") {
    return (
      <div className="overflow-hidden rounded-base border-2 border-border bg-white p-2">
        <div className="grid gap-1">
          <StaffBed
            clef="treble"
            notes={notes.filter((note) => note.midi >= 60)}
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
            notes={notes.filter((note) => note.midi < 60)}
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
        notes={notes}
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

      <g transform={glyphTransform(layout.anchorX, layout.y(clef === "treble" ? 2 : 6))}>
        {clef === "treble" ? <TrebleClef /> : <BassClef />}
      </g>

      {layout.signature.map((mark, index) => (
        <g key={`${mark.position}-${index}`} transform={glyphTransform(mark.x, layout.y(mark.position))}>
          {fifths >= 0 ? <Sharp /> : <Flat />}
        </g>
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
            {note.accidental !== 0 && (
              <g
                transform={glyphTransform(
                  note.x - (note.accidental > 0 ? 16 : 15),
                  y
                )}
              >
                {note.accidental > 0 ? <Sharp /> : <Flat />}
              </g>
            )}
            <ellipse
              cx={note.x}
              cy={y}
              rx={7.2}
              ry={5.2}
              transform={`rotate(-18 ${note.x} ${y})`}
              fill={spelled[index].color ?? "#111"}
              stroke="#000"
              strokeWidth={1.5}
            />
            <line x1={stemX} x2={stemX} y1={y} y2={stemEnd} stroke="#000" strokeWidth={1.6} />
          </g>
        );
      })}

      {interactive && <rect x={0} y={0} width={layout.width} height={layout.height} fill="transparent" />}
    </svg>
  );
}

function glyphTransform(x: number, y: number) {
  return `translate(${x} ${y}) scale(${STEP} ${-STEP})`;
}

function TrebleClef() {
  return (
    <path
      d="M 0.15 1.05 C 1.85 1.55 2.45 0.15 2.2 -1.45 C 1.95 -3.15 0.2 -3.75 -0.8 -2.65 C -1.9 -1.45 -1.45 0.55 0.05 0.95 C 1.05 1.2 1.3 0.05 0.9 -0.6 C 0.55 -1.1 0.05 -0.9 0.12 -0.28 M 0.18 0.55 C 0.5 3.3 0.22 6.15 0.78 8.55 C 1.55 9.65 2.55 8.85 2.22 7.55 C 1.95 6.55 1.15 6.45 1.12 7.25 M -0.22 -2.45 C -0.5 -4.55 0.75 -5.75 1.7 -4.95 C 2.45 -4.3 2.2 -3.25 1.35 -3.2"
      fill="none"
      stroke="#000"
      strokeWidth={0.72}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function BassClef() {
  return (
    <g fill="#000">
      <path
        d="M 1.85 2.55 C -0.15 2.9 -1.95 1.05 -1.9 -0.85 C -1.85 -3.15 -0.35 -5.15 1.15 -6.15 C 1.85 -6.6 2.15 -7.25 1.35 -7.2 C 0.35 -7.1 -0.55 -5.7 -0.15 -4.35 C 0.35 -2.7 0.15 -1.15 0.55 0.15 C 0.95 1.45 1.7 1.85 2.15 1.15 C 2.45 0.65 2.15 0.15 1.7 0.35 C 1.15 0.6 0.85 0.15 0.95 -0.45"
        fill="none"
        stroke="#000"
        strokeWidth={0.78}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={2.15} cy={1} r={0.38} />
      <circle cx={2.15} cy={-1} r={0.38} />
    </g>
  );
}

function Sharp() {
  return (
    <g stroke="#000" strokeLinecap="round" fill="none">
      <line x1={-0.32} y1={-1.12} x2={-0.22} y2={1.12} strokeWidth={0.16} />
      <line x1={0.28} y1={-1.12} x2={0.38} y2={1.12} strokeWidth={0.16} />
      <line x1={-0.82} y1={0.12} x2={0.82} y2={0.48} strokeWidth={0.28} />
      <line x1={-0.82} y1={-0.48} x2={0.82} y2={-0.12} strokeWidth={0.28} />
    </g>
  );
}

function Flat() {
  return (
    <path
      d="M -0.12 -1.05 L -0.12 2.05 M -0.12 0.2 C 0.95 0.45 1.05 -0.2 0.72 -0.78 C 0.42 -1.25 -0.12 -1.08 -0.12 -0.5"
      fill="none"
      stroke="#000"
      strokeWidth={0.18}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
