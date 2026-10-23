import { signaturePositions } from "./notation";

/** One staff position is a line or the space beside it. Two positions make one space. */
export const STEP = 8;
const PAD = 12;
const STEM = 6.5;

interface GlyphBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Glyph boxes are in staff-position units, y upward, origin on the glyph's center note. */
const SHARP: GlyphBox = { minX: -0.95, maxX: 0.95, minY: -1.35, maxY: 1.35 };
const FLAT: GlyphBox = { minX: -0.4, maxX: 1.15, minY: -1.35, maxY: 2.25 };

const CLEF: Record<"treble" | "bass", GlyphBox & { origin: number }> = {
  treble: { origin: 2, minX: -2.35, maxX: 3.05, minY: -6.5, maxY: 10.5 },
  bass: { origin: 6, minX: -2.45, maxX: 3.05, minY: -8.1, maxY: 3.5 },
};

export interface LaidOutStaff {
  clef: "treble" | "bass";
  width: number;
  height: number;
  anchorX: number;
  y: (position: number) => number;
  positionAt: (pixelY: number) => number;
  signature: { x: number; position: number }[];
  notes: { x: number; position: number; accidental: number }[];
  minPos: number;
  maxPos: number;
}

export function layoutStaff(
  clef: "treble" | "bass",
  fifths: number,
  notes: { position: number; accidental: number }[]
): LaidOutStaff {
  const clefBox = CLEF[clef];
  const accidental = fifths >= 0 ? SHARP : FLAT;
  const anchorX = PAD - clefBox.minX * STEP;
  const clefRight = anchorX + clefBox.maxX * STEP;
  const positions = signaturePositions(fifths, clef);
  const slot = (accidental.maxX - accidental.minX + 0.55) * STEP;
  const sigStart = clefRight + STEP;
  const signature = positions.map((position, index) => ({
    position,
    x: sigStart + index * slot - accidental.minX * STEP,
  }));
  const sigRight = positions.length === 0 ? clefRight : sigStart + positions.length * slot;

  let cursor = sigRight + STEP * 2.4;
  const laidNotes = notes.map((note) => {
    const mark = note.accidental === 0 ? null : note.accidental > 0 ? SHARP : FLAT;
    if (mark) cursor += (mark.maxX - mark.minX + 0.2) * STEP;
    const x = cursor;
    cursor += STEP * 4.4;
    return { x, position: note.position, accidental: note.accidental };
  });

  const contentRight = laidNotes.length
    ? laidNotes[laidNotes.length - 1].x + STEP * 2.4
    : sigRight + STEP * 16;
  const width = Math.max(640, contentRight + PAD);

  let minPos = clefBox.origin + clefBox.minY;
  let maxPos = clefBox.origin + clefBox.maxY;
  for (const mark of signature) {
    minPos = Math.min(minPos, mark.position + accidental.minY);
    maxPos = Math.max(maxPos, mark.position + accidental.maxY);
  }
  for (const note of laidNotes) {
    const stemEnd = note.position < 4 ? note.position + STEM : note.position - STEM;
    minPos = Math.min(minPos, note.position - 0.85, stemEnd);
    maxPos = Math.max(maxPos, note.position + 0.85, stemEnd);
    const mark = note.accidental === 0 ? null : note.accidental > 0 ? SHARP : FLAT;
    if (mark) {
      minPos = Math.min(minPos, note.position + mark.minY);
      maxPos = Math.max(maxPos, note.position + mark.maxY);
    }
    for (const line of ledgerPositions(note.position)) {
      minPos = Math.min(minPos, line);
      maxPos = Math.max(maxPos, line);
    }
  }
  minPos = Math.min(minPos, 0);
  maxPos = Math.max(maxPos, 8);

  const y = (position: number) => PAD + (maxPos - position) * STEP;
  const height = PAD + (maxPos - minPos) * STEP + PAD;

  return {
    clef,
    width,
    height,
    anchorX,
    y,
    positionAt: (pixelY: number) => maxPos - (pixelY - PAD) / STEP,
    signature,
    notes: laidNotes,
    minPos,
    maxPos,
  };
}

export function ledgerPositions(position: number): number[] {
  const lines: number[] = [];
  if (position <= -2) {
    for (let line = -2; line >= Math.floor(position); line -= 2) lines.push(line);
  }
  if (position >= 10) {
    for (let line = 10; line <= Math.ceil(position); line += 2) lines.push(line);
  }
  return lines;
}

/** Every drawn edge stays inside the view box, including 7 sharps, 7 flats, and ledger notes. */
export function assertStaffExtremes(): void {
  const expect: Record<string, number[]> = {
    "treble:7": [8, 5, 9, 6, 3, 7, 4],
    "treble:-7": [4, 7, 3, 6, 2, 5, 1],
    "bass:7": [6, 3, 7, 4, 1, 5, 2],
    "bass:-7": [2, 5, 1, 4, 0, 3, -1],
  };
  for (const [key, positions] of Object.entries(expect)) {
    const [clef, fifths] = key.split(":");
    const actual = signaturePositions(Number(fifths), clef as "treble" | "bass");
    if (actual.join(",") !== positions.join(",")) {
      throw new Error(`${key} signature is ${actual.join(",")}, expected ${positions.join(",")}`);
    }
  }

  const samples = [-8, -2, 0, 4, 8, 9, 14, 18];
  for (const clef of ["treble", "bass"] as const) {
    for (const fifths of [-7, -6, -1, 0, 1, 6, 7]) {
      for (const position of samples) {
        const layout = layoutStaff(clef, fifths, [
          { position, accidental: position % 2 === 0 ? 1 : -1 },
          { position: position + 1, accidental: 0 },
          { position: position + 2, accidental: 0 },
        ]);
        const ys = [
          layout.y(layout.minPos),
          layout.y(layout.maxPos),
          layout.y(position),
          layout.y(position < 4 ? position + STEM : position - STEM),
        ];
        for (const value of ys) {
          if (value < 1 || value > layout.height - 1) {
            throw new Error(
              `${clef} fifths ${fifths} note ${position} y ${value} outside 0..${layout.height}`
            );
          }
        }
        const xs = [layout.anchorX, ...layout.signature.map((mark) => mark.x), ...layout.notes.map((note) => note.x)];
        for (const value of xs) {
          if (value < 1 || value > layout.width - 1) {
            throw new Error(
              `${clef} fifths ${fifths} note ${position} x ${value} outside 0..${layout.width}`
            );
          }
        }
        if (layout.signature.length > 0 && layout.signature[0].x - 8 < layout.anchorX) {
          throw new Error(`${clef} fifths ${fifths} signature collides with the clef`);
        }
      }
    }
  }
}
