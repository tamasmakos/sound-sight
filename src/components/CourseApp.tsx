"use client";

import React from "react";
import {
  CHORD_QUALITIES,
  CHROMATIC_NOTES,
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
import { soundEngine } from "@/lib/audio-engine";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { PitchWalk } from "@/components/PitchWalk";
import { HarmonicGeometryLab } from "@/components/HarmonicGeometryLab";
import { IntervalWaveLab } from "@/components/IntervalWaveLab";
import { ScaleModeLab } from "@/components/ScaleModeLab";
import { ChordFlowLab } from "@/components/ChordFlowLab";
import { PolyrhythmOrbitLab } from "@/components/PolyrhythmOrbitLab";
import { EarGym } from "@/components/EarGym";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Music, Volume2, VolumeX } from "lucide-react";

const IONIAN = SCALES.find((scale) => scale.id === "ionian")!;
const CHAPTERS = lessonsByChapter();
const INITIAL_SHAPE_STEPS = [2, 5, 9];

export function CourseApp() {
  const [lessonId, setLessonId] = React.useState(LESSONS[0].id);
  const [visited, setVisited] = React.useState<Set<string>>(
    () => new Set([LESSONS[0].id])
  );
  const [rootPc, setRootPc] = React.useState(0);
  const [selectedChord, setSelectedChord] = React.useState<ChordQuality>(
    CHORD_QUALITIES[0]
  );
  const [selectedScale, setSelectedScale] = React.useState<ScaleDefinition>(IONIAN);
  const [activeMidis, setActiveMidis] = React.useState<number[]>([60]);
  const [shapeSteps, setShapeSteps] = React.useState<number[]>(INITIAL_SHAPE_STEPS);
  const [intervalSemitones, setIntervalSemitones] = React.useState(7);
  const [labelMode, setLabelMode] = React.useState<LabelMode>("notes");
  const [isMuted, setIsMuted] = React.useState(false);

  const lesson = LESSONS[lessonIndex(lessonId)];
  const index = lessonIndex(lesson.id);

  const playMidis = React.useCallback((midis: number[], arpeggiate = false) => {
    if (arpeggiate) soundEngine.playScaleSequence(midis, 0.19);
    else if (midis.length === 1) soundEngine.playMidi(midis[0], 0.55);
    else soundEngine.playChord(midis, 0.85, 0.03);
  }, []);

  const handlePlayNotes = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      if (lesson.highlight === "none") {
        setActiveMidis([]);
      } else {
        setActiveMidis(midis);
        if (lesson.highlight === "sounding") {
          setShapeSteps(
            Array.from(
              new Set(
                midis.map((midi) => semitoneFromRoot(midi, rootPc))
              )
            )
          );
        }
      }
      playMidis(midis, arpeggiate);
    },
    [lesson.highlight, playMidis, rootPc]
  );

  const handleTriggerSingleMidi = React.useCallback((midi: number) => {
    soundEngine.playMidi(midi, 0.55);
    setActiveMidis([midi]);
  }, []);

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
    setActiveMidis([]);
    setVisited((current) => {
      const updated = new Set(current);
      updated.add(next.id);
      return updated;
    });
    if (
      next.visual === "keyboard" ||
      next.visual === "steps" ||
      next.visual === "major"
    ) {
      setSelectedScale(IONIAN);
    }
    if (next.visual === "triads") setSelectedChord(CHORD_QUALITIES[0]);
    if (next.visual === "intervals") setIntervalSemitones(7);
    window.requestAnimationFrame(() => {
      document
        .getElementById("lesson-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const hearShape = () => {
    const base = 60 + rootPc;
    if (lesson.highlight === "octave") {
      handlePlayNotes([base, base + 12], true);
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
      return;
    }
    if (lesson.highlight === "home") handlePlayNotes([base], false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-border bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main">
              <Music className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-heading leading-none">First Octave</div>
              <p className="truncate text-xs text-foreground/65">
                Music theory, one idea at a time
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isMuted ? "neutral" : "default"}
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              soundEngine.setMuted(next);
            }}
          >
            {isMuted ? (
              <>
                <VolumeX className="size-4" /> Sound off
              </>
            ) : (
              <>
                <Volume2 className="size-4" /> Sound on
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-start">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r-2 border-border bg-white px-4 py-5 lg:flex">
          <PathNav
            lesson={lesson}
            index={index}
            visited={visited}
            onSelect={goTo}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-14 z-30 border-b-2 border-border bg-background lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2">
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

          <main
            id="lesson-top"
            className="mx-auto w-full max-w-5xl scroll-mt-20 space-y-5 px-4 py-6 sm:px-6"
          >
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">
                    {lesson.chapter} · {index + 1} of {LESSONS.length}
                  </Badge>
                  <span className="text-xs text-foreground/60">
                    Home note {CHROMATIC_NOTES[rootPc]} stays with you
                  </span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {lesson.title}
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm text-foreground/80 sm:text-base">
                  {lesson.teach}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-base border-2 border-border bg-main px-3 py-2 text-sm">
                  <span className="font-heading">Try this. </span>
                  {lesson.tryThis}
                </div>
              </CardContent>
            </Card>

            <InteractiveKeyboard
              rootPc={rootPc}
              highlightedPitchClasses={highlightedPitchClasses}
              activeMidis={activeMidis}
              labelMode={labelMode}
              onLabelModeChange={setLabelMode}
              scale={selectedScale}
              onTriggerMidi={handleTriggerSingleMidi}
              onSelectRoot={setRootPc}
              onHearShape={lesson.highlight === "none" ? undefined : hearShape}
            />

            <section className="space-y-2">
              <h2 className="text-xs font-heading uppercase tracking-wide text-foreground/55">
                {lesson.look}
              </h2>
              <LessonVisual
                lesson={lesson}
                rootPc={rootPc}
                selectedChord={selectedChord}
                selectedScale={selectedScale}
                onSelectRoot={setRootPc}
                onSelectChord={setSelectedChord}
                onSelectScale={setSelectedScale}
                onPlayNotes={handlePlayNotes}
                onPlayMidi={handleTriggerSingleMidi}
                onIntervalChange={handleIntervalChange}
              />
            </section>

            <div className="flex items-center justify-between gap-3 pb-6">
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
      <div className="mb-4 space-y-2">
        <div className="text-xs font-heading uppercase tracking-wide">
          The path
        </div>
        <Progress value={((index + 1) / LESSONS.length) * 100} />
        <p className="text-xs text-foreground/65">
          Lesson {index + 1} of {LESSONS.length}
        </p>
      </div>
      <nav className="space-y-4">
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
                    className={`flex w-full items-start gap-2 rounded-base border-2 px-2 py-1.5 text-left text-sm cursor-pointer ${
                      active
                        ? "border-border bg-main font-heading"
                        : "border-transparent hover:border-border hover:bg-background"
                    }`}
                  >
                    <span className="mt-0.5 w-4 shrink-0 font-mono text-[11px]">
                      {number}
                    </span>
                    <span className="flex-1 leading-snug">{item.title}</span>
                    {seen && !active && (
                      <Check className="mt-0.5 size-3.5 shrink-0" />
                    )}
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
  onPlayNotes,
  onPlayMidi,
  onIntervalChange,
}: {
  lesson: Lesson;
  rootPc: number;
  selectedChord: ChordQuality;
  selectedScale: ScaleDefinition;
  onSelectRoot: (pc: number) => void;
  onSelectChord: (chord: ChordQuality) => void;
  onSelectScale: (scale: ScaleDefinition) => void;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onPlayMidi: (midi: number) => void;
  onIntervalChange: (interval: IntervalInfo) => void;
}) {
  switch (lesson.visual) {
    case "keyboard":
    case "steps":
    case "major":
      return (
        <PitchWalk kind={lesson.visual} rootPc={rootPc} onPlayMidi={onPlayMidi} />
      );
    case "intervals":
      return (
        <IntervalWaveLab
          embedded
          rootPc={rootPc}
          onPlayNotes={onPlayNotes}
          onIntervalChange={onIntervalChange}
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
    case "motion":
      return <ChordFlowLab embedded rootPc={rootPc} onPlayNotes={onPlayNotes} />;
    case "time":
      return <PolyrhythmOrbitLab embedded />;
    case "ear":
      return <EarGym onPlayNotes={onPlayNotes} />;
    default:
      return null;
  }
}
