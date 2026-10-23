export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export const CHROMATIC_NOTES: NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const ENHARMONIC_LABELS: Record<NoteName, string> = {
  C: "C",
  "C#": "C♯/D♭",
  D: "D",
  "D#": "D♯/E♭",
  E: "E",
  F: "F",
  "F#": "F♯/G♭",
  G: "G",
  "G#": "G♯/A♭",
  A: "A",
  "A#": "A♯/B♭",
  B: "B",
};

export const PITCH_COLORS: Record<number, string> = {
  0: "#FACC00", // C - Electric Yellow
  1: "#FF9F1C", // C# - Amber
  2: "#FF6B35", // D - Tangerine
  3: "#FF4D50", // D# - Coral Red
  4: "#FF66C4", // E - Bubblegum Pink
  5: "#C084FC", // F - Orchid Purple
  6: "#7A83FF", // F# - Periwinkle Indigo
  7: "#38BDF8", // G - Sky Cyan
  8: "#00D696", // G# - Mint Emerald
  9: "#4ADE80", // A - Acid Green
  10: "#A3E635", // A# - Chartreuse
  11: "#FDE047", // B - Lemon
};

export interface IntervalInfo {
  semitones: number;
  shortName: string;
  name: string;
  ratio: [number, number];
  ratioLabel: string;
  consonance: "Perfect" | "Imperfect Consonance" | "Mild Dissonance" | "Sharp Dissonance";
  consonanceScore: number; // 0 to 100
  feeling: string;
  songReference: string;
  color: string;
}

export const INTERVALS: IntervalInfo[] = [
  {
    semitones: 0,
    shortName: "P1",
    name: "Perfect Unison",
    ratio: [1, 1],
    ratioLabel: "1 : 1",
    consonance: "Perfect",
    consonanceScore: 100,
    feeling: "Absolute identity, grounded center",
    songReference: "One-note pulse (e.g. 'One Note Samba')",
    color: "#FACC00",
  },
  {
    semitones: 1,
    shortName: "m2",
    name: "Minor Second",
    ratio: [16, 15],
    ratioLabel: "16 : 15",
    consonance: "Sharp Dissonance",
    consonanceScore: 15,
    feeling: "Maximum friction, suspense, urgent pull",
    songReference: "Jaws Theme (E – F)",
    color: "#FF4D50",
  },
  {
    semitones: 2,
    shortName: "M2",
    name: "Major Second",
    ratio: [9, 8],
    ratioLabel: "9 : 8",
    consonance: "Mild Dissonance",
    consonanceScore: 42,
    feeling: "Stepping forward, narrative motion",
    songReference: "Happy Birthday (first two distinct notes)",
    color: "#FF9F1C",
  },
  {
    semitones: 3,
    shortName: "m3",
    name: "Minor Third",
    ratio: [6, 5],
    ratioLabel: "6 : 5",
    consonance: "Imperfect Consonance",
    consonanceScore: 76,
    feeling: "Introspective, nocturnal, bittersweet warmth",
    songReference: "Greensleeves / Smoke on the Water",
    color: "#7A83FF",
  },
  {
    semitones: 4,
    shortName: "M3",
    name: "Major Third",
    ratio: [5, 4],
    ratioLabel: "5 : 4",
    consonance: "Imperfect Consonance",
    consonanceScore: 84,
    feeling: "Radiant, joyful, sunlit clarity",
    songReference: "When the Saints Go Marching In",
    color: "#00D696",
  },
  {
    semitones: 5,
    shortName: "P4",
    name: "Perfect Fourth",
    ratio: [4, 3],
    ratioLabel: "4 : 3",
    consonance: "Perfect",
    consonanceScore: 88,
    feeling: "Heraldic, suspended, open architecture",
    songReference: "Here Comes the Bride / Amazing Grace",
    color: "#38BDF8",
  },
  {
    semitones: 6,
    shortName: "TT",
    name: "Tritone (Aug 4 / Dim 5)",
    ratio: [45, 32],
    ratioLabel: "45 : 32 (≈ √2)",
    consonance: "Sharp Dissonance",
    consonanceScore: 22,
    feeling: "Symmetrical instability, magnetic restlessness",
    songReference: "The Simpsons Theme / Maria (West Side Story)",
    color: "#FF4D50",
  },
  {
    semitones: 7,
    shortName: "P5",
    name: "Perfect Fifth",
    ratio: [3, 2],
    ratioLabel: "3 : 2",
    consonance: "Perfect",
    consonanceScore: 96,
    feeling: "Heroic stability, acoustic pillar, power chord",
    songReference: "Star Wars Main Theme / Twinkle Twinkle",
    color: "#FACC00",
  },
  {
    semitones: 8,
    shortName: "m6",
    name: "Minor Sixth",
    ratio: [8, 5],
    ratioLabel: "8 : 5",
    consonance: "Imperfect Consonance",
    consonanceScore: 72,
    feeling: "Romantic yearning, cinematic melancholy",
    songReference: "The Entertainer / Love Story Theme",
    color: "#C084FC",
  },
  {
    semitones: 9,
    shortName: "M6",
    name: "Major Sixth",
    ratio: [5, 3],
    ratioLabel: "5 : 3",
    consonance: "Imperfect Consonance",
    consonanceScore: 80,
    feeling: "Pastoral optimism, warm nostalgia",
    songReference: "My Bonnie Lies Over the Ocean / NBC Chimes",
    color: "#00D696",
  },
  {
    semitones: 10,
    shortName: "m7",
    name: "Minor Seventh",
    ratio: [16, 9],
    ratioLabel: "16 : 9",
    consonance: "Mild Dissonance",
    consonanceScore: 54,
    feeling: "Bluesy momentum, soulful tension",
    songReference: "Star Trek Original Theme / Somewhere",
    color: "#FF9F1C",
  },
  {
    semitones: 11,
    shortName: "M7",
    name: "Major Seventh",
    ratio: [15, 8],
    ratioLabel: "15 : 8",
    consonance: "Sharp Dissonance",
    consonanceScore: 34,
    feeling: "Dreamy jazz shimmer, one half-step from home",
    songReference: "Take On Me (chorus leap)",
    color: "#FF66C4",
  },
  {
    semitones: 12,
    shortName: "P8",
    name: "Perfect Octave",
    ratio: [2, 1],
    ratioLabel: "2 : 1",
    consonance: "Perfect",
    consonanceScore: 99,
    feeling: "Same note at double frequency, complete cycle",
    songReference: "Somewhere Over the Rainbow",
    color: "#FACC00",
  },
];

