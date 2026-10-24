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
  | "rhythm-count"
  | "playback";

export type PracticeReveal = "staff" | "signature" | "name" | "hear" | "bar";

export interface PracticeTask {
  key: string;
  prompt: string;
  detail: string;
  targetMidis: number[];
  /** pitch compares names. exact compares the written octave. */
  match: "pitch" | "exact";
  /** When set, the last taps must follow these pitch classes in order. */
  sequence?: number[];
  clef?: Clef;
  fifths?: number;
  reveal: PracticeReveal;
  hearMidis?: number[];
  guidePitchClasses?: number[];
  divisions?: number;
  groups?: number[];
}

const READABLE = [60, 62, 64, 65, 67, 69, 71, 72, 74];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function id() {
  return Math.random().toString(36).slice(2, 8);
}

function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function answerMatches(task: PracticeTask, played: number[], taps: number[]): boolean {
  if (task.sequence) {
    if (taps.length < task.sequence.length) return false;
    const recent = taps.slice(-task.sequence.length);
    return recent.every((midi, index) => pitchClass(midi) === task.sequence![index]);
  }
  if (played.length === 0) return false;
  if (task.match === "exact") {
    const left = uniqueSorted(played);
    const right = uniqueSorted(task.targetMidis);
    return left.length === right.length && left.every((midi, index) => midi === right[index]);
  }
  const left = uniqueSorted(played.map(pitchClass));
  const right = uniqueSorted(task.targetMidis.map(pitchClass));
  return left.length === right.length && left.every((midi, index) => midi === right[index]);
}

function playNote(midi: number, prompt: string, detail: string, clef: Clef = "treble"): PracticeTask {
  return {
    key: id(),
    prompt,
    detail,
    targetMidis: [midi],
    match: "exact",
    reveal: "staff",
    clef,
    fifths: 0,
  };
}

function placeNote(midi: number): PracticeTask {
  const name = spellMidi(midi).name;
  return {
    key: id(),
    prompt: `Place ${name} on the staff.`,
    detail: "Move the hollow note with the arrows, then press Add. The same pitch lights on the instrument.",
    targetMidis: [midi],
    match: "exact",
    reveal: "name",
  };
}

