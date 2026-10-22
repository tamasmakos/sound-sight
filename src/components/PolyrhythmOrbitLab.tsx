"use client";

import React from "react";
import { soundEngine } from "@/lib/audio-engine";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Square, Disc, Zap } from "lucide-react";

interface PolyrhythmPreset {
  name: string;
  ringA: number;
  ringB: number;
  origin: string;
  mnemonic: string;
}

const POLYRHYTHM_PRESETS: PolyrhythmPreset[] = [
  {
    name: "3 : 2 Hemiola",
    ringA: 3,
    ringB: 2,
    origin: "Afro-Cuban Son / Chopin Waltz",
    mnemonic: "'NOT DIFF-I-CULT' (Together – Right – Left – Right)",
  },
  {
    name: "4 : 3 Cross-Rhythm",
    ringA: 4,
    ringB: 3,
    origin: "West African Bell / Jazz Polyrhythm",
    mnemonic: "'PASS THE GOD-DAMN BUT-TER'",
  },
  {
    name: "5 : 4 Quintuplet Groove",
    ringA: 5,
    ringB: 4,
    origin: "Modern Prog / Math Rock",
    mnemonic: "'LOOK-ING FOR A NEW HOME-STEAD'",
  },
  {
    name: "3 : 8 Tresillo vs 8th Pulse",
    ringA: 3,
    ringB: 8,
    origin: "Reggaeton / Dancehall / Clave Core",
    mnemonic: "3 evenly spaced hits inside an 8-pulse wheel",
  },
];