export interface ScaleDefinition {
  id: string;
  name: string;
  category: "Diatonic Mode" | "Pentatonic & Blues" | "Symmetric & Exotic";
  intervals: number[];
  stepPattern: string[];
  brightness: number; // -3 (darkest/Locrian) to +3 (brightest/Lydian)
  characterNote: string;
  mood: string;
  description: string;
}

export const SCALES: ScaleDefinition[] = [
  {
    id: "lydian",
    name: "Lydian Mode",
    category: "Diatonic Mode",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    stepPattern: ["W", "W", "W", "H", "W", "W", "H"],
    brightness: 3,
    characterNote: "♯4 (Augmented 4th)",
    mood: "Wonder, levitation, sci-fi magic",
    description:
      "Brighter than Major! Raising the 4th degree by a semitone removes the downward pull to the 3rd, creating weightless cinematic lift.",
  },
  {
    id: "ionian",
    name: "Major (Ionian)",
    category: "Diatonic Mode",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    stepPattern: ["W", "W", "H", "W", "W", "W", "H"],
    brightness: 2,
    characterNote: "Natural 4 & M7",
    mood: "Bright, resolved, triumphant",
    description:
      "The foundational Western reference scale built from two identical W–W–H tetrachords separated by a whole step.",
  },
  {
    id: "mixolydian",
    name: "Mixolydian Mode",
    category: "Diatonic Mode",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    stepPattern: ["W", "W", "H", "W", "W", "H", "W"],
    brightness: 1,
    characterNote: "♭7 (Minor 7th)",
    mood: "Groovy, classic rock, sunlit swagger",
    description:
      "A Major scale with a lowered 7th degree. Keeps the upbeat Major 3rd while replacing the tense leading tone with a bluesy whole-step cadence.",
  },
  {
    id: "dorian",
    name: "Dorian Mode",
    category: "Diatonic Mode",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    stepPattern: ["W", "H", "W", "W", "W", "H", "W"],
    brightness: 0,
    characterNote: "Natural 6 (Major 6th)",
    mood: "Soulful, jazzy, bittersweet groove",
    description:
      "The symmetrically balanced minor mode. Its step pattern reads the same forwards and backwards (W-H-W-W-W-H-W), giving minor keys a silver lining.",
  },
  {
    id: "aeolian",
    name: "Natural Minor (Aeolian)",
    category: "Diatonic Mode",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    stepPattern: ["W", "H", "W", "W", "H", "W", "W"],
    brightness: -1,
    characterNote: "♭6 (Minor 6th)",
    mood: "Melancholic, earnest, dramatic",
    description:
      "The relative minor benchmark. The lowered 6th pulls strongly downward toward the Perfect 5th, creating classic minor gravity.",
  },
  {
    id: "phrygian",
    name: "Phrygian Mode",
    category: "Diatonic Mode",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    stepPattern: ["H", "W", "W", "W", "H", "W", "W"],
    brightness: -2,
    characterNote: "♭2 (Minor 2nd)",
    mood: "Flamenco fire, exotic tension, metal",
    description:
      "Starts immediately with a half-step above the root (♭2), creating an unmistakable Spanish/Middle-Eastern urgency.",
  },
  {
    id: "locrian",
    name: "Locrian Mode",
    category: "Diatonic Mode",
    intervals: [0, 1, 3, 5, 6, 8, 10],
    stepPattern: ["H", "W", "W", "H", "W", "W", "W"],
    brightness: -3,
    characterNote: "♭5 (Diminished 5th)",
    mood: "Unstable, shadowy, enigmatic",
    description:
      "The darkest diatonic mode. Even its fifth is lowered to a tritone, removing the acoustic anchor of the tonic triad.",
  },
  {
    id: "harmonic-minor",
    name: "Harmonic Minor",
    category: "Symmetric & Exotic",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    stepPattern: ["W", "H", "W", "W", "H", "WH", "H"],
    brightness: -1,
    characterNote: "Natural 7 (Leading Tone)",
    mood: "Classical passion, neoclassical drama",
    description:
      "Raises the 7th of Natural Minor to create a true V7 → i cadence, opening a striking 3-semitone gap between ♭6 and 7.",
  },
  {
    id: "major-pentatonic",
    name: "Major Pentatonic",
    category: "Pentatonic & Blues",
    intervals: [0, 2, 4, 7, 9],
    stepPattern: ["W", "W", "WH", "W", "WH"],
    brightness: 2,
    characterNote: "No semitones (4th & 7th omitted)",
    mood: "Universal, folk, consonant",
    description:
      "Five notes generated by stacking 5 consecutive Perfect Fifths. With zero half-steps or tritones, every note sounds harmonious.",
  },
  {
    id: "blues",
    name: "Hexatonic Blues",
    category: "Pentatonic & Blues",
    intervals: [0, 3, 5, 6, 7, 10],
    stepPattern: ["WH", "W", "H", "H", "WH", "W"],
    brightness: 0,
    characterNote: "♭5 ('Blue Note')",
    mood: "Gritty, expressive, vocal",
    description:
      "Minor pentatonic injected with the chromatic ♭5 blue note passing between the 4th and 5th degrees.",
  },
];

