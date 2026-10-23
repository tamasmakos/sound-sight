"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  INTERVALS,
  CHORD_QUALITIES,
  SCALES,
  PITCH_COLORS,
} from "@/lib/music-theory";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Ear,
  Volume2,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  RefreshCw,
} from "lucide-react";

interface EarGymProps {
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
}

type DrillCategory = "intervals" | "chords" | "modes";

interface DrillQuestion {
  category: DrillCategory;
  rootPc: number;
  promptTitle: string;
  midis: number[];
  arpeggiateDefault: boolean;
  correctId: string;
  correctLabel: string;
  explanation: string;
  options: { id: string; label: string; sublabel: string; color: string }[];
}

export function EarGym({ onPlayNotes }: EarGymProps) {
  const [category, setCategory] = React.useState<DrillCategory>("intervals");
  const [score, setScore] = React.useState(0);
  const [totalAnswered, setTotalAnswered] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(
    null
  );

  const generateQuestion = React.useCallback(
    (cat: DrillCategory): DrillQuestion => {
      const rootPc = Math.floor(Math.random() * 12);
      const baseMidi = 60 + rootPc;

      if (cat === "intervals") {
        const pool = INTERVALS.slice(1, 13); // m2 through P8
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return {
          category: "intervals",
          rootPc,
          promptTitle: `Identify the interval above ${CHROMATIC_NOTES[rootPc]}4`,
          midis: [baseMidi, baseMidi + chosen.semitones],
          arpeggiateDefault: true,
          correctId: chosen.shortName,
          correctLabel: `${chosen.name} (${chosen.shortName})`,
          explanation: `${chosen.semitones} semitones • Ratio ${chosen.ratioLabel} • Ear anchor: ${chosen.songReference}`,
          options: pool.map((int) => ({
            id: int.shortName,
            label: `${int.shortName} — ${int.name}`,
            sublabel: `${int.semitones} semi (${int.ratioLabel})`,
            color: int.color,
          })),
        };
      }

      if (cat === "chords") {
        const pool = CHORD_QUALITIES.slice(0, 8);
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return {
          category: "chords",
          rootPc,
          promptTitle: `Identify the chord quality built on ${CHROMATIC_NOTES[rootPc]}`,
          midis: chosen.intervals.map((s) => baseMidi + s),
          arpeggiateDefault: false,
          correctId: chosen.id,
          correctLabel: `${CHROMATIC_NOTES[rootPc]} ${chosen.name}`,
          explanation: `Formula: ${chosen.formula.join(" – ")} • Geometry: ${chosen.shapeName} (${chosen.character})`,
          options: pool.map((ch) => ({
            id: ch.id,
            label: ch.name,
            sublabel: `Formula: ${ch.formula.join("-")}`,
            color: ch.color,
          })),
        };
      }

      const pool = SCALES.slice(0, 7);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return {
        category: "modes",
        rootPc,
        promptTitle: `Identify the diatonic mode starting on ${CHROMATIC_NOTES[rootPc]}`,
        midis: [
          ...chosen.intervals.map((s) => baseMidi + s),
          baseMidi + 12,
        ],
        arpeggiateDefault: true,
        correctId: chosen.id,
        correctLabel: `${CHROMATIC_NOTES[rootPc]} ${chosen.name}`,
        explanation: `Spice Note: ${chosen.characterNote} • Mood: ${chosen.mood}`,
        options: pool.map((sc) => ({
          id: sc.id,
          label: sc.name,
          sublabel: `Spice: ${sc.characterNote}`,
          color:
            sc.brightness > 0
              ? "#FACC00"
              : sc.brightness === 0
                ? "#00D696"
                : "#7A83FF",
        })),
      };
    },
    []
  );

  const [question, setQuestion] = React.useState<DrillQuestion>(() =>
    generateQuestion("intervals")
  );

  const playCurrentQuestion = (arp = question.arpeggiateDefault) => {
    onPlayNotes(question.midis, arp);
  };

  const handleSelectOption = (optionId: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionId);
    setTotalAnswered((t) => t + 1);

    if (optionId === question.correctId) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
    playCurrentQuestion(false);
  };

  const handleNextQuestion = (nextCategory = category) => {
    const nextQ = generateQuestion(nextCategory);
    setQuestion(nextQ);
    setSelectedAnswer(null);
    onPlayNotes(nextQ.midis, nextQ.arpeggiateDefault);
  };

  const accuracy =
    totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Active Ear Training Challenge */}
      <Card className="lg:col-span-7 bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Listen, then name it</CardTitle>
              <CardDescription className="mt-1">
                Hear the prompt. Answer. The explanation names the steps after you choose.
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  ["intervals", "Intervals"],
                  ["chords", "Chords"],
                  ["modes", "Modes"],
                ] as const
              ).map(([cat, label]) => (
                <Button
                  key={cat}
                  size="xs"
                  variant={category === cat ? "default" : "neutral"}
                  onClick={() => {
                    setCategory(cat);
                    handleNextQuestion(cat);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Prompt Audio Deck */}
          <div className="rounded-base border-2 border-border bg-background p-4 shadow-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="size-12 rounded-base border-2 border-border flex items-center justify-center font-heading text-lg shadow-[2px_2px_0px_0px_#000]"
                style={{ backgroundColor: PITCH_COLORS[question.rootPc] }}
              >
                {CHROMATIC_NOTES[question.rootPc]}
              </div>
              <div>
                <div className="text-xs font-heading uppercase tracking-wide text-foreground/60">
                  Starting note
                </div>
                <div className="text-lg font-heading">{question.promptTitle}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => playCurrentQuestion(true)}
                variant="neutral"
              >
                <Volume2 className="size-4" />
                Play Melodic
              </Button>
              <Button size="sm" onClick={() => playCurrentQuestion(false)}>
                <Ear className="size-4" />
                Play Harmonic
              </Button>
            </div>
          </div>

          {/* Answer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {question.options.map((opt) => {
              const isChosen = selectedAnswer === opt.id;
              const isCorrect = opt.id === question.correctId;
              const showFeedback = selectedAnswer !== null;

              let bgStyle: string | undefined = undefined;
              if (showFeedback && isCorrect) bgStyle = "#00D696";
              else if (showFeedback && isChosen && !isCorrect)
                bgStyle = "#FF4D50";

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-3 rounded-base border-2 border-border text-left transition-all cursor-pointer flex items-center justify-between ${
                    showFeedback && (isCorrect || isChosen)
                      ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                      : "bg-white shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  }`}
                  style={{ backgroundColor: bgStyle }}
                >
                  <div>
                    <div className="font-heading text-sm">{opt.label}</div>
                    <div className="text-xs font-mono opacity-80">
                      {opt.sublabel}
                    </div>
                  </div>
                  {showFeedback && isCorrect && (
                    <CheckCircle2 className="size-5 shrink-0" />
                  )}
                  {showFeedback && isChosen && !isCorrect && (
                    <XCircle className="size-5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Visual Answer Reveal */}
          {selectedAnswer !== null && (
            <div className="rounded-base border-2 border-border bg-white p-4 shadow-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      selectedAnswer === question.correctId
                        ? "bg-[#00D696]"
                        : "bg-[#FF4D50] text-white"
                    }
                  >
                    {selectedAnswer === question.correctId
                      ? "Yes"
                      : "Listen again"}
                  </Badge>
                  <span className="font-heading text-base">
                    Answer: {question.correctLabel}
                  </span>
                </div>
                <p className="text-xs font-mono mt-1.5 text-foreground/80">
                  {question.explanation}
                </p>
              </div>

              <Button size="sm" onClick={() => handleNextQuestion(category)}>
                <RefreshCw className="size-4" />
                Next Challenge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: score and a short listening guide */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5" />
              This sitting
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-base border-2 border-border bg-background p-3 text-center shadow-[2px_2px_0px_0px_#000]">
                <div className="text-xs font-mono">SCORE</div>
                <div className="text-2xl font-heading mt-1">
                  {score} / {totalAnswered}
                </div>
              </div>
              <div className="rounded-base border-2 border-border bg-main p-3 text-center shadow-[2px_2px_0px_0px_#000]">
                <div className="text-xs font-mono flex items-center justify-center gap-1">
                  <Flame className="size-3.5" /> STREAK
                </div>
                <div className="text-2xl font-heading mt-1">{streak}</div>
              </div>
              <div className="rounded-base border-2 border-border bg-background p-3 text-center shadow-[2px_2px_0px_0px_#000]">
                <div className="text-xs font-mono">ACCURACY</div>
                <div className="text-2xl font-heading mt-1">{accuracy}%</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-heading">
                <span>Answers so far</span>
                <span>{accuracy}%</span>
              </div>
              <Progress value={accuracy} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="text-lg">
              What to listen for
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-xs sm:text-sm">
            <div className="p-2.5 rounded-base border-2 border-border bg-background">
              <strong>1. Intervals:</strong> Listen for acoustic beating first.{" "}
              <em>Perfect 4th (4:3)</em> and <em>Perfect 5th (3:2)</em> ring hollow and Beatless; <em>m2</em> and <em>Tritone</em> buzz with rapid wave friction.
            </div>
            <div className="p-2.5 rounded-base border-2 border-border bg-background">
              <strong>2. Chords:</strong> Check symmetry!{" "}
              <em>Augmented (+)</em> floats without a clear floor,{" "}
              <em>Diminished (°)</em> pulls inward tightly, and{" "}
              <em>Dominant 7</em> wants to resolve up a 4th.
            </div>
            <div className="p-2.5 rounded-base border-2 border-border bg-background">
              <strong>3. Modes:</strong> Spot the single &ldquo;Spice Note&rdquo;—Lydian&apos;s raised <strong>♯4</strong> levitates, Dorian&apos;s natural <strong>6</strong> brightens minor, and Phrygian&apos;s <strong>♭2</strong> snaps immediately on step two.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
