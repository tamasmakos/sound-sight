"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  INTERVALS,
  IntervalInfo,
  midiToFreq,
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
import { Play, Sparkles } from "lucide-react";

interface IntervalWaveLabProps {
  rootPc: number;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onIntervalChange?: (interval: IntervalInfo) => void;
  embedded?: boolean;
}

export function IntervalWaveLab({
  rootPc,
  onPlayNotes,
  onIntervalChange,
  embedded = false,
}: IntervalWaveLabProps) {
  const [selectedInterval, setSelectedInterval] = React.useState<IntervalInfo>(
    INTERVALS[7] // Perfect Fifth (3:2) default
  );

  React.useEffect(() => {
    onIntervalChange?.(selectedInterval);
  }, [selectedInterval, onIntervalChange]);
  const [phase, setPhase] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!isAnimating) return;
    let frameId: number;
    const tick = () => {
      setPhase((p) => (p + 0.035) % (Math.PI * 20));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    const [num, den] = selectedInterval.ratio;
    const baseCycles = 2.5;
    const freq1 = baseCycles;
    const freq2 = baseCycles * (num / den);

    // Wave 1 (Root note)
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const t = (x / w) * Math.PI * 2;
      const y = h / 2 + Math.sin(t * freq1 + phase) * 36;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Wave 2 (Interval note)
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const t = (x / w) * Math.PI * 2;
      const y = h / 2 + Math.sin(t * freq2 + phase) * 36;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#FF66C4";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Combined Superposition Wave
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const t = (x / w) * Math.PI * 2;
      const y1 = Math.sin(t * freq1 + phase) * 36;
      const y2 = Math.sin(t * freq2 + phase) * 36;
      const y = h / 2 + (y1 + y2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [selectedInterval, phase]);

  // Generate Lissajous SVG path
  const lissajousPoints = React.useMemo(() => {
    const [num, den] = selectedInterval.ratio;
    const pts: string[] = [];
    const steps = 420;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * Math.min(den, 16);
      const x = 110 + 82 * Math.sin(num * t + phase * 0.4);
      const y = 110 + 82 * Math.sin(den * t);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [selectedInterval, phase]);

  const rootMidi = 60 + rootPc;
  const targetMidi = rootMidi + selectedInterval.semitones;
  const targetPc = targetMidi % 12;

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Left: Wave Superposition + Lissajous Physics */}
      <Card className="bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!embedded && (
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  How two notes lock, or beat
                </CardTitle>
                <CardDescription className="mt-1">
                  Simple ratios line up. Complicated ones shimmer and clash.
                </CardDescription>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="neutral"
                onClick={() => setIsAnimating((a) => !a)}
              >
                {isAnimating ? "Pause Waves" : "Animate Waves"}
              </Button>
              <Button
                size="xs"
                onClick={() => onPlayNotes([rootMidi, targetMidi], false)}
              >
                <Play className="size-3.5" />
                Hear Together
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Top Oscilloscope */}
          <div className="rounded-base border-2 border-border bg-white p-3 shadow-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full bg-[#38BDF8] border border-black inline-block" />
                  Root {CHROMATIC_NOTES[rootPc]}4 (
                  {midiToFreq(rootMidi).toFixed(1)} Hz)
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full bg-[#FF66C4] border border-black inline-block" />
                  Target {CHROMATIC_NOTES[targetPc]} (
                  {midiToFreq(targetMidi).toFixed(1)} Hz)
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <span className="size-2.5 rounded-full bg-black inline-block" />
                  Combined Wave
                </span>
              </div>
              <Badge variant="neutral" className="font-mono">
                Acoustic Ratio: {selectedInterval.ratioLabel}
              </Badge>
            </div>

            <canvas
              ref={canvasRef}
              width={640}
              height={190}
              className="w-full h-44 rounded-base border-2 border-border bg-[#FFFDF5]"
            />
          </div>

          {/* Bottom Split: Lissajous Figure + Interval Physics Readout */}
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-base border-2 border-border bg-background p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="text-xs font-mono uppercase mb-1 font-bold">
                Lissajous Knot ({selectedInterval.ratioLabel})
              </div>
              <svg
                viewBox="0 0 220 220"
                className="w-40 h-40 rounded-base border-2 border-border bg-white"
              >
                <polyline
                  fill="none"
                  stroke={selectedInterval.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={lissajousPoints}
                />
                <polyline
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={lissajousPoints}
                />
              </svg>
              <span className="text-[11px] text-center mt-1.5 text-foreground/80">
                Simpler ratios trace clean, open loops; complex ratios weave dense knots.
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-base border-2 border-border bg-background p-4 shadow-[3px_3px_0px_0px_#000]">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    style={{ backgroundColor: selectedInterval.color }}
                    className="text-black font-mono"
                  >
                    {selectedInterval.shortName} • {selectedInterval.semitones}{" "}
                    Semitones
                  </Badge>
                  <span className="text-xs font-heading uppercase">
                    {selectedInterval.consonance}
                  </span>
                </div>

                <h3 className="text-xl font-heading mt-2">
                  {selectedInterval.name} ({CHROMATIC_NOTES[rootPc]} →{" "}
                  {CHROMATIC_NOTES[targetPc]})
                </h3>
                <p className="text-sm mt-1 text-foreground/85">
                  <strong>Character:</strong> {selectedInterval.feeling}
                </p>
                <p className="text-xs font-mono mt-1.5 bg-white px-2.5 py-1.5 rounded-base border-2 border-border">
                  <Sparkles className="size-3.5 inline mr-1" />
                  Famous Ear Anchor:{" "}
                  <strong>{selectedInterval.songReference}</strong>
                </p>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-heading">
                  <span>Acoustic Consonance Stability</span>
                  <span>{selectedInterval.consonanceScore}%</span>
                </div>
                <Progress value={selectedInterval.consonanceScore} />
                <div className="flex gap-2 pt-2">
                  <Button
                    size="xs"
                    variant="neutral"
                    className="flex-1"
                    onClick={() => onPlayNotes([rootMidi, targetMidi], true)}
                  >
                    Melodic (One by One)
                  </Button>
                  <Button
                    size="xs"
                    className="flex-1"
                    onClick={() => onPlayNotes([rootMidi, targetMidi], false)}
                  >
                    Harmonic (Together)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-base border-2 border-border bg-white p-2">
        <div className="grid min-w-[40rem] grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
          {INTERVALS.map((interval) => {
            const isSelected = selectedInterval.semitones === interval.semitones;
            return (
              <button
                key={interval.semitones}
                onClick={() => {
                  setSelectedInterval(interval);
                  onPlayNotes([rootMidi, rootMidi + interval.semitones], false);
                }}
                className={`flex h-14 flex-col items-center justify-center rounded-base border-2 border-border px-1 text-center cursor-pointer ${
                  isSelected ? "bg-main" : "bg-white"
                }`}
              >
                <span className="font-heading text-xs leading-none">{interval.shortName}</span>
                <span className="mt-1 font-mono text-[10px] leading-none">{interval.semitones}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