export interface ChordQuality {
  id: string;
  name: string;
  symbol: string;
  intervals: number[];
  formula: string[];
  shapeName: string;
  character: string;
  color: string;
}

export const CHORD_QUALITIES: ChordQuality[] = [
  {
    id: "maj",
    name: "Major Triad",
    symbol: "",
    intervals: [0, 4, 7],
    formula: ["1", "3", "5"],
    shapeName: "4 + 3 Semitone Triangle",
    character: "Bright, stable, foundational",
    color: "#FACC00",
  },
  {
    id: "min",
    name: "Minor Triad",
    symbol: "m",
    intervals: [0, 3, 7],
    formula: ["1", "♭3", "5"],
    shapeName: "3 + 4 Semitone Mirror Triangle",
    character: "Poignant, grounded, reflective",
    color: "#7A83FF",
  },
  {
    id: "dim",
    name: "Diminished Triad",
    symbol: "°",
    intervals: [0, 3, 6],
    formula: ["1", "♭3", "♭5"],
    shapeName: "3 + 3 Narrow Wedge",
    character: "Compressed tritone tension seeking resolution",
    color: "#FF4D50",
  },
  {
    id: "aug",
    name: "Augmented Triad",
    symbol: "+",
    intervals: [0, 4, 8],
    formula: ["1", "3", "♯5"],
    shapeName: "Equilateral Triangle (4 + 4 + 4)",
    character: "Dreamlike, symmetrical, floating",
    color: "#FF66C4",
  },
  {
    id: "sus4",
    name: "Suspended 4th",
    symbol: "sus4",
    intervals: [0, 5, 7],
    formula: ["1", "4", "5"],
    shapeName: "5 + 2 Open Fourth",
    character: "Expectant, airborne, neither major nor minor",
    color: "#38BDF8",
  },
  {
    id: "maj7",
    name: "Major Seventh",
    symbol: "maj7",
    intervals: [0, 4, 7, 11],
    formula: ["1", "3", "5", "7"],
    shapeName: "4 + 3 + 4 Trapezoid",
    character: "Lush, nostalgic, sophisticated warmth",
    color: "#00D696",
  },
  {
    id: "dom7",
    name: "Dominant Seventh",
    symbol: "7",
    intervals: [0, 4, 7, 10],
    formula: ["1", "3", "5", "♭7"],
    shapeName: "4 + 3 + 3 Harmonic Engine",
    character: "Contains the 3–♭7 tritone; demands resolution to tonic",
    color: "#FF9F1C",
  },
  {
    id: "min7",
    name: "Minor Seventh",
    symbol: "m7",
    intervals: [0, 3, 7, 10],
    formula: ["1", "♭3", "5", "♭7"],
    shapeName: "3 + 4 + 3 Balanced Quad",
    character: "Smooth, velvet jazz & neo-soul staple",
    color: "#C084FC",
  },
  {
    id: "dim7",
    name: "Fully Diminished 7th",
    symbol: "°7",
    intervals: [0, 3, 6, 9],
    formula: ["1", "♭3", "♭5", "𝄫7"],
    shapeName: "Perfect Square (3 + 3 + 3 + 3)",
    character: "Symmetrical 4-way pivot chord; can resolve to 4 keys",
    color: "#FF4D50",
  },
];

