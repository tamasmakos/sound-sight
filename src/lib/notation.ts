export type Clef = "treble" | "bass" | "grand";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export interface SpelledNote {
  midi: number;
  letter: number;
  octave: number;
  accidental: number;
  name: string;
}

const FLAT_SPELL: Record<number, { letter: number; accidental: number }> = {
  1: { letter: 1, accidental: -1 },
  3: { letter: 2, accidental: -1 },
  6: { letter: 4, accidental: -1 },
  8: { letter: 5, accidental: -1 },
  10: { letter: 6, accidental: -1 },
};

/** F C G D A E B, then B E A D G C F. Index is a letter number. */
const SHARP_LETTERS = [3, 0, 4, 1, 5, 2, 6];
const FLAT_LETTERS = [6, 2, 5, 1, 4, 0, 3];

function keyAccidental(letter: number, fifths: number): number {
  if (fifths > 0 && SHARP_LETTERS.indexOf(letter) < fifths) return 1;
  if (fifths < 0 && FLAT_LETTERS.indexOf(letter) < -fifths) return -1;
  return 0;
}

function spelledNote(midi: number, letter: number, accidental: number): SpelledNote {
  const naturalMidi = midi - accidental;
  const octave = Math.floor(naturalMidi / 12) - 1;
  const acc = accidental === 1 ? "♯" : accidental === -1 ? "♭" : "";
  return {
    midi,
    letter,
    octave,
    accidental,
    name: `${LETTERS[letter]}${acc}${octave}`,
  };
}

export function spellMidi(midi: number, fifths = 0): SpelledNote {
  const pc = ((midi % 12) + 12) % 12;
  const clamped = Math.max(-7, Math.min(7, Math.trunc(fifths)));
  for (let letter = 0; letter < 7; letter += 1) {
    const accidental = keyAccidental(letter, clamped);
    if ((LETTER_PC[letter] + accidental + 12) % 12 === pc) {
      return spelledNote(midi, letter, accidental);
    }
  }
  const preferFlat = clamped < 0;
  const flat = FLAT_SPELL[pc];
  const letter = preferFlat && flat ? flat.letter : [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
  const accidental = preferFlat && flat ? flat.accidental : [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc];
  return spelledNote(midi, letter, accidental);
}

export function diatonicFromSpelling(letter: number, octave: number): number {
  return octave * 7 + letter;
}

/** Staff position. 0 is the bottom line of that clef. */
export function staffPosition(midi: number, clef: "treble" | "bass", fifths = 0): number {
  const spelled = spellMidi(midi, fifths);
  const diatonic = diatonicFromSpelling(spelled.letter, spelled.octave);
  const bottom = clef === "treble" ? diatonicFromSpelling(2, 4) : diatonicFromSpelling(4, 2);
  return diatonic - bottom;
}

export function midiFromPosition(position: number, clef: "treble" | "bass"): number {
  const bottom = clef === "treble" ? diatonicFromSpelling(2, 4) : diatonicFromSpelling(4, 2);
  const diatonic = bottom + position;
  const octave = Math.floor(diatonic / 7);
  const letter = ((diatonic % 7) + 7) % 7;
  return (octave + 1) * 12 + LETTER_PC[letter];
}

/** Move one staff step. The landing letter keeps the signature's accidental. */
export function shiftDiatonic(midi: number, delta: number, fifths = 0): number {
  const clamped = Math.max(-7, Math.min(7, Math.trunc(fifths)));
  const spelled = spellMidi(midi, clamped);
  const diatonic = diatonicFromSpelling(spelled.letter, spelled.octave) + delta;
  const octave = Math.floor(diatonic / 7);
  const letter = ((diatonic % 7) + 7) % 7;
  const next = (octave + 1) * 12 + LETTER_PC[letter] + keyAccidental(letter, clamped);
  return Math.max(48, Math.min(84, next));
}

/** Signature for this pitch class. A sharp key wins when both spellings exist, so C♯ stays C♯. */
export function fifthsForTonic(pc: number): number {
  const normalized = ((pc % 12) + 12) % 12;
  const matches = MAJOR_KEYS.filter((key) => key.tonicPc === normalized);
  const sharp = matches
    .filter((key) => key.fifths >= 0)
    .sort((a, b) => Math.abs(a.fifths) - Math.abs(b.fifths))[0];
  if (sharp) return sharp.fifths;
  return matches.sort((a, b) => Math.abs(a.fifths) - Math.abs(b.fifths))[0]?.fifths ?? 0;
}

export const MAJOR_KEYS: { fifths: number; major: string; minor: string; tonicPc: number }[] = [
  { fifths: -7, major: "C♭", minor: "A♭", tonicPc: 11 },
  { fifths: -6, major: "G♭", minor: "E♭", tonicPc: 6 },
  { fifths: -5, major: "D♭", minor: "B♭", tonicPc: 1 },
  { fifths: -4, major: "A♭", minor: "F", tonicPc: 8 },
  { fifths: -3, major: "E♭", minor: "C", tonicPc: 3 },
  { fifths: -2, major: "B♭", minor: "G", tonicPc: 10 },
  { fifths: -1, major: "F", minor: "D", tonicPc: 5 },
  { fifths: 0, major: "C", minor: "A", tonicPc: 0 },
  { fifths: 1, major: "G", minor: "E", tonicPc: 7 },
  { fifths: 2, major: "D", minor: "B", tonicPc: 2 },
  { fifths: 3, major: "A", minor: "F♯", tonicPc: 9 },
  { fifths: 4, major: "E", minor: "C♯", tonicPc: 4 },
  { fifths: 5, major: "B", minor: "G♯", tonicPc: 11 },
  { fifths: 6, major: "F♯", minor: "D♯", tonicPc: 6 },
  { fifths: 7, major: "C♯", minor: "A♯", tonicPc: 1 },
];

/** Signature accidentals as staff positions, treble or bass. */
export function signaturePositions(fifths: number, clef: "treble" | "bass"): number[] {
  const sharpMidis =
    clef === "treble"
      ? [77, 72, 79, 74, 69, 76, 71]
      : [53, 48, 55, 50, 45, 52, 47];
  const flatMidis =
    clef === "treble"
      ? [71, 76, 69, 74, 67, 72, 65]
      : [47, 52, 45, 50, 43, 48, 41];
  const count = Math.min(7, Math.abs(fifths));
  const midis = (fifths >= 0 ? sharpMidis : flatMidis).slice(0, count);
  return midis.map((midi) => staffPosition(midi, clef, fifths >= 0 ? 1 : -1));
}

export function keyByFifths(fifths: number) {
  return MAJOR_KEYS.find((key) => key.fifths === fifths) ?? MAJOR_KEYS[7];
}

/** VexFlow key name for a signature. Sharp keys win a tie, so F♯ stays F♯. */
export function vexKeySpec(fifths: number): string {
  const clamped = Math.max(-7, Math.min(7, fifths));
  const names = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
  return names[clamped + 7];
}
