"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  PITCH_COLORS,
  MAJOR_DIATONIC_DEGREES,
  PROGRESSION_PRESETS,
  CHORD_QUALITIES,
  getSmoothVoicedChord,
  midiToNoteLabel,
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
import { Switch } from "@/components/ui/switch";
import { Play, Square, GitBranch, Sparkles } from "lucide-react";

interface ChordFlowLabProps {
  rootPc: number;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  embedded?: boolean;
}

export function ChordFlowLab({
  rootPc,
  onPlayNotes,
  embedded = false,
}: ChordFlowLabProps) {
  const [progressionDegrees, setProgressionDegrees] = React.useState<number[]>([
    2, 5, 1, 6,
  ]);
  const [useSevenths, setUseSevenths] = React.useState(true);
  const [activeSlot, setActiveSlot] = React.useState<number>(0);
  const [isLooping, setIsLooping] = React.useState(false);

  const getChordInfoForDegree = React.useCallback(
    (degNumber: number) => {
      const deg = MAJOR_DIATONIC_DEGREES.find((d) => d.degree === degNumber)!;
      const chordRootPc = (rootPc + deg.semitoneOffset) % 12;

      let intervals = [0, 4, 7];
      let symbol = "";

      if (useSevenths) {
        if (deg.seventhQuality === "maj7") {
          intervals = [0, 4, 7, 11];
          symbol = "maj7";
        } else if (deg.seventhQuality === "min7") {
          intervals = [0, 3, 7, 10];
          symbol = "m7";
        } else if (deg.seventhQuality === "dom7") {
          intervals = [0, 4, 7, 10];
          symbol = "7";
        } else {
          intervals = [0, 3, 6, 10];
          symbol = "ø7";
        }
      } else {
        const q = CHORD_QUALITIES.find((c) => c.id === deg.triadQuality)!;
        intervals = q.intervals;
        symbol = q.symbol;
      }

      return {
        deg,
        chordRootPc,
        chordName: `${CHROMATIC_NOTES[chordRootPc]}${symbol}`,
        romanLabel: useSevenths ? `${deg.roman}7` : deg.roman,
        intervals,
        pitchClasses: intervals.map((i) => (chordRootPc + i) % 12),
      };
    },
    [rootPc, useSevenths]
  );

  // Compute smooth voice-leading MIDI notes across all 4 slots
  const voicedProgression = React.useMemo(() => {
    const result: {
      info: ReturnType<typeof getChordInfoForDegree>;
      midis: number[];
    }[] = [];

    progressionDegrees.forEach((degNum, idx) => {
      const info = getChordInfoForDegree(degNum);
      const prevMidis = idx > 0 ? result[idx - 1].midis : undefined;
      const midis = getSmoothVoicedChord(
        info.chordRootPc,
        info.intervals,
        prevMidis
      );
      result.push({ info, midis });
    });

    return result;
  }, [progressionDegrees, getChordInfoForDegree]);

  React.useEffect(() => {
    if (!isLooping) return;
    let step = 0;

    const timer = setInterval(() => {
      step = (step + 1) % voicedProgression.length;
      setActiveSlot(step);
      onPlayNotes(voicedProgression[step].midis, false);
    }, 1050);

    return () => clearInterval(timer);
  }, [isLooping, voicedProgression, onPlayNotes]);

  const setSlotDegree = (slotIdx: number, degNum: number) => {
    const next = [...progressionDegrees];
    next[slotIdx] = degNum;
    setProgressionDegrees(next);
    setActiveSlot(slotIdx);
    const info = getChordInfoForDegree(degNum);
    const midis = getSmoothVoicedChord(info.chordRootPc, info.intervals);
    onPlayNotes(midis, false);
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Left: Voice Leading River & 4-Bar Sequencer */}
      <Card className="bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!embedded && (
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Voices that step, instead of jump
                </CardTitle>
                <CardDescription className="mt-1">
                  Each line should stay put, or move by one or two half steps.
                </CardDescription>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-background px-2.5 py-1.5">
                <span className="text-xs font-heading">Sevenths</span>
                <Switch
                  checked={useSevenths}
                  onCheckedChange={(v) => setUseSevenths(Boolean(v))}
                />
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const next = !isLooping;
                  setIsLooping(next);
                  if (next) {
                    setActiveSlot(0);
                    onPlayNotes(voicedProgression[0].midis, false);
                  }
                }}
                variant={isLooping ? "neutral" : "default"}
              >
                {isLooping ? (
                  <>
                    <Square className="size-4 fill-current" /> Stop Loop
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Play Progression
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* 4-Chord Progression Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {voicedProgression.map(({ info, midis }, idx) => {
              const isCurrent = activeSlot === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSlot(idx);
                    onPlayNotes(midis, false);
                  }}
                  className={`p-3 rounded-base border-2 border-border transition-all cursor-pointer ${
                    isCurrent
                      ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                      : "bg-background shadow-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  }`}
                  style={{
                    backgroundColor: isCurrent ? info.deg.color : undefined,
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold">BAR {idx + 1}</span>
                    <span className="px-1.5 py-0.5 rounded bg-black text-white">
                      {info.deg.functionShort}
                    </span>
                  </div>
                  <div className="text-2xl font-heading mt-1">
                    {info.chordName}
                  </div>
                  <div className="text-xs font-mono font-bold">
                    Roman: {info.romanLabel}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {midis.slice(1).map((m, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-black"
                        style={{ backgroundColor: PITCH_COLORS[m % 12] }}
                      >
                        {midiToNoteLabel(m)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SVG Smooth Voice-Leading River Graph */}
          <div className="rounded-base border-2 border-border bg-white p-3 shadow-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-heading uppercase">
                Voice-Leading Streamlines (Solid = Common Tone Kept, Dashed = Semitone Glide)
              </span>
              <Badge variant="neutral" className="font-mono text-[11px]">
                Key of {CHROMATIC_NOTES[rootPc]} Major
              </Badge>
            </div>

            <svg
              viewBox="0 0 640 210"
              className="w-full h-48 overflow-visible select-none"
            >
              {/* Horizontal Pitch Guide Lines */}
              {[58, 62, 66, 70, 74].map((midiLine) => {
                const y = 185 - (midiLine - 55) * 7.2;
                return (
                  <g key={midiLine}>
                    <line
                      x1={40}
                      y1={y}
                      x2={600}
                      y2={y}
                      stroke="#000"
                      strokeOpacity={0.12}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={8}
                      y={y + 3}
                      className="font-mono text-[9px] fill-black/50"
                    >
                      {midiToNoteLabel(midiLine)}
                    </text>
                  </g>
                );
              })}

              {/* Connecting Voice Lines between adjacent chords */}
              {voicedProgression.map((curr, slotIdx) => {
                if (slotIdx === voicedProgression.length - 1) return null;
                const next = voicedProgression[slotIdx + 1];
                const x1 = 95 + slotIdx * 155;
                const x2 = 95 + (slotIdx + 1) * 155;

                const currUppers = curr.midis.slice(1);
                const nextUppers = next.midis.slice(1);

                return currUppers.map((m1, voiceIdx) => {
                  const m2 = nextUppers[voiceIdx] ?? nextUppers[0];
                  const y1 = 185 - (m1 - 55) * 7.2;
                  const y2 = 185 - (m2 - 55) * 7.2;
                  const semitoneMove = Math.abs(m2 - m1);
                  const isCommonTone = semitoneMove === 0;

                  return (
                    <g key={`edge-${slotIdx}-${voiceIdx}`}>
                      <path
                        d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={isCommonTone ? "#00D696" : "#000000"}
                        strokeWidth={isCommonTone ? "4.5" : "2.5"}
                        strokeDasharray={isCommonTone ? undefined : "5 3"}
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 6}
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-black font-bold"
                      >
                        {isCommonTone ? "COMMON" : `Δ${semitoneMove}`}
                      </text>
                    </g>
                  );
                });
              })}

              {/* Voice Nodes at each Bar */}
              {voicedProgression.map((curr, slotIdx) => {
                const x = 95 + slotIdx * 155;
                const currUppers = curr.midis.slice(1);

                return (
                  <g key={`col-${slotIdx}`}>
                    <text
                      x={x}
                      y={18}
                      textAnchor="middle"
                      className="font-heading text-xs fill-black"
                    >
                      {curr.info.chordName} ({curr.info.romanLabel})
                    </text>

                    {currUppers.map((midi, voiceIdx) => {
                      const y = 185 - (midi - 55) * 7.2;
                      const pc = midi % 12;
                      return (
                        <g
                          key={`node-${slotIdx}-${voiceIdx}`}
                          className="cursor-pointer"
                          onClick={() => onPlayNotes([midi], false)}
                        >
                          <circle
                            cx={x + 2}
                            cy={y + 2}
                            r={13}
                            fill="#000"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={13}
                            fill={PITCH_COLORS[pc]}
                            stroke="#000"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={y + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-heading text-[10px] fill-black"
                          >
                            {CHROMATIC_NOTES[pc]}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Right: Functional Gravity Map & Preset Progressions */}
      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="size-5" />
              Bar {activeSlot + 1}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-heading">
              <span className="rounded-base border-2 border-border bg-[#FACC00] px-2 py-1.5">
                Home
              </span>
              <span className="rounded-base border-2 border-border bg-[#38BDF8] px-2 py-1.5">
                Away
              </span>
              <span className="rounded-base border-2 border-border bg-[#FF4D50] px-2 py-1.5 text-white">
                Pull
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {MAJOR_DIATONIC_DEGREES.map((deg) => {
                const info = getChordInfoForDegree(deg.degree);
                const isSelectedInActiveBar =
                  progressionDegrees[activeSlot] === deg.degree;

                return (
                  <button
                    key={deg.degree}
                    onClick={() => setSlotDegree(activeSlot, deg.degree)}
                    className={`min-h-14 rounded-base border-2 border-border px-1 py-1.5 text-center cursor-pointer ${
                      isSelectedInActiveBar
                        ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                        : "bg-background shadow-[2px_2px_0px_0px_#000]"
                    }`}
                    style={{
                      backgroundColor: isSelectedInActiveBar
                        ? deg.color
                        : undefined,
                    }}
                  >
                    <div className="font-heading text-sm leading-none">{info.romanLabel}</div>
                    <div className="mt-1 text-[10px] leading-tight">{info.chordName}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-sm">
              {MAJOR_DIATONIC_DEGREES.find((deg) => deg.degree === progressionDegrees[activeSlot])?.tendency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5" />
              Iconic Progression Blueprints
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {PROGRESSION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setProgressionDegrees(preset.degrees);
                  setActiveSlot(0);
                  const firstInfo = getChordInfoForDegree(preset.degrees[0]);
                  onPlayNotes(
                    getSmoothVoicedChord(
                      firstInfo.chordRootPc,
                      firstInfo.intervals
                    ),
                    false
                  );
                }}
                className="w-full p-2.5 rounded-base border-2 border-border bg-background shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm">{preset.name}</span>
                  <Badge className="text-[10px]">{preset.genre}</Badge>
                </div>
                <p className="text-xs text-foreground/80 mt-1">
                  {preset.story}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