export interface DiatonicDegree {
  degree: number;
  roman: string;
  functionGroup: "Tonic (Home)" | "Subdominant (Bridge)" | "Dominant (Magnet)";
  functionShort: "T" | "SD" | "D";
  triadQuality: "maj" | "min" | "dim";
  seventhQuality: "maj7" | "min7" | "dom7" | "m7b5";
  semitoneOffset: number;
  tendency: string;
  color: string;
}

export const MAJOR_DIATONIC_DEGREES: DiatonicDegree[] = [
  {
    degree: 1,
    roman: "I",
    functionGroup: "Tonic (Home)",
    functionShort: "T",
    triadQuality: "maj",
    seventhQuality: "maj7",
    semitoneOffset: 0,
    tendency: "Center of gravity — complete rest & stability",
    color: "#FACC00",
  },
  {
    degree: 2,
    roman: "ii",
    functionGroup: "Subdominant (Bridge)",
    functionShort: "SD",
    triadQuality: "min",
    seventhQuality: "min7",
    semitoneOffset: 2,
    tendency: "Pre-dominant launchpad — pulls strongly to V",
    color: "#38BDF8",
  },
  {
    degree: 3,
    roman: "iii",
    functionGroup: "Tonic (Home)",
    functionShort: "T",
    triadQuality: "min",
    seventhQuality: "min7",
    semitoneOffset: 4,
    tendency: "Mediant — shares 2 notes with I; flows to vi or IV",
    color: "#00D696",
  },
  {
    degree: 4,
    roman: "IV",
    functionGroup: "Subdominant (Bridge)",
    functionShort: "SD",
    triadQuality: "maj",
    seventhQuality: "maj7",
    semitoneOffset: 5,
    tendency: "Departure from home — sets up V or plagal return to I",
    color: "#7A83FF",
  },
  {
    degree: 5,
    roman: "V",
    functionGroup: "Dominant (Magnet)",
    functionShort: "D",
    triadQuality: "maj",
    seventhQuality: "dom7",
    semitoneOffset: 7,
    tendency: "Maximum harmonic magnet — leading tone resolves up to I",
    color: "#FF4D50",
  },
  {
    degree: 6,
    roman: "vi",
    functionGroup: "Tonic (Home)",
    functionShort: "T",
    triadQuality: "min",
    seventhQuality: "min7",
    semitoneOffset: 9,
    tendency: "Relative minor — emotional shadow of I; deceptive target",
    color: "#C084FC",
  },
  {
    degree: 7,
    roman: "vii°",
    functionGroup: "Dominant (Magnet)",
    functionShort: "D",
    triadQuality: "dim",
    seventhQuality: "m7b5",
    semitoneOffset: 11,
    tendency: "Leading-tone triad — restless tritone collapsing into I",
    color: "#FF9F1C",
  },
];

