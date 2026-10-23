import { CHROMATIC_NOTES, INTERVALS, SCALES, type ScaleDefinition } from "@/lib/music-theory";
import { keyByFifths, MAJOR_KEYS, spellMidi, type Clef } from "@/lib/notation";

export type ExerciseKind =
  | "name-note"
  | "find-note"
  | "duration"
  | "meter"
  | "half-whole"
  | "interval"
  | "scale-degree"
  | "key-signature"
  | "relative-minor"
  | "mode-shift"
  | "chord-quality"
  | "inversion"
  | "cadence"
  | "rhythm-count";

export interface ExerciseQuestion {
  key: string;
  prompt: string;
  clef?: Clef;
  midis?: number[];
  fifths?: number;
  choices?: { id: string; label: string }[];
  answerId?: string;
  playMidis?: number[];
  findPitchClass?: number;
  divisions?: number;
  groups?: number[];
}

const TREBLE_NATURALS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77];
const DURATIONS = [
  { id: "whole", label: "Whole", divisions: 1 },
  { id: "half", label: "Half", divisions: 2 },
  { id: "quarter", label: "Quarter", divisions: 4 },
  { id: "eighth", label: "Eighth", divisions: 8 },
];
const METERS = [
  { id: "2/4", label: "2/4", groups: [1, 1] },
  { id: "3/4", label: "3/4", groups: [1, 1, 1] },
  { id: "4/4", label: "4/4", groups: [1, 1, 1, 1] },
  { id: "6/8", label: "6/8", groups: [1, 1, 1, 1, 1, 1] },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function choiceSet(
  correct: { id: string; label: string },
  pool: { id: string; label: string }[],
  count = 4
) {
  const extras = shuffle(pool.filter((item) => item.id !== correct.id)).slice(0, count - 1);
  return shuffle([correct, ...extras]);
}

function id() {
  return Math.random().toString(36).slice(2, 8);
}

export function makeQuestion(
  kind: ExerciseKind,
  rootPc: number,
  scale?: ScaleDefinition | null
): ExerciseQuestion {
  if (kind === "name-note" || kind === "find-note") {
    const midi = pick(TREBLE_NATURALS);
    const spelled = spellMidi(midi);
    const choices = choiceSet(
      { id: spelled.name, label: spelled.name },
      TREBLE_NATURALS.map((note) => {
        const name = spellMidi(note).name;
        return { id: name, label: name };
      })
    );
    return {
      key: id(),
      prompt:
        kind === "find-note"
          ? "Play this note on the piano or the guitar."
          : "Name the note on the staff.",
      clef: "treble",
      midis: [midi],
      choices: kind === "name-note" ? choices : undefined,
      answerId: spelled.name,
      findPitchClass: kind === "find-note" ? midi % 12 : undefined,
      playMidis: [midi],
    };
  }

  if (kind === "duration") {
    const value = pick(DURATIONS);
    return {
      key: id(),
      prompt: "How is this bar divided?",
      divisions: value.divisions,
      choices: DURATIONS.map((item) => ({ id: item.id, label: item.label })),
      answerId: value.id,
    };
  }

  if (kind === "meter") {
    const meter = pick(METERS);
    return {
      key: id(),
      prompt: "Which meter matches this grouping? The first of each group is the strong beat.",
      groups: meter.groups,
      choices: METERS.map((item) => ({ id: item.id, label: item.label })),
      answerId: meter.id,
    };
  }

  if (kind === "half-whole") {
    const half = Math.random() > 0.5;
    const lower = 64;
    const upper = lower + (half ? 1 : 2);
    return {
      key: id(),
      prompt: "What kind of step is this?",
      clef: "treble",
      midis: [lower, upper],
      playMidis: [lower, upper],
      choices: [
        { id: "half", label: "Half step" },
        { id: "whole", label: "Whole step" },
      ],
      answerId: half ? "half" : "whole",
    };
  }

  if (kind === "interval") {
    const options = [3, 4, 5, 7, 8, 9, 12].map((semitones) => INTERVALS[semitones]);
    const chosen = pick(options);
    const lower = 60 + rootPc;
    return {
      key: id(),
      prompt: "Name the interval on the staff.",
      clef: "treble",
      midis: [lower, lower + chosen.semitones],
      playMidis: [lower, lower + chosen.semitones],
      choices: choiceSet(
        { id: chosen.shortName, label: chosen.name },
        options.map((interval) => ({ id: interval.shortName, label: interval.name }))
      ),
      answerId: chosen.shortName,
    };
  }

  if (kind === "scale-degree") {
    const degree = pick([1, 2, 3, 4, 5, 6, 7]);
    const major = [0, 2, 4, 5, 7, 9, 11];
    const midi = 60 + rootPc + major[degree - 1];
    return {
      key: id(),
      prompt: `Which step of ${CHROMATIC_NOTES[rootPc]} major is this?`,
      clef: "treble",
      midis: [midi],
      playMidis: [midi],
      choices: choiceSet(
        { id: String(degree), label: String(degree) },
        [1, 2, 3, 4, 5, 6, 7].map((step) => ({ id: String(step), label: String(step) }))
      ),
      answerId: String(degree),
    };
  }

  if (kind === "key-signature") {
    const key = pick(MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 5));
    return {
      key: id(),
      prompt: "Which major key uses this signature?",
      clef: "treble",
      fifths: key.fifths,
      midis: [60 + key.tonicPc],
      choices: choiceSet(
        { id: key.major, label: `${key.major} major` },
        MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 5).map((item) => ({
          id: item.major,
          label: `${item.major} major`,
        }))
      ),
      answerId: key.major,
    };
  }

  if (kind === "relative-minor") {
    const key = pick(MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 4));
    return {
      key: id(),
      prompt: `${key.major} major shares its signature with which minor key?`,
      clef: "treble",
      fifths: key.fifths,
      midis: [60 + ((key.tonicPc + 9) % 12)],
      choices: choiceSet(
        { id: key.minor, label: `${key.minor} minor` },
        MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 4).map((item) => ({
          id: item.minor,
          label: `${item.minor} minor`,
        }))
      ),
      answerId: key.minor,
    };
  }

  if (kind === "mode-shift") {
    const mode = scale && scale.intervals.length === 7 ? scale : SCALES[1];
    const major = [0, 2, 4, 5, 7, 9, 11];
    const altered = mode.intervals
      .map((semi, index) => (semi === major[index] ? -1 : index + 1))
      .filter((degree) => degree > 0);
    const degree = altered[0] ?? 0;
    const correct =
      degree === 0
        ? { id: "same", label: "None — it is major" }
        : { id: String(degree), label: `Step ${degree}` };
    const pool = [
      { id: "same", label: "None — it is major" },
      { id: "2", label: "Step 2" },
      { id: "3", label: "Step 3" },
      { id: "4", label: "Step 4" },
      { id: "6", label: "Step 6" },
      { id: "7", label: "Step 7" },
    ].filter((item) => degree === 0 || !altered.includes(Number(item.id)) || item.id === String(degree));
    return {
      key: id(),
      prompt: `Compared with major, which step moved in ${mode.name}?`,
      choices: choiceSet(correct, pool),
      answerId: correct.id,
    };
  }

  if (kind === "chord-quality") {
    const qualities = [
      { id: "maj", label: "Major", intervals: [0, 4, 7] },
      { id: "min", label: "Minor", intervals: [0, 3, 7] },
      { id: "dim", label: "Diminished", intervals: [0, 3, 6] },
      { id: "aug", label: "Augmented", intervals: [0, 4, 8] },
    ];
    const chosen = pick(qualities);
    const base = 60 + rootPc;
    return {
      key: id(),
      prompt: "What quality is this triad?",
      clef: "treble",
      midis: chosen.intervals.map((semi) => base + semi),
      playMidis: chosen.intervals.map((semi) => base + semi),
      choices: qualities.map((item) => ({ id: item.id, label: item.label })),
      answerId: chosen.id,
    };
  }

  if (kind === "inversion") {
    const inversions = [
      { id: "root", label: "Root", intervals: [0, 4, 7] },
      { id: "first", label: "First", intervals: [4, 7, 12] },
      { id: "second", label: "Second", intervals: [7, 12, 16] },
    ];
    const chosen = pick(inversions);
    const base = 60 + rootPc;
    return {
      key: id(),
      prompt: "Which inversion is this?",
      clef: "treble",
      midis: chosen.intervals.map((semi) => base + semi),
      playMidis: chosen.intervals.map((semi) => base + semi),
      choices: inversions.map((item) => ({ id: item.id, label: item.label })),
      answerId: chosen.id,
    };
  }

  if (kind === "cadence") {
    const targets = [
      { id: "I", label: "I, home", intervals: [0, 4, 7] },
      { id: "IV", label: "IV", intervals: [5, 9, 12] },
      { id: "ii", label: "ii", intervals: [2, 5, 9] },
      { id: "vi", label: "vi", intervals: [9, 12, 16] },
    ];
    const chosen = pick(targets);
    const base = 60 + rootPc;
    const target = chosen.intervals.map((semi) => base + semi);
    return {
      key: id(),
      prompt: `In ${CHROMATIC_NOTES[rootPc]} major, which numeral is this chord?`,
      playMidis: target,
      clef: "treble",
      midis: target,
      choices: targets.map((item) => ({ id: item.id, label: item.label })),
      answerId: chosen.id,
    };
  }

  return {
    key: id(),
    prompt: "Two pulses share one cycle: 3 outside, 2 inside. How many times do they land together?",
    choices: [
      { id: "1", label: "Once, at the top" },
      { id: "2", label: "Twice" },
      { id: "3", label: "Three times" },
      { id: "6", label: "Six times" },
    ],
    answerId: "1",
  };
}

export function keyName(fifths: number) {
  return keyByFifths(fifths).major;
}
