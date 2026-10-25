"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CHORD_QUALITIES,
  SCALES,
  ChordQuality,
  IntervalInfo,
  ScaleDefinition,
  semitoneFromRoot,
} from "@/lib/music-theory";
import {
  LESSONS,
  lessonsByChapter,
  lessonIndex,
  Lesson,
} from "@/lib/curriculum";
import type { LabelMode } from "@/lib/curriculum";
import { soundEngine, type AudioPhase } from "@/lib/audio-engine";
import { InstrumentStage, type InstrumentId } from "@/components/InstrumentStage";
import { usePerformance } from "@/components/use-performance";
import { PitchWalk } from "@/components/PitchWalk";
import { HarmonicGeometryLab } from "@/components/HarmonicGeometryLab";
import { IntervalWaveLab } from "@/components/IntervalWaveLab";
import { ScaleModeLab } from "@/components/ScaleModeLab";
import { ChordFlowLab } from "@/components/ChordFlowLab";
import { PolyrhythmOrbitLab } from "@/components/PolyrhythmOrbitLab";
import { EarGym } from "@/components/EarGym";
import { keyByFifths } from "@/lib/notation";
import {
  GrandStaffLesson,
  InversionLesson,
  KeySignatureLesson,
  MeterLesson,
  MinorLesson,
  RhythmLesson,
  StaffLesson,
} from "@/components/ReadingDesk";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Music, Volume2 } from "lucide-react";

const IONIAN = SCALES.find((scale) => scale.id === "ionian")!;
const CHAPTERS = lessonsByChapter();
const INITIAL_SHAPE_STEPS = [2, 5, 9];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12];
const INVERSIONS = [
  [0, 4, 7],
  [4, 7, 12],
  [7, 12, 16],
];

