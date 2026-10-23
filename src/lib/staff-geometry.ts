import { BASS, FLAT, SHARP, STAFF_SPACE_UNITS, TREBLE, type MusicGlyph } from "./music-glyphs";
import { signaturePositions } from "./notation";

/** One staff position is a line or the space beside it. Two positions make one space. */
export const STEP = 8;
const PAD = 14;
const STEM = 6.5;
const POSITION_UNITS = STAFF_SPACE_UNITS / 2;

interface GlyphBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Box around the ink, in staff positions. x is from the font origin. y is from the note. */
function box(glyph: MusicGlyph): GlyphBox {
  return {
    minX: glyph.xMin / POSITION_UNITS,
    maxX: glyph.xMax / POSITION_UNITS,
    minY: (glyph.yMin - glyph.anchorFontY) / POSITION_UNITS,
    maxY: (glyph.yMax - glyph.anchorFontY) / POSITION_UNITS,
  };
}

const SHARP_BOX = box(SHARP);
const FLAT_BOX = box(FLAT);
const CLEF = {
  treble: { glyph: TREBLE, ...box(TREBLE) },
  bass: { glyph: BASS, ...box(BASS) },
} as const;

export interface LaidOutStaff {
  clef: "treble" | "bass";
  width: number;
  height: number;
  anchorX: number;
  y: (position: number) => number;
  positionAt: (pixelY: number) => number;
  signature: { x: number; position: number }[];
  notes: { x: number; accidentalX: number | null; position: number; accidental: number }[];
  minPos: number;
  maxPos: number;
}

export function layoutStaff(
  clef: "treble" | "bass",
  fifths: number,
  notes: { position: number; accidental: number }[]
): LaidOutStaff {
  const clefBox = CLEF[clef];
  const accidental = fifths >= 0 ? SHARP_BOX : FLAT_BOX;
  const anchorX = PAD - clefBox.minX * STEP;
  const clefRight = anchorX + clefBox.maxX * STEP;
  const positions = signaturePositions(fifths, clef);
  const slot = (accidental.maxX - accidental.minX) * STEP + 7;
  const sigStart = clefRight + 16;
  const signature = positions.map((position, index) => ({
    position,
    x: sigStart + index * slot - accidental.minX * STEP,
  }));
  const sigRight = positions.length === 0 ? clefRight : sigStart + positions.length * slot;

  let cursor = sigRight + 22;
  const laidNotes = notes.map((note) => {
    const mark = note.accidental === 0 ? null : note.accidental > 0 ? SHARP_BOX : FLAT_BOX;
    let accidentalX: number | null = null;
    if (mark) {
      accidentalX = cursor - mark.minX * STEP;
      cursor = accidentalX + mark.maxX * STEP + 6;
    }
    const x = cursor + 8;
    cursor = x + 30;
    return { x, accidentalX, position: note.position, accidental: note.accidental };
  });

  const contentRight = laidNotes.length
    ? laidNotes[laidNotes.length - 1].x + STEP * 2.4
    : sigRight + STEP * 16;
  const width = Math.max(640, contentRight + PAD);

  let minPos = clefBox.glyph.staffPosition + clefBox.minY;
  let maxPos = clefBox.glyph.staffPosition + clefBox.maxY;
  for (const mark of signature) {
    minPos = Math.min(minPos, mark.position + accidental.minY);
    maxPos = Math.max(maxPos, mark.position + accidental.maxY);
  }
  for (const note of laidNotes) {
    const stemEnd = note.position < 4 ? note.position + STEM : note.position - STEM;
    minPos = Math.min(minPos, note.position - 0.85, stemEnd);
    maxPos = Math.max(maxPos, note.position + 0.85, stemEnd);
    const mark = note.accidental === 0 ? null : note.accidental > 0 ? SHARP_BOX : FLAT_BOX;
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
