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
  | "keyboard"
  | "steps"
  | "major"
  | "intervals"
  | "modes"
  | "triads"
  | "motion"
  | "time"
  | "ear";

export interface Lesson {
  id: string;
  chapter: string;
  short: string;
  title: string;
  teach: string;
  tryThis: string;
  look: string;
  highlight: LessonHighlight;
  labelMode: LabelMode;
  visual: LessonVisual;
}

/**
 * The course walks one idea at a time:
 * a place on the piano, the smallest move, a named distance,
 * a path of steps, the same path with a new home, stacked steps,
 * chords that lean, time, then the ear.
 */
export const LESSONS: Lesson[] = [
  {
    id: "keyboard",
    chapter: "Place",
    short: "Keys",
    title: "One key is one note",
    teach:
      "The piano is a map of pitch. White keys carry the letter names C D E F G A B. Black keys sit in the cracks and borrow a neighbor’s name, raised or lowered. Play any key. The name under your finger is the whole idea: a note is a place you can point to.",
    tryThis:
      "Play the low C, then the high C. Same letter. The second one is an octave higher — the name has come back.",
    look: "An octave, drawn once",
    highlight: "octave",
    labelMode: "notes",
    visual: "keyboard",
  },
  {
    id: "steps",
    chapter: "Place",
    short: "Steps",
    title: "The smallest move",
    teach:
      "From any key to the very next key, white or black, is a half step. Skip one key and you have moved a whole step. Switch the piano from note names to step numbers. Home is 1. The next key is ♭2, one half step up. The key after that is 2, a whole step above home.",
    tryThis:
      "Turn on Steps. Play 1, then the next key, then 2. Say “half” for the first move and “whole” for both moves together.",
    look: "A half step, then a whole step",
    highlight: "neighbors",
    labelMode: "steps",
    visual: "steps",
  },
  {
    id: "intervals",
    chapter: "Distance",
    short: "Intervals",
    title: "A distance with a name",
    teach:
      "Once you can count, each distance gets a name. That name is an interval. A perfect fifth is seven half steps, and its two waves meet often, in a simple 3 to 2 ratio, which is why it sounds solid. A minor second is one half step, and the waves beat against each other. The picture and the piano are the same two notes.",
    tryThis:
      "Choose the perfect fifth. Listen to the two notes together, then find 1 and 5 on the piano and play them yourself.",
    look: "Two notes, and the waves they make",
    highlight: "interval",
    labelMode: "steps",
    visual: "intervals",
  },
  {
    id: "major",
    chapter: "Path",
    short: "Major",
    title: "A walk called major",
    teach:
      "A major scale is not a list to memorize. It is a walk from home: whole, whole, half, whole, whole, whole, half. In step numbers that walk reads 1 2 3 4 5 6 7 and back to 1. The short moves always fall in the same two places — between 3 and 4, and between 7 and 1.",
    tryThis:
      "Play the walk and watch which moves are short. Then play 1 through 7 on the piano with step labels on.",
    look: "Whole steps and half steps, in order",
    highlight: "scale",
    labelMode: "steps",
    visual: "major",
  },
  {
    id: "modes",
    chapter: "Path",
    short: "Modes",
    title: "The same notes, a new home",
    teach:
      "Keep a major scale’s notes and start somewhere else. You did not learn seven new scales. You moved home. Each new home changes one degree compared with the mode beside it. Brighter modes raise a degree. Darker modes lower one. The step numbers on the piano show which degree moved.",
    tryThis:
      "Start at the bright end and step toward the dark end. Listen once before you look for the number that changed.",
    look: "Seven homes, from bright to dark",
    highlight: "scale",
    labelMode: "steps",
    visual: "modes",
  },
  {
    id: "triads",
    chapter: "Harmony",
    short: "Chords",
    title: "Steps 1, 3, and 5",
    teach:
      "A chord is a scale stacked, not a new alphabet. Take 1, skip to 3, skip to 5. Those three notes draw a triangle. Major is four half steps, then three. Minor flips that: three, then four. The fifth stays. Only step 3 changes, and that is the difference between bright and dark.",
    tryThis:
      "Switch between major and minor. Read the piano. You should see 1 3 5, then 1 ♭3 5.",
    look: "The chord, drawn on a clock",
    highlight: "chord",
    labelMode: "steps",
    visual: "triads",
  },
  {
    id: "motion",
    chapter: "Harmony",
    short: "Motion",
    title: "Chords lean toward home",
    teach:
      "A progression is a sentence. The I chord rests. IV and ii step away from home. V leans back, because one of its notes sits a half step under 1 and wants to rise. A good voice barely moves: it stays, or it slides by a step or two.",
    tryThis:
      "Start the loop and follow a single voice. If it jumps across the piano, the line is working too hard.",
    look: "Four chords, and how the voices move",
    highlight: "sounding",
    labelMode: "steps",
    visual: "motion",
  },
  {
    id: "time",
    chapter: "Time",
    short: "Time",
    title: "Two even pulses, one cycle",
    teach:
      "Everything so far was a step across the keyboard. Rhythm is a step across time. A polyrhythm is two steady pulses that share a downbeat and disagree in between. Three against two means one part cuts the cycle into three equal hits, the other into two. They meet again only when the wheel returns to the top.",
    tryThis:
      "Start the wheel. Count the outer hits, then the inner. Tap the home note each time the hand passes the top.",
    look: "Two polygons sharing one cycle",
    highlight: "home",
    labelMode: "notes",
    visual: "time",
  },
  {
    id: "ear",
    chapter: "Ear",
    short: "Ear",
    title: "Hear it, then check",
    teach:
      "The pictures were a way in. This lesson waits to show them until you answer. You will hear an interval, then a chord, then a mode — the same order you just walked. Guess from the sound, then look. The note after you answer names the steps you already know.",
    tryThis:
      "Play the prompt twice before you choose. Hum the lower note first, so every other note has a home to stand on.",
    look: "Listen first. The picture comes after your answer.",
    highlight: "none",
    labelMode: "notes",
    visual: "ear",
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
