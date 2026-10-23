"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { StaffNotation } from "@/components/StaffNotation";
import {
  makeQuestion,
  type ExerciseKind,
  type ExerciseQuestion,
} from "@/lib/exercises";
import type { ScaleDefinition } from "@/lib/music-theory";
import { soundEngine } from "@/lib/audio-engine";

interface ExercisePanelProps {
  kind: ExerciseKind;
  rootPc: number;
  scale?: ScaleDefinition | null;
  activeMidis: number[];
}

function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ExercisePanel({ kind, rootPc, scale, activeMidis }: ExercisePanelProps) {
  const isClient = useIsClient();
  const signature = `${kind}:${rootPc}:${scale?.id ?? ""}`;
  const [stamp, setStamp] = React.useState(signature);
  const [question, setQuestion] = React.useState<ExerciseQuestion | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [asked, setAsked] = React.useState(0);
  const midiKey = activeMidis.join(",");
  const [seenMidi, setSeenMidi] = React.useState(midiKey);
  const [questionKey, setQuestionKey] = React.useState("");

  if (isClient && (question === null || stamp !== signature)) {
    if (stamp !== signature) setStamp(signature);
    setQuestion(makeQuestion(kind, rootPc, scale));
    if (picked !== null) setPicked(null);
  }

  if (!isClient || question === null || stamp !== signature) {
    return (
      <section className="rounded-base border-2 border-border bg-white p-3 shadow-shadow">
        <h2 className="font-heading text-base">Check yourself</h2>
      </section>
    );
  }

  if (question.key !== questionKey) {
    setQuestionKey(question.key);
    setSeenMidi(midiKey);
  } else if (
    question.findPitchClass !== undefined &&
    picked === null &&
    midiKey !== seenMidi
  ) {
    setSeenMidi(midiKey);
    const hit = activeMidis.some(
      (midi) => ((midi % 12) + 12) % 12 === question.findPitchClass
    );
    if (hit) {
      setPicked(question.answerId ?? "played");
      setCorrectCount((count) => count + 1);
      setAsked((count) => count + 1);
    }
  }

  const choose = (choiceId: string) => {
    if (picked) return;
    setPicked(choiceId);
    setAsked((count) => count + 1);
    if (choiceId === question.answerId) setCorrectCount((count) => count + 1);
    if (question.playMidis) soundEngine.playChord(question.playMidis, 0.7, 0.02);
  };

  const next = () => {
    setQuestion(makeQuestion(kind, rootPc, scale));
    setPicked(null);
  };

  const columns = question.choices?.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <section className="rounded-base border-2 border-border bg-white p-3 shadow-shadow">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base">Check yourself</h2>
        <span className="font-mono text-xs text-foreground/60">
          {correctCount}/{asked || 0}
        </span>
      </div>
      <p className="text-sm">{question.prompt}</p>

      {question.midis && question.clef && (
        <div className="mt-2">
          <StaffNotation
            clef={question.clef}
            fifths={question.fifths ?? 0}
            notes={question.midis.map((midi, index) => ({
              midi,
              color: index === question.midis!.length - 1 ? "#111" : "#111",
            }))}
          />
        </div>
      )}

      {question.divisions && <DivisionBar divisions={question.divisions} />}
      {question.groups && <GroupBar groups={question.groups} />}

      {question.playMidis && (
        <Button
          size="sm"
          variant="neutral"
          className="mt-2"
          onClick={() => soundEngine.playChord(question.playMidis!, 0.7, question.playMidis!.length > 3 ? 0.12 : 0.02)}
        >
          Hear it
        </Button>
      )}

      {question.choices && (
        <div className={`mt-3 grid gap-2 ${columns}`}>
          {question.choices.map((choice) => {
            const show = picked !== null;
            const isAnswer = choice.id === question.answerId;
            const isPicked = choice.id === picked;
            return (
              <button
                key={choice.id}
                onClick={() => choose(choice.id)}
                className={`min-h-11 rounded-base border-2 border-border px-2 text-sm font-heading cursor-pointer ${
                  show && isAnswer
                    ? "bg-main"
                    : show && isPicked
                      ? "bg-white"
                      : "bg-background"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      )}

      {question.findPitchClass && picked === null && (
        <p className="mt-2 text-xs text-foreground/70">
          The matching key or fret lights when you play the right pitch.
        </p>
      )}

      {picked && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-heading">
            {picked === question.answerId ? "Yes." : "Not that one. Look again, then continue."}
          </p>
          <Button size="sm" onClick={next}>
            Next
          </Button>
        </div>
      )}
    </section>
  );
}

function DivisionBar({ divisions }: { divisions: number }) {
  return (
    <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${divisions}, minmax(0, 1fr))` }}>
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
  const pattern = groups.length === 6 ? [3, 3] : [groups.length];
  return (
    <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${pattern.length}, minmax(0, 1fr))` }}>
      {pattern.map((size, groupIndex) => (
        <div key={groupIndex} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {Array.from({ length: size }, (_, index) => (
            <div
              key={index}
              className={`h-10 rounded-base border-2 border-border ${index === 0 ? "bg-main" : "bg-white"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