export function PolyrhythmOrbitLab() {
  const [ringA, setRingA] = React.useState(3);
  const [ringB, setRingB] = React.useState(2);
  const [bpm, setBpm] = React.useState(96);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0 to 1 around the cycle

  const lastTrigARef = React.useRef<number>(-1);
  const lastTrigBRef = React.useRef<number>(-1);

  React.useEffect(() => {
    if (!isPlaying) {
      lastTrigARef.current = -1;
      lastTrigBRef.current = -1;
      return;
    }

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 1 full cycle = 4 beats at current BPM
      const cycleSeconds = (60 / bpm) * 4;

      setProgress((prev) => {
        const next = (prev + dt / cycleSeconds) % 1;

        const stepA = Math.floor(next * ringA);
        const stepB = Math.floor(next * ringB);

        if (stepA !== lastTrigARef.current) {
          lastTrigARef.current = stepA;
          if (stepA === 0) {
            soundEngine.playPercussion("accent");
          } else {
            soundEngine.playPercussion("ringA");
          }
        }

        if (stepB !== lastTrigBRef.current) {
          lastTrigBRef.current = stepB;
          if (stepB !== 0) {
            soundEngine.playPercussion("ringB");
          }
        }

        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, bpm, ringA, ringB]);

  const cx = 200;
  const cy = 200;
  const rOuter = 148;
  const rInner = 96;

  const getOrbitCoords = (fraction: number, radius: number) => {
    const angle = (fraction * 360 - 90) * (Math.PI / 180);
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const handCoords = getOrbitCoords(progress, rOuter + 14);

  // Compute LCM grid for linear visualization
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const lcm = (ringA * ringB) / gcd(ringA, ringB);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Concentric Polyrhythm Radar */}
      <Card className="lg:col-span-7 bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge className="mb-1.5 bg-main text-main-foreground">
                VISUAL INSIGHT #5 // RHYTHM = GEOMETRY IN TIME
              </Badge>
              <CardTitle className="text-xl sm:text-2xl">
                Euclidean & Polyrhythm Orbit Sequencer ({ringA} : {ringB})
              </CardTitle>
              <CardDescription className="mt-1">
                A polyrhythm is simply two regular polygons spinning at the same cycle speed! Watch the radar arm strike the outer ({ringA}) and inner ({ringB}) vertices.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setIsPlaying((p) => !p)}
              variant={isPlaying ? "neutral" : "default"}
            >
              {isPlaying ? (
                <>
                  <Square className="size-4 fill-current" /> Stop Orbit
                </>
              ) : (
                <>
                  <Play className="size-4" /> Start Orbit
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-[400px] aspect-square rounded-base border-2 border-border bg-background bg-grid-pattern shadow-shadow p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full overflow-visible select-none"
            >
              {/* Outer Ring A Circle & Polygon */}
              <circle
                cx={cx}
                cy={cy}
                r={rOuter}
                fill="white"
                fillOpacity={0.8}
                stroke="#000"
                strokeWidth="3"
              />
              <polygon
                points={Array.from({ length: ringA }, (_, i) => {
                  const pt = getOrbitCoords(i / ringA, rOuter);
                  return `${pt.x},${pt.y}`;
                }).join(" ")}
                fill="#FACC00"
                fillOpacity={0.35}
                stroke="#000"
                strokeWidth="3"
              />

              {/* Inner Ring B Circle & Polygon */}
              <circle
                cx={cx}
                cy={cy}
                r={rInner}
                fill="white"
                stroke="#000"
                strokeWidth="2.5"
              />
              <polygon
                points={Array.from({ length: ringB }, (_, i) => {
                  const pt = getOrbitCoords(i / ringB, rInner);
                  return `${pt.x},${pt.y}`;
                }).join(" ")}
                fill="#7A83FF"
                fillOpacity={0.45}
                stroke="#000"
                strokeWidth="3"
              />

              {/* Sweeping Radar Arm */}
              <line
                x1={cx}
                y1={cy}
                x2={handCoords.x}
                y2={handCoords.y}
                stroke="#FF4D50"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx={cx}
                cy={cy}
                r={18}
                fill="#000"
              />
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-[10px] fill-[#FACC00] font-bold"
              >
                {ringA}:{ringB}
              </text>

              {/* Ring A Nodes */}
              {Array.from({ length: ringA }, (_, i) => {
                const frac = i / ringA;
                const pt = getOrbitCoords(frac, rOuter);
                const isActive =
                  isPlaying && Math.floor(progress * ringA) === i;
                return (
                  <g
                    key={`a-${i}`}
                    className="cursor-pointer"
                    onClick={() =>
                      soundEngine.playPercussion(i === 0 ? "accent" : "ringA")
                    }
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 18 : 14}
                      fill={i === 0 ? "#FF4D50" : "#FACC00"}
                      stroke="#000"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-heading text-xs fill-black"
                    >
                      A{i + 1}
                    </text>
                  </g>
                );
              })}

              {/* Ring B Nodes */}
              {Array.from({ length: ringB }, (_, i) => {
                const frac = i / ringB;
                const pt = getOrbitCoords(frac, rInner);
                const isActive =
                  isPlaying && Math.floor(progress * ringB) === i;
                return (
                  <g
                    key={`b-${i}`}
                    className="cursor-pointer"
                    onClick={() =>
                      soundEngine.playPercussion(i === 0 ? "accent" : "ringB")
                    }
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 17 : 13}
                      fill={i === 0 ? "#FF4D50" : "#7A83FF"}
                      stroke="#000"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-heading text-xs fill-white"
                    >
                      B{i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Unrolled LCM Linear Grid */}
          <div className="w-full rounded-base border-2 border-border bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center justify-between text-xs font-heading mb-2">
              <span>
                UNROLLED LEAST-COMMON-MULTIPLE GRID ({lcm} Subdivisions)
              </span>
              <span className="font-mono">
                {ringA} × {ringB} = {lcm} grid slots
              </span>
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${Math.min(lcm, 24)}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: Math.min(lcm, 24) }, (_, idx) => {
                const hitA = idx % (lcm / ringA) === 0;
                const hitB = idx % (lcm / ringB) === 0;
                const isCurrent =
                  isPlaying && Math.floor(progress * Math.min(lcm, 24)) === idx;
                return (
                  <div
                    key={idx}
                    className={`h-12 rounded border-2 border-black flex flex-col justify-between items-center p-0.5 text-[9px] font-mono ${
                      isCurrent ? "ring-2 ring-[#FF4D50]" : ""
                    }`}
                  >
                    <span
                      className={`w-full h-4 rounded-xs border border-black ${
                        hitA ? "bg-[#FACC00]" : "bg-neutral-100"
                      }`}
                    />
                    <span
                      className={`w-full h-4 rounded-xs border border-black ${
                        hitB ? "bg-[#7A83FF]" : "bg-neutral-100"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right: Controls & Presets */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Disc className="size-5" />
              Customize Polygon Pulse Ratios
            </CardTitle>
            <CardDescription>
              Notice how the mathematical ratios of polyrhythms (3:2, 4:3, 5:4) are the exact same ratios as musical intervals (Perfect 5th = 3:2, Perfect 4th = 4:3, Major 3rd = 5:4) slowed down by 8 octaves!
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-heading">
                <span>Outer Ring A Pulses (Yellow Polygon)</span>
                <Badge>{ringA} Pulses</Badge>
              </div>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <Button
                    key={n}
                    size="xs"
                    variant={ringA === n ? "default" : "neutral"}
                    onClick={() => setRingA(n)}
                    className="flex-1"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-heading">
                <span>Inner Ring B Pulses (Indigo Polygon)</span>
                <Badge className="bg-[#7A83FF] text-white">{ringB} Pulses</Badge>
              </div>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <Button
                    key={n}
                    size="xs"
                    variant={ringB === n ? "default" : "neutral"}
                    onClick={() => setRingB(n)}
                    className="flex-1"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-heading">
                <span>Cycle Tempo (BPM)</span>
                <span className="font-mono">{bpm} BPM</span>
              </div>
              <Slider
                min={50}
                max={160}
                value={[bpm]}
                onValueChange={(val) => {
                  const nextVal = Array.isArray(val) ? val[0] : val;
                  if (typeof nextVal === "number") setBpm(nextVal);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="size-5" />
              Famous Polyrhythm & Speech Mnemonics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {POLYRHYTHM_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setRingA(preset.ringA);
                  setRingB(preset.ringB);
                  setIsPlaying(true);
                }}
                className="w-full p-3 rounded-base border-2 border-border bg-background shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm">{preset.name}</span>
                  <Badge variant="neutral" className="text-[10px]">
                    {preset.origin}
                  </Badge>
                </div>
                <div className="text-xs font-mono mt-1 text-foreground/85">
                  Say: <strong>{preset.mnemonic}</strong>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
