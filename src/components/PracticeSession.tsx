"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LESSONS, lessonIndex, type LabelMode } from "@/lib/curriculum";
import { answerMatches, makePracticeTasks, type PracticeTask } from "@/lib/exercises";
import { soundEngine } from "@/lib/audio-engine";
import { InstrumentStage, type InstrumentId } from "@/components/InstrumentStage";
import { StaffNotation } from "@/components/StaffNotation";
import { usePerformance } from "@/components/use-performance";
import { Button } from "@/components/ui/button";
import { SCALES, type ScaleDefinition } from "@/lib/music-theory";
import { Volume2 } from "lucide-react";

const IONIAN = SCALES.find((scale) => scale.id === "ionian")!;

function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function PracticeSession({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS.find((item) => item.id === lessonId) ?? LESSONS[0];
  return <PracticeRound key={lesson.id} lesson={lesson} />;
}

function PracticeRound({ lesson }: { lesson: (typeof LESSONS)[number] }) {
  const router = useRouter();
  const isClient = useIsClient();
  const [instrument, setInstrument] = React.useState<InstrumentId>("piano");
  const [rootPc, setRootPc] = React.useState(0);
  const [labelMode, setLabelMode] = React.useState<LabelMode>(lesson.labelMode);
  const [scale] = React.useState<ScaleDefinition>(IONIAN);
  const [tasks, setTasks] = React.useState<PracticeTask[] | null>(null);
  const [round, setRound] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [checked, setChecked] = React.useState(false);
  const performance = usePerformance();

  if (isClient && tasks === null && lesson.exercise) {
    setTasks(makePracticeTasks(lesson.exercise, rootPc, scale));
  }

  React.useEffect(() => {
    soundEngine.bind();
  }, []);

  const task = tasks?.[round] ?? null;
  const matched = task ? answerMatches(task, performance.activeMidis, performance.taps) : false;

  const chooseRoot = (pc: number) => {
    setRootPc(pc);
    performance.ensureMidi(60 + pc);
  };

  const nextRound = () => {
    performance.clearChord();
    performance.resetTaps();
    setChecked(false);
    if (!tasks || round + 1 >= tasks.length) {
      router.push(`/?lesson=${lesson.id}`);
      return;
    }
    setRound((current) => current + 1);
  };

  const again = () => {
    if (!lesson.exercise) return;
    setTasks(makePracticeTasks(lesson.exercise, rootPc, scale));
    setRound(0);
    setChecked(false);
    setMisses(0);
    performance.clearChord();
    performance.resetTaps();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-border bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="min-w-0">
            <div className="font-heading leading-none">Practice</div>
            <p className="truncate text-xs text-foreground/65">
              {lesson.chapter} · {lesson.title}
            </p>
          </div>
          <Button variant="neutral" size="sm" nativeButton={false} render={<Link href={`/?lesson=${lesson.id}`} />}>
            Back to the lesson
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-3 px-3 py-3 sm:px-4">
        {!lesson.exercise ? (
          <section className="rounded-base border-2 border-border bg-white p-4">
            <p className="text-sm">This lesson is practice on the page itself.</p>
            <Button className="mt-3" nativeButton={false} render={<Link href={`/?lesson=${lesson.id}`} />}>
              Return
            </Button>
          </section>
        ) : !task ? (
          <section className="rounded-base border-2 border-border bg-white p-4">
            <p className="text-sm">Setting the next round.</p>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="font-heading text-xl sm:text-2xl">{task.prompt}</h1>
              <p className="font-mono text-xs text-foreground/60">
                {round + 1} / {tasks!.length}
                {misses > 0 ? ` · ${misses} checks` : ""}
              </p>
            </div>
            <p className="max-w-3xl text-sm text-foreground/80">{task.detail}</p>

            <QuestionCard task={task} />

            <InstrumentStage
              instrument={instrument}
              onInstrumentChange={setInstrument}
              rootPc={rootPc}
              highlightedPitchClasses={task.guidePitchClasses ?? []}
              activeMidis={performance.activeMidis}
              soundColors={performance.soundColors}
              cursorMidi={performance.cursorMidi}
              labelMode={labelMode}
              onLabelModeChange={setLabelMode}
              scale={scale}
              onToggleMidi={performance.toggleMidi}
              onAddMidis={performance.addMidis}
              onSelectRoot={chooseRoot}
              onStepCursor={performance.stepCursor}
              onMoveSelection={performance.moveSelection}
              onAddCursor={performance.addCursor}
              onRemoveCursor={performance.removeCursor}
              onClear={() => {
                performance.clearChord();
                performance.resetTaps();
              }}
            />

            <div className="flex items-center justify-between gap-3 pb-6">
              <Button
                variant="neutral"
                onClick={() => {
                  setChecked(true);
                  if (!matched) setMisses((count) => count + 1);
                }}
              >
                Check
              </Button>
              <p className="text-sm font-heading">
                {matched
                  ? "Yes. The instrument and the staff agree."
                  : checked
                    ? "Not yet. Change what is sounding, then check again."
                    : "Play the answer on the instrument or write it on the staff."}
              </p>
              {matched ? (
                <Button onClick={round + 1 >= tasks!.length ? again : nextRound}>
                  {round + 1 >= tasks!.length ? "Practice again" : "Next"}
                </Button>
              ) : (
                <Button variant="neutral" onClick={nextRound}>
                  Skip
                </Button>
              )}
            </div>
          </>
        )}
        <p className="pb-4 text-center text-xs text-foreground/50">
          Lesson {lessonIndex(lesson.id) + 1} of {LESSONS.length}
        </p>
      </main>
    </div>
  );
}

function QuestionCard({ task }: { task: PracticeTask }) {
  if (task.reveal === "name") return null;
  return (
    <section className="rounded-base border-2 border-border bg-white p-3">
      {task.reveal === "hear" && task.hearMidis && (
        <Button
          onClick={() => {
            soundEngine.unlock();
            if (task.hearMidis!.length === 1) soundEngine.playMidi(task.hearMidis![0], 0.55);
            else soundEngine.playChord(task.hearMidis!, 0.8, 0.02);
          }}
        >
          <Volume2 className="size-4" />
          Hear it
        </Button>
      )}
      {(task.reveal === "staff" || task.reveal === "signature") && (
        <StaffNotation
          clef={task.clef ?? "treble"}
          fifths={task.fifths ?? 0}
          notes={task.reveal === "staff" ? task.targetMidis.map((midi) => ({ midi, color: "#111" })) : []}
        />
      )}
      {task.reveal === "bar" && task.divisions !== undefined && <DivisionBar divisions={task.divisions} />}
      {task.reveal === "bar" && task.groups && <GroupBar groups={task.groups} />}
    </section>
  );
}

function DivisionBar({ divisions }: { divisions: number }) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${divisions}, minmax(0, 1fr))` }}>
      {Array.from({ length: divisions }, (_, index) => (
        <div
          key={index}
          className="flex h-12 items-center justify-center rounded-base border-2 border-border bg-main text-xs font-heading"
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
}

function GroupBar({ groups }: { groups: number[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
      {groups.map((size, groupIndex) => (
        <div key={groupIndex} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {Array.from({ length: size }, (_, index) => (
            <div
              key={index}
              className={`h-12 rounded-base border-2 border-border ${index === 0 ? "bg-main" : "bg-white"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