export interface ProgressionPreset {
  id: string;
  name: string;
  genre: string;
  degrees: number[]; // 1-indexed degrees in Major
  story: string;
}

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    id: "pop-axis",
    name: "I – V – vi – IV",
    genre: "Anthemic Pop",
    degrees: [1, 5, 6, 4],
    story: "Home → Tension → Deceptive Minor Turn → Warm Lift back Home.",
  },
  {
    id: "jazz-turnaround",
    name: "ii – V – I – vi",
    genre: "Jazz Standard",
    degrees: [2, 5, 1, 6],
    story: "Circle-of-fifths motion (D → G → C → Am) with silky 3rd/7th voice swaps.",
  },
  {
    id: "royal-road",
    name: "IV – V – iii – vi",
    genre: "J-Pop / Anime ('Royal Road')",
    degrees: [4, 5, 3, 6],
    story: "Evades the tonic I completely for continuous bittersweet forward momentum.",
  },
  {
    id: "fifties-doo-wop",
    name: "I – vi – IV – V",
    genre: "Classic Soul / 50s",
    degrees: [1, 6, 4, 5],
    story: "Steps down in thirds from Tonic (I → vi → IV) before slingshotting via V.",
  },
  {
    id: "classical-cadence",
    name: "I – IV – ii – V",
    genre: "Classical Cadential Loop",
    degrees: [1, 4, 2, 5],
    story: "Textbook T → SD → SD → D functional architecture.",
  },
];

// Circle of Fifths order (clockwise from 12 o'clock)
export const CIRCLE_OF_FIFTHS_ORDER: number[] = [
  0, // C
  7, // G
  2, // D
  9, // A
  4, // E
  11, // B
  6, // F#
  1, // Db
  8, // Ab
  3, // Eb
  10, // Bb
  5, // F
];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteNameFromPitchClass(pc: number): NoteName {
  return CHROMATIC_NOTES[((pc % 12) + 12) % 12];
}

/** Degree names measured from a major scale on the current home note. */
export const MAJOR_DEGREE_LABELS = [
  "1",
  "♭2",
  "2",
  "♭3",
  "3",
  "4",
  "♯4",
  "5",
  "♭6",
  "6",
  "♭7",
  "7",
] as const;

const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

export function semitoneFromRoot(pc: number, rootPc: number): number {
  return (((pc - rootPc) % 12) + 12) % 12;
}

/**
 * Label a pitch as a step from the home note.
 * Seven-note scales use altered degree names (♭3, ♯4, ♭5).
 * Other collections number the notes they contain, and name the rest
 * the way a major scale would.
 */
export function stepLabel(
  pc: number,
  rootPc: number,
  scale?: ScaleDefinition | null
): string {
  const distance = semitoneFromRoot(pc, rootPc);
  if (!scale) return MAJOR_DEGREE_LABELS[distance];

  const index = scale.intervals.indexOf(distance);
  if (index === -1) return MAJOR_DEGREE_LABELS[distance];

  if (scale.intervals.length !== 7) return String(index + 1);

  const degree = index + 1;
  const delta = distance - MAJOR_SCALE_OFFSETS[index];
  if (delta === 0) return String(degree);
  if (delta === -1) return `♭${degree}`;
  if (delta === 1) return `♯${degree}`;
  if (delta === -2) return `♭♭${degree}`;
  return MAJOR_DEGREE_LABELS[distance];
}

export function midiToNoteLabel(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${CHROMATIC_NOTES[pc]}${octave}`;
}

export function getScalePitchClasses(rootPc: number, scale: ScaleDefinition): number[] {
  return scale.intervals.map((semi) => (rootPc + semi) % 12);
}

export function getChordMidiNotes(
  rootPc: number,
  intervals: number[],
  baseOctave = 4
): number[] {
  const rootMidi = (baseOctave + 1) * 12 + rootPc;
  return intervals.map((semi) => rootMidi + semi);
}

// Compute smooth voice-led MIDI notes for a chord relative to a previous chord
export function getSmoothVoicedChord(
  rootPc: number,
  intervals: number[],
  prevMidis?: number[]
): number[] {
  const bassMidi = 48 + rootPc; // Octave 3 bass
  const upperPitchClasses = intervals.map((semi) => (rootPc + semi) % 12);

  if (!prevMidis || prevMidis.length === 0) {
    return [
      bassMidi,
      ...intervals.map((semi) => 60 + rootPc + semi),
    ];
  }

  const prevUppers = prevMidis.slice(1);
  const voicedUppers = upperPitchClasses.map((pc, idx) => {
    const targetRef = prevUppers[idx] ?? 64;
    let bestMidi = 60 + pc;
    let minDiff = 999;
    for (let oct = 3; oct <= 5; oct++) {
      const candidate = (oct + 1) * 12 + pc;
      if (candidate < 55 || candidate > 79) continue;
      const diff = Math.abs(candidate - targetRef);
      if (diff < minDiff) {
        minDiff = diff;
        bestMidi = candidate;
      }
    }
    return bestMidi;
  });

  voicedUppers.sort((a, b) => a - b);
  return [bassMidi, ...voicedUppers];
}
