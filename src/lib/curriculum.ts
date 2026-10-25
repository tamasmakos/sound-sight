import type { ExerciseKind } from "@/lib/exercises";

export type LessonHighlight =
  | "octave"
  | "neighbors"
  | "interval"
  | "scale"
  | "chord"
  | "sounding"
  | "home"
  | "none";

export type LabelMode = "notes" | "steps";

export type LessonVisual =
  | "staff"
  | "grand"
  | "rhythm"
  | "meter"
  | "steps"
  | "intervals"
  | "major"
  | "keys"
  | "minor"
  | "modes"
  | "triads"
  | "inversions"
  | "motion"
  | "time"
  | "ear";

export interface Lesson {
  id: string;
  chapter: string;
  short: string;
  title: string;
  teach: string;
  look: string;
  highlight: LessonHighlight;
  labelMode: LabelMode;
  visual: LessonVisual;
  exercise?: ExerciseKind;
}

/**
 * Reading first, then pitch as geometry, then keys, harmony, time, and the ear.
 * Each lesson is a picture you can play, then a short check.
 */
export const LESSONS: Lesson[] = [
  {
    id: "staff",
    chapter: "Reading",
    short: "Lines",
    title: "Five lines, four spaces",
    teach:
      "The staff is a ladder. Lines and spaces alternate, and each rung is the next letter. The middle line of the treble staff is B4. Count letters up or down from that axis.",
    look: "Play a key. The small staff writes that pitch in the same color.",
    highlight: "home",
    labelMode: "notes",
    visual: "staff",
    exercise: "name-note",
  },
  {
    id: "grand",
    chapter: "Reading",
    short: "Clefs",
    title: "Two staves, one middle C",
    teach:
      "Treble and bass are mirrors around middle C. The same letter sits on a line in one clef and a space in the other. Middle C is the ledger line between them.",
    look: "The grand staff, folded around one note.",
    highlight: "home",
    labelMode: "notes",
    visual: "grand",
    exercise: "find-note",
  },
  {
    id: "rhythm",
    chapter: "Pulse",
    short: "Lengths",
    title: "A bar cut into equal pieces",
    teach:
      "A whole note fills the bar. Cut it in half, then half again, and you get halves, quarters, and eighths. The picture is the same rectangle, divided into more equal cells.",
    look: "One bar, four ways of cutting it.",
    highlight: "home",
    labelMode: "notes",
    visual: "rhythm",
    exercise: "duration",
  },
  {
    id: "meter",
    chapter: "Pulse",
    short: "Meter",
    title: "Groups, and a strong beat",
    teach:
      "Meter is how the bar is grouped. The first cell of each group is the strong beat. 4/4 is four equal beats. 6/8 is two groups of three.",
    look: "Strong beats in yellow.",
    highlight: "home",
    labelMode: "notes",
    visual: "meter",
    exercise: "meter",
  },
  {
    id: "steps",
    chapter: "Pitch",
    short: "Steps",
    title: "Half step, whole step",
    teach:
      "The next key, white or black, is a half step. Skip one key and the move is a whole step. On the staff a half step can stay on the same letter. A whole step usually changes letter.",
    look: "Home, one key up, two keys up.",
    highlight: "neighbors",
    labelMode: "steps",
    visual: "steps",
    exercise: "half-whole",
  },
  {
    id: "intervals",
    chapter: "Pitch",
    short: "Intervals",
    title: "A distance with a shape",
    teach:
      "Count the half steps and the interval has a name. Simple ratios draw open loops. Dense ratios knot. The staff, the ruler, and the two keys are the same distance.",
    look: "Two notes, their waves, and a 13-cell ruler.",
    highlight: "interval",
    labelMode: "steps",
    visual: "intervals",
    exercise: "interval",
  },
  {
    id: "major",
    chapter: "Pitch",
    short: "Major",
    title: "A walk of whole and half",
    teach:
      "Major is a path, not a list: whole, whole, half, whole, whole, whole, half. The short moves always sit between 3 and 4, and between 7 and 1.",
    look: "The scale on the staff, then the walk.",
    highlight: "scale",
    labelMode: "steps",
    visual: "major",
    exercise: "scale-degree",
  },
  {
    id: "keys",
    chapter: "Keys",
    short: "Signatures",
    title: "Fifths add one accidental",
    teach:
      "Clockwise is up a fifth and one new sharp. Counterclockwise is down a fifth and one new flat. The signature is those accidentals, written on the letters they change.",
    look: "The circle, and the signature on the staff.",
    highlight: "scale",
    labelMode: "notes",
    visual: "keys",
    exercise: "key-signature",
  },
  {
    id: "minor",
    chapter: "Keys",
    short: "Minor",
    title: "The same signature, three semitones down",
    teach:
      "Relative minor shares every accidental with its major. Its home is a minor third under the major home — the same flip that turns a major triad minor.",
    look: "Two homes, one signature.",
    highlight: "interval",
    labelMode: "steps",
    visual: "minor",
    exercise: "relative-minor",
  },
  {
    id: "modes",
    chapter: "Keys",
    short: "Modes",
    title: "Move home, one degree changes",
    teach:
      "A mode keeps a scale’s notes and starts on a new degree. Against major, one step is raised or lowered. Brighter modes raise a degree. Darker modes lower one.",
    look: "Seven homes, bright to dark.",
    highlight: "scale",
    labelMode: "steps",
    visual: "modes",
    exercise: "mode-shift",
  },
  {
    id: "triads",
    chapter: "Harmony",
    short: "Triads",
    title: "1, 3, and 5 make a triangle",
    teach:
      "Stack every other scale step and you get a chord. Major is 4 half steps then 3. Minor flips that. A diminished triangle is tighter. An augmented one is equal on every side.",
    look: "The chord, drawn on a 12-hour clock.",
    highlight: "chord",
    labelMode: "steps",
    visual: "triads",
    exercise: "chord-quality",
  },
  {
    id: "inversions",
    chapter: "Harmony",
    short: "Inversions",
    title: "Turn the triangle, the bass changes",
    teach:
      "The same three notes, with a different corner on the bottom. Root puts 1 in the bass. First inversion puts 3 there. Second puts 5 there. The shape rotates. The pitch set does not.",
    look: "One triangle, three basses.",
    highlight: "chord",
    labelMode: "steps",
    visual: "inversions",
    exercise: "inversion",
  },
  {
    id: "motion",
    chapter: "Harmony",
    short: "Motion",
    title: "Chords lean toward home",
    teach:
      "I rests. IV and ii step away. V pulls back, because one note sits a half step under home. A voice should stay, or move by a step.",
    look: "Seven degrees, then four bars.",
    highlight: "sounding",
    labelMode: "steps",
    visual: "motion",
    exercise: "cadence",
  },
  {
    id: "time",
    chapter: "Cycles",
    short: "Cycles",
    title: "Two even pulses, one wheel",
    teach:
      "Three against two cuts one cycle into two polygons. They share the top of the wheel and disagree until the cycle closes. That single shared point is the downbeat.",
    look: "Two polygons on one circle.",
    highlight: "home",
    labelMode: "notes",
    visual: "time",
    exercise: "rhythm-count",
  },
  {
    id: "ear",
    chapter: "Ear",
    short: "Ear",
    title: "Hear it, then see it",
    teach:
      "Name the interval, the chord, or the mode from the sound. The staff appears after you answer, so the picture confirms what you already heard.",
    look: "Listen first. Then play it back on the instrument.",
    highlight: "none",
    labelMode: "notes",
    visual: "ear",
    exercise: "playback",
  },
];

export function lessonIndex(id: string): number {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index === -1 ? 0 : index;
}

export function lessonsByChapter(): { chapter: string; lessons: Lesson[] }[] {
  const chapters: { chapter: string; lessons: Lesson[] }[] = [];
  for (const lesson of LESSONS) {
    const last = chapters[chapters.length - 1];
    if (!last || last.chapter !== lesson.chapter) {
      chapters.push({ chapter: lesson.chapter, lessons: [lesson] });
    } else {
      last.lessons.push(lesson);
    }
  }
  return chapters;
}