export function CourseApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedLesson = LESSONS.find((item) => item.id === searchParams.get("lesson")) ?? LESSONS[0];
  const [lessonId, setLessonId] = React.useState(requestedLesson.id);
  const [visited, setVisited] = React.useState<Set<string>>(
    () => new Set([requestedLesson.id])
  );
  const [rootPc, setRootPc] = React.useState(0);
  const [selectedChord, setSelectedChord] = React.useState<ChordQuality>(
    CHORD_QUALITIES[0]
  );
  const [selectedScale, setSelectedScale] = React.useState<ScaleDefinition>(IONIAN);
  const [shapeSteps, setShapeSteps] = React.useState<number[]>(INITIAL_SHAPE_STEPS);
  const [intervalSemitones, setIntervalSemitones] = React.useState(7);
  const [labelMode, setLabelMode] = React.useState<LabelMode>(requestedLesson.labelMode);
  const [instrument, setInstrument] = React.useState<InstrumentId>("piano");
  const [circleFifths, setCircleFifths] = React.useState(0);
  const [inversionIndex, setInversionIndex] = React.useState(0);
  const [audioPhase, setAudioPhase] = React.useState<AudioPhase>("unready");
  const {
    activeMidis,
    soundColors,
    press,
    release,
    releaseAll,
    playFigure,
    clearChord,
  } = usePerformance();

  const lesson = LESSONS[lessonIndex(lessonId)];
  const index = lessonIndex(lesson.id);

  React.useEffect(() => {
    soundEngine.bind();
    return soundEngine.onChange(() => setAudioPhase(soundEngine.getState()));
  }, []);

  const handlePlayNotes = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      if (lesson.highlight === "sounding") {
        setShapeSteps(
          Array.from(new Set(midis.map((midi) => semitoneFromRoot(midi, rootPc))))
        );
      }
      playFigure(midis, arpeggiate);
    },
    [lesson.highlight, playFigure, rootPc]
  );

  const chooseRoot = React.useCallback((pc: number) => {
    setRootPc(pc);
  }, []);

  const playRoot = React.useCallback(
    (pc: number) => {
      setRootPc(pc);
      playFigure([60 + pc]);
    },
    [playFigure]
  );

  const handleIntervalChange = React.useCallback((interval: IntervalInfo) => {
    setIntervalSemitones(interval.semitones);
  }, []);

  const highlightedPitchClasses = React.useMemo(() => {
    const shift = (semitones: number[]) =>
      semitones.map((semi) => (rootPc + semi) % 12);
    switch (lesson.highlight) {
      case "octave":
      case "home":
        return [rootPc];
      case "neighbors":
        return shift([0, 1, 2]);
      case "interval":
        return shift([0, intervalSemitones % 12]);
      case "scale":
        return shift(selectedScale.intervals);
      case "chord":
        return shift(selectedChord.intervals);
      case "sounding":
        return shapeSteps.map((step) => (rootPc + step) % 12);
      default:
        return [];
    }
  }, [
    lesson.highlight,
    rootPc,
    intervalSemitones,
    selectedScale,
    selectedChord,
    shapeSteps,
  ]);

  const goTo = (id: string) => {
    const next = LESSONS.find((item) => item.id === id);
    if (!next) return;
    setLessonId(next.id);
    setLabelMode(next.labelMode);
    clearChord();
    router.replace(`/?lesson=${next.id}`, { scroll: false });
    setVisited((current) => {
      const updated = new Set(current);
      updated.add(next.id);
      return updated;
    });
    if (
      next.visual === "staff" ||
      next.visual === "grand" ||
      next.visual === "steps" ||
      next.visual === "major" ||
      next.visual === "keys" ||
      next.visual === "modes"
    ) {
      setSelectedScale(IONIAN);
    }
    if (next.visual === "triads" || next.visual === "inversions") {
      setSelectedChord(CHORD_QUALITIES[0]);
    }
    if (next.visual === "intervals") setIntervalSemitones(7);
    if (next.visual === "minor") setIntervalSemitones(9);
    setCircleFifths(0);
    setInversionIndex(0);
    window.requestAnimationFrame(() => {
      document
        .getElementById("lesson-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const hearShape = () => {
    soundEngine.unlock();
    const base = 60 + rootPc;
    if (lesson.highlight === "octave" || lesson.highlight === "home") {
      handlePlayNotes(lesson.highlight === "octave" ? [base, base + 12] : [base], lesson.highlight === "octave");
      return;
    }
    if (lesson.highlight === "neighbors") {
      handlePlayNotes([base, base + 1, base + 2], true);
      return;
    }
    if (lesson.highlight === "interval") {
      handlePlayNotes([base, base + intervalSemitones], false);
      return;
    }
    if (lesson.highlight === "scale") {
      handlePlayNotes(
        [...selectedScale.intervals.map((semi) => base + semi), base + 12],
        true
      );
      return;
    }
    if (lesson.highlight === "chord") {
      handlePlayNotes(
        selectedChord.intervals.map((semi) => base + semi),
        false
      );
      return;
    }
    if (lesson.highlight === "sounding" && shapeSteps.length > 0) {
      handlePlayNotes(
        shapeSteps.map((step) => base + step),
        false
      );
    }
  };

  const written = React.useMemo(() => {
    const base = 60 + rootPc;
    const line = (steps: number[]) => steps.map((semi) => base + semi);
    const signature =
      (lesson.visual === "keys" || lesson.visual === "minor") &&
      keyByFifths(circleFifths).tonicPc === rootPc
        ? circleFifths
        : undefined;
    switch (lesson.visual) {
      case "steps":
        return { midis: [base, base + 1, base + 2], chord: false };
      case "intervals":
        return { midis: [base, base + intervalSemitones], chord: true };
      case "major":
        return { midis: line(MAJOR_STEPS), chord: false };
      case "keys":
        return { midis: line(MAJOR_STEPS), chord: false, fifths: signature };
      case "minor":
        return {
          midis: [base, 60 + ((rootPc + 9) % 12)],
          chord: true,
          fifths: signature,
        };
      case "modes":
        return {
          midis: [...selectedScale.intervals.map((semi) => base + semi), base + 12],
          chord: false,
        };
      case "triads":
        return { midis: selectedChord.intervals.map((semi) => base + semi), chord: true };
      case "inversions":
        return { midis: INVERSIONS[inversionIndex].map((semi) => base + semi), chord: true };
      default:
        return null;
    }
  }, [
    lesson.visual,
    rootPc,
    intervalSemitones,
    circleFifths,
    selectedScale,
    selectedChord,
    inversionIndex,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-border bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main">
              <Music className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-heading leading-none">First Octave</div>
              <p className="text-xs text-foreground/65">
                {audioPhase === "running" ? "Sound is live" : "Click Hear a C"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              soundEngine.setMuted(false);
              playFigure([60]);
            }}
          >
            <Volume2 className="size-4" /> Hear a C
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-start">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 flex-col overflow-y-auto border-r-2 border-border bg-white px-3 py-4 lg:flex">
          <PathNav
            lesson={lesson}
            index={index}
            visited={visited}
            onSelect={goTo}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-14 z-30 border-b-2 border-border bg-background lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
              {LESSONS.map((item, itemIndex) => (
                <Button
                  key={item.id}
                  size="xs"
                  variant={item.id === lesson.id ? "default" : "neutral"}
                  onClick={() => goTo(item.id)}
                >
                  {itemIndex + 1} {item.short}
                </Button>
              ))}
            </div>
          </div>

          <main id="lesson-top" className="w-full scroll-mt-16 space-y-3 px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h1 className="font-heading text-xl sm:text-2xl">{lesson.title}</h1>
              <p className="text-xs font-heading uppercase tracking-wide text-foreground/55">
                {lesson.chapter} · {index + 1} / {LESSONS.length}
              </p>
            </div>
            <p className="max-w-4xl text-sm leading-snug text-foreground/85">{lesson.teach}</p>

            <div className="z-20 bg-background pb-1 lg:sticky lg:top-14">
              <InstrumentStage
                instrument={instrument}
                onInstrumentChange={setInstrument}
                rootPc={rootPc}
                highlightedPitchClasses={highlightedPitchClasses}
                activeMidis={activeMidis}
                soundColors={soundColors}
                labelMode={labelMode}
                onLabelModeChange={setLabelMode}
                scale={selectedScale}
                onPress={press}
                onRelease={release}
                onReleaseAll={releaseAll}
                onSelectRoot={playRoot}
                written={written}
                onHearShape={lesson.highlight === "none" ? undefined : hearShape}
              />
            </div>

            <section className="space-y-2">
              <h2 className="text-xs font-heading uppercase tracking-wide text-foreground/55">
                {lesson.look}
              </h2>
              <LessonVisual
                lesson={lesson}
                rootPc={rootPc}
                selectedChord={selectedChord}
                selectedScale={selectedScale}
                onSelectRoot={chooseRoot}
                onSelectChord={setSelectedChord}
                onSelectScale={setSelectedScale}
                activeMidis={activeMidis}
                onPlayNotes={handlePlayNotes}
                onPlayMidi={(midi) => playFigure([midi])}
                circleFifths={circleFifths}
                onCircleFifths={setCircleFifths}
                inversionIndex={inversionIndex}
                onInversionIndex={setInversionIndex}
                onIntervalChange={handleIntervalChange}
              />
            </section>

            {lesson.exercise && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-base border-2 border-border bg-white p-3 shadow-shadow">
                <div>
                  <h2 className="font-heading text-base">Practice</h2>
                  <p className="text-sm text-foreground/75">
                    The check is on its own page. You answer by playing. The staff writes the same notes.
                  </p>
                </div>
                <Button nativeButton={false} render={<Link href={`/practice/${lesson.id}`} />}>
                  Start practice
                </Button>
              </section>
            )}

            <div className="flex items-center justify-between gap-3 pb-4">
              <Button
                variant="neutral"
                disabled={index === 0}
                onClick={() => goTo(LESSONS[index - 1].id)}
              >
                Back
              </Button>
              <span className="font-mono text-xs text-foreground/60">
                {index + 1} / {LESSONS.length}
              </span>
              <Button
                onClick={() =>
                  goTo(LESSONS[index === LESSONS.length - 1 ? 0 : index + 1].id)
                }
              >
                {index === LESSONS.length - 1 ? "Start again" : "Next lesson"}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function PathNav({
  lesson,
  index,
  visited,
  onSelect,
}: {
  lesson: Lesson;
  index: number;
  visited: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="mb-3 space-y-2">
        <div className="text-xs font-heading uppercase tracking-wide">The path</div>
        <Progress value={((index + 1) / LESSONS.length) * 100} />
        <p className="text-xs text-foreground/65">
          Lesson {index + 1} of {LESSONS.length}
        </p>
      </div>
      <nav className="space-y-3">
        {CHAPTERS.map((group) => (
          <div key={group.chapter}>
            <div className="mb-1 text-[11px] font-heading uppercase tracking-wider text-foreground/50">
              {group.chapter}
            </div>
            <div className="space-y-1">
              {group.lessons.map((item) => {
                const active = item.id === lesson.id;
                const seen = visited.has(item.id);
                const number = lessonIndex(item.id) + 1;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`flex w-full items-center gap-2 rounded-base border-2 px-2 py-1.5 text-left text-sm cursor-pointer ${
                      active
                        ? "border-border bg-main font-heading"
                        : "border-transparent hover:border-border hover:bg-background"
                    }`}
                  >
                    <span className="w-4 shrink-0 font-mono text-[11px]">{number}</span>
                    <span className="flex-1 leading-snug">{item.short}</span>
                    {seen && !active && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

function LessonVisual({
  lesson,
  rootPc,
  selectedChord,
  selectedScale,
  onSelectRoot,
  onSelectChord,
  onSelectScale,
  activeMidis,
  onPlayNotes,
  onPlayMidi,
  onIntervalChange,
  circleFifths,
  onCircleFifths,
  inversionIndex,
  onInversionIndex,
}: {
  lesson: Lesson;
  rootPc: number;
  selectedChord: ChordQuality;
  selectedScale: ScaleDefinition;
  activeMidis: number[];
  onSelectRoot: (pc: number) => void;
  onSelectChord: (chord: ChordQuality) => void;
  onSelectScale: (scale: ScaleDefinition) => void;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onPlayMidi: (midi: number) => void;
  onIntervalChange: (interval: IntervalInfo) => void;
  circleFifths: number;
  onCircleFifths: (fifths: number) => void;
  inversionIndex: number;
  onInversionIndex: (index: number) => void;
}) {
  switch (lesson.visual) {
    case "staff":
      return <StaffLesson activeMidis={activeMidis} />;
    case "grand":
      return <GrandStaffLesson activeMidis={activeMidis} />;
    case "rhythm":
      return <RhythmLesson onPlay={onPlayNotes} />;
    case "meter":
      return <MeterLesson onPlay={onPlayNotes} />;
    case "steps":
      return <PitchWalk kind="steps" rootPc={rootPc} onPlayMidi={onPlayMidi} />;
    case "intervals":
      return (
        <IntervalWaveLab
          embedded
          rootPc={rootPc}
          onPlayNotes={onPlayNotes}
          onIntervalChange={onIntervalChange}
        />
      );
    case "major":
      return <PitchWalk kind="major" rootPc={rootPc} onPlayMidi={onPlayMidi} />;
    case "keys":
      return (
        <KeySignatureLesson
          fifths={circleFifths}
          onFifths={onCircleFifths}
          onPlayNotes={onPlayNotes}
          onSelectRoot={onSelectRoot}
        />
      );
    case "minor":
      return (
        <MinorLesson
          fifths={circleFifths}
          onFifths={onCircleFifths}
          onPlayNotes={onPlayNotes}
          onSelectRoot={onSelectRoot}
        />
      );
    case "modes":
      return (
        <ScaleModeLab
          embedded
          rootPc={rootPc}
          selectedScale={selectedScale}
          onSelectScale={onSelectScale}
          onPlayNotes={onPlayNotes}
          onPlaySingleMidi={onPlayMidi}
        />
      );
    case "triads":
      return (
        <HarmonicGeometryLab
          embedded
          focus="chord"
          rootPc={rootPc}
          onSelectRoot={onSelectRoot}
          selectedChord={selectedChord}
          onSelectChord={onSelectChord}
          selectedScale={selectedScale}
          onSelectScale={onSelectScale}
          onPlayNotes={onPlayNotes}
        />
      );
    case "inversions":
      return (
        <InversionLesson
          rootPc={rootPc}
          index={inversionIndex}
          onIndex={onInversionIndex}
          onPlay={onPlayNotes}
        />
      );
    case "motion":
      return <ChordFlowLab embedded rootPc={rootPc} onPlayNotes={onPlayNotes} />;
    case "time":
      return <PolyrhythmOrbitLab embedded onPlayNotes={onPlayNotes} />;
    case "ear":
      return <EarGym onPlayNotes={onPlayNotes} />;
    default:
      return null;
  }
}
