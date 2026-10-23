"use client";

import type { MouseEvent } from "react";
import {
  Clef,
  midiFromPosition,
  signaturePositions,
  spellMidi,
  staffPosition,
} from "@/lib/notation";

interface StaffNote {
  midi: number;
  color?: string;
}

interface StaffNotationProps {
  clef?: Clef;
  notes?: StaffNote[];
  fifths?: number;
  interactive?: boolean;
  onPickMidi?: (midi: number) => void;
}

const STEP = 7;

export function StaffNotation({
  clef = "treble",
  notes = [],
  fifths = 0,
  interactive = false,
  onPickMidi,
}: StaffNotationProps) {
  if (clef === "grand") {
    return (
      <div className="rounded-base border-2 border-border bg-white p-2">
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
    <div className="rounded-base border-2 border-border bg-white p-2">
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
  const signature = signaturePositions(fifths, clef);
  const yFor = (position: number) => 18 + (8 - position) * STEP;
  const height = 18 + 8 * STEP + 28;
  const noteStart = 78 + signature.length * 12;
  const positions = notes.map((note) => ({
    ...note,
    position: staffPosition(note.midi, clef, fifths),
    spelled: spellMidi(note.midi, fifths),
  }));

  const pickFromEvent = (event: MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPickMidi) return;
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    const position = Math.round(8 - (local.y - 18) / STEP);
    const clamped = Math.max(-2, Math.min(9, position));
    onPickMidi(midiFromPosition(clamped, clef));
  };

  return (
    <svg
      viewBox={`0 0 640 ${height}`}
      className={`w-full h-auto ${interactive ? "cursor-pointer" : ""}`}
      onClick={pickFromEvent}
    >
      <text
        x={8}
        y={yFor(clef === "treble" ? 1 : 3)}
        fontSize={clef === "treble" ? 68 : 58}
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        {clef === "treble" ? "𝄞" : "𝄢"}
      </text>
      {[0, 2, 4, 6, 8].map((position) => (
        <line
          key={position}
          x1={4}
          x2={630}
          y1={yFor(position)}
          y2={yFor(position)}
          stroke="#000"
          strokeWidth={position === 4 ? 2.4 : 1.4}
        />
      ))}

      {signature.map((position, index) => (
        <text
          key={`${position}-${index}`}
          x={70 + index * 12}
          y={yFor(position) + 4}
          textAnchor="middle"
          fontSize={16}
          fontFamily="serif"
        >
          {fifths >= 0 ? "♯" : "♭"}
        </text>
      ))}

      {positions.map((note, index) => {
        const x = noteStart + index * 36;
        const y = yFor(note.position);
        const stemUp = note.position < 4;
        return (
          <g key={`${note.midi}-${index}`}>
            {ledgerLines(note.position).map((position) => (
              <line
                key={position}
                x1={x - 12}
                x2={x + 12}
                y1={yFor(position)}
                y2={yFor(position)}
                stroke="#000"
                strokeWidth={1.4}
              />
            ))}
            {note.spelled.accidental !== 0 && (
              <text x={x - 16} y={y + 4} textAnchor="middle" fontSize={16} fontFamily="serif">
                {note.spelled.accidental > 0 ? "♯" : "♭"}
              </text>
            )}
            <ellipse
              cx={x}
              cy={y}
              rx={7.5}
              ry={5.5}
              transform={`rotate(-18 ${x} ${y})`}
              fill={note.color ?? "#111"}
              stroke="#000"
              strokeWidth={1.5}
            />
            <line
              x1={stemUp ? x + 6.5 : x - 6.5}
              x2={stemUp ? x + 6.5 : x - 6.5}
              y1={y}
              y2={stemUp ? y - 32 : y + 32}
              stroke="#000"
              strokeWidth={1.6}
            />
          </g>
        );
      })}

      {interactive && (
        <rect x={0} y={0} width={640} height={height} fill="transparent">
          <title>Click a line or a space</title>
        </rect>
      )}
    </svg>
  );
}

function ledgerLines(position: number): number[] {
  const lines: number[] = [];
  if (position < 0) {
    for (let line = -2; line >= position; line -= 2) lines.push(line);
    if (position % 2 !== 0) {
      const nearest = position - 1;
      if (!lines.includes(nearest)) lines.push(nearest);
    }
  }
  if (position > 8) {
    for (let line = 10; line <= position; line += 2) lines.push(line);
    if (position % 2 !== 0) {
      const nearest = position + 1;
      if (!lines.includes(nearest)) lines.push(nearest);
    }
  }
  return lines;
}