export function makePracticeTasks(
  kind: ExerciseKind,
  rootPc: number,
  scale?: ScaleDefinition | null
): PracticeTask[] {
  const home = 60 + rootPc;
  const homePc = pitchClass(home);

  if (kind === "name-note") {
    const notes = [pick(READABLE), pick(READABLE), pick(READABLE), pick(READABLE)];
    return notes.map((midi, index) =>
      index % 2 === 0
        ? playNote(midi, "Play the note you see.", "Find that exact pitch on the piano or the guitar.")
        : placeNote(midi)
    );
  }

  if (kind === "find-note") {
    const treble = pick(READABLE);
    const bass = pick([60, 62, 64, 65, 67]);
    return [
      playNote(treble, "Play the treble note.", "Same pitch, either instrument."),
      playNote(bass, "Play the bass note.", "Middle C and the notes just above it sit on the bass staff too.", "bass"),
      placeNote(pick(READABLE)),
      playNote(60, "Play middle C.", "One ledger line below the treble staff. One ledger line above the bass staff."),
    ];
  }

  if (kind === "duration") {
    return [1, 2, 4, 8].map((divisions) => ({
      key: id(),
      prompt: `Tap the home note once for each slice. This bar has ${divisions}.`,
      detail: "Each tap counts, even if you lift the note between them.",
      targetMidis: [home],
      match: "pitch" as const,
      sequence: Array.from({ length: divisions }, () => homePc),
      reveal: "bar" as const,
      divisions,
      guidePitchClasses: [homePc],
    }));
  }

  if (kind === "meter") {
    const meters = [
      { label: "2/4", groups: [2], strong: [true, false] },
      { label: "3/4", groups: [3], strong: [true, false, false] },
      { label: "4/4", groups: [4], strong: [true, false, false, false] },
      { label: "6/8", groups: [3, 3], strong: [true, false, false, true, false, false] },
    ];
    return meters.map((meter) => ({
      key: id(),
      prompt: `${meter.label}. Play home on each yellow beat, and a fifth higher on the others.`,
      detail: "Play them in order. Home is step 1. The fifth is step 5.",
      targetMidis: [home, home + 7],
      match: "pitch" as const,
      sequence: meter.strong.map((beat) => pitchClass(beat ? home : home + 7)),
      reveal: "bar" as const,
      groups: meter.groups,
      guidePitchClasses: [homePc, pitchClass(home + 7)],
    }));
  }

  if (kind === "half-whole") {
    return [1, 2, 1, 2].map((semitones) => {
      const lower = pick([60, 62, 64, 65]);
      const upper = lower + semitones;
      return {
        key: id(),
        prompt: semitones === 1 ? "Play this half step." : "Play this whole step.",
        detail: "Both notes. A half step is the next key. A whole step skips one.",
        targetMidis: [lower, upper],
        match: "exact" as const,
        reveal: "staff" as const,
        clef: "treble" as const,
      };
    });
  }

  if (kind === "interval") {
    const options = [3, 4, 5, 7, 8, 9, 12];
    return options.slice(0, 4).map((semitones) => {
      const interval = INTERVALS[semitones];
      const lower = home;
      const pair = [lower, lower + semitones];
      const heard = semitones === 7 || semitones === 12;
      return {
        key: id(),
        prompt: heard ? `Hear the ${interval.name}, then play both notes.` : `Play this ${interval.name}.`,
        detail: "The two pitch names have to match. Octave is yours.",
        targetMidis: pair,
        match: "pitch" as const,
        reveal: heard ? ("hear" as const) : ("staff" as const),
        hearMidis: pair,
        clef: "treble" as const,
      };
    });
  }

  if (kind === "scale-degree") {
    return [1, 3, 5, 7].map((degree) => {
      const midi = home + MAJOR[degree - 1];
      return {
        key: id(),
        prompt: degree === 5 ? `Play step ${degree} of ${CHROMATIC_NOTES[rootPc]} major.` : "Play the scale step written on the staff.",
        detail: "Steps count up the major scale from home. 1 is home.",
        targetMidis: [midi],
        match: "pitch" as const,
        reveal: degree === 5 ? ("name" as const) : ("staff" as const),
        clef: "treble" as const,
        guidePitchClasses: MAJOR.map((semi) => pitchClass(home + semi)),
      };
    });
  }

  if (kind === "key-signature") {
    const keys = MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 5 && Math.abs(item.fifths) > 0);
    return [0, 1, 2, 3].map((index) => {
      const key = keys[index % keys.length] ?? pick(keys);
      const place = index % 2 === 1;
      return {
        key: id(),
        prompt: place
          ? `Place the home of ${key.major} major on the staff.`
          : "Play the major home of this signature.",
        detail: "The last sharp sits a half step under home. The last flat is home, four flats and beyond.",
        targetMidis: [60 + key.tonicPc],
        match: "pitch" as const,
        reveal: place ? ("name" as const) : ("signature" as const),
        clef: "treble" as const,
        fifths: key.fifths,
      };
    });
  }

  if (kind === "relative-minor") {
    const keys = MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 4);
    return [0, 1, 2, 3].map((index) => {
      const key = keys[(index * 3) % keys.length];
      const minorMidi = 60 + pitchClass(key.tonicPc + 9);
      return {
        key: id(),
        prompt:
          index % 2 === 0
            ? "Play the minor home that shares this signature."
            : `Play the relative minor of ${key.major} major.`,
        detail: "Same signature. The minor home is three semitones under the major home.",
        targetMidis: [minorMidi],
        match: "pitch" as const,
        reveal: index % 2 === 0 ? ("signature" as const) : ("name" as const),
        clef: "treble" as const,
        fifths: key.fifths,
        guidePitchClasses: [key.tonicPc, pitchClass(key.tonicPc + 9)],
      };
    });
  }

  if (kind === "mode-shift") {
    const pool = SCALES.filter((item) => item.intervals.length === 7 && item.id !== "ionian");
    const preferred = scale && pool.some((item) => item.id === scale.id) ? scale : null;
    const modes = preferred
      ? [preferred, ...pool.filter((item) => item.id !== preferred.id)].slice(0, 4)
      : pool.slice(0, 4);
    return modes.map((mode) => {
      const altered = mode.intervals.findIndex((semi, index) => semi !== MAJOR[index]);
      const midi = home + mode.intervals[Math.max(0, altered)];
      return {
        key: id(),
        prompt: `Play the one step ${mode.name} changes from major.`,
        detail: "The tinted keys are the mode. Play only the step that differs from major.",
        targetMidis: [midi],
        match: "pitch" as const,
        reveal: "name" as const,
        guidePitchClasses: mode.intervals.map((semi) => pitchClass(home + semi)),
      };
    });
  }

  if (kind === "chord-quality") {
    const qualities = [
      { name: "major", intervals: [0, 4, 7] },
      { name: "minor", intervals: [0, 3, 7] },
      { name: "diminished", intervals: [0, 3, 6] },
      { name: "augmented", intervals: [0, 4, 8] },
    ];
    return qualities.map((quality, index) => {
      const midis = quality.intervals.map((semi) => home + semi);
      const heard = index % 2 === 0;
      return {
        key: id(),
        prompt: heard
          ? "Hear the triad, then play the same three notes."
          : `Build a ${quality.name} triad on ${CHROMATIC_NOTES[rootPc]}.`,
        detail: "Three pitch names. Any octave. Extra notes do not count.",
        targetMidis: midis,
        match: "pitch" as const,
        reveal: heard ? ("hear" as const) : ("name" as const),
        hearMidis: midis,
        guidePitchClasses: heard ? undefined : [homePc],
      };
    });
  }

  if (kind === "inversion") {
    const shapes = [
      { name: "root position", intervals: [0, 4, 7] },
      { name: "first inversion", intervals: [4, 7, 12] },
      { name: "second inversion", intervals: [7, 12, 16] },
      { name: "root position", intervals: [0, 3, 7] },
    ];
    return shapes.map((shape) => ({
      key: id(),
      prompt: `Play this ${shape.name}.`,
      detail: "Match the three written pitches, including the octave.",
      targetMidis: shape.intervals.map((semi) => home + semi),
      match: "exact" as const,
      reveal: "staff" as const,
      clef: "treble" as const,
    }));
  }

  if (kind === "cadence") {
    const chords = [
      { name: "I", intervals: [0, 4, 7] },
      { name: "IV", intervals: [5, 9, 12] },
      { name: "V", intervals: [7, 11, 14] },
      { name: "vi", intervals: [9, 12, 16] },
    ];
    return chords.map((chord, index) => {
      const midis = chord.intervals.map((semi) => home + semi);
      return {
        key: id(),
        prompt:
          index % 2 === 0
            ? `Play ${chord.name} in ${CHROMATIC_NOTES[rootPc]} major.`
            : "Play the chord on the staff.",
        detail: "The bass is the bottom note. The other two complete the triad.",
        targetMidis: midis,
        match: "pitch" as const,
        reveal: index % 2 === 0 ? ("name" as const) : ("staff" as const),
        clef: "treble" as const,
        guidePitchClasses: MAJOR.map((semi) => pitchClass(home + semi)),
      };
    });
  }

  if (kind === "playback") {
    const interval = INTERVALS[7];
    const fifth = [home, home + interval.semitones];
    const minor = [home, home + 3, home + 7];
    const major = [home, home + 4, home + 7];
    const fourth = [home, home + 5];
    return [fifth, minor, major, fourth].map((midis, index) => ({
      key: id(),
      prompt: index % 2 === 0 ? "Hear it, then play the same notes." : "Hear the chord, then play it back.",
      detail: "The instrument stays dark until you play. Match the pitch names.",
      targetMidis: midis,
      match: "pitch" as const,
      reveal: "hear" as const,
      hearMidis: midis,
    }));
  }

  return [
    {
      key: id(),
      prompt: "Play the home note once. That is the beat the two pulses share.",
      detail: "One pitch. The downbeat.",
      targetMidis: [home],
      match: "pitch",
      reveal: "name",
      guidePitchClasses: [homePc],
    },
    {
      key: id(),
      prompt: "Play home, a major third up, and a fifth up, together.",
      detail: "Three notes of the outer pulse, sounding as one chord.",
      targetMidis: [home, home + 4, home + 7],
      match: "pitch",
      reveal: "name",
    },
    playNote(home, "Play the written downbeat.", "The shared point of the wheel."),
    {
      key: id(),
      prompt: "Tap home three times for the outer pulse.",
      detail: "Three taps, one pitch.",
      targetMidis: [home],
      match: "pitch",
      sequence: [homePc, homePc, homePc],
      reveal: "name",
      guidePitchClasses: [homePc],
    },
  ];
}

export function keyName(fifths: number) {
  return keyByFifths(fifths).major;
}
