"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  ENHARMONIC_LABELS,
  PITCH_COLORS,
  CHORD_QUALITIES,
  SCALES,
  CIRCLE_OF_FIFTHS_ORDER,
  ChordQuality,
  ScaleDefinition,
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
import { Play, RotateCcw, Orbit, Compass, Triangle } from "lucide-react";

interface HarmonicGeometryLabProps {
  rootPc: number;
  onSelectRoot: (pc: number) => void;
  selectedChord: ChordQuality;
  onSelectChord: (chord: ChordQuality) => void;
  selectedScale: ScaleDefinition;
  onSelectScale: (scale: ScaleDefinition) => void;
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
}

export function HarmonicGeometryLab({
  rootPc,
  onSelectRoot,
  selectedChord,
  onSelectChord,
  selectedScale,
  onSelectScale,
  onPlayNotes,
}: HarmonicGeometryLabProps) {
  const [isFifthsSpace, setIsFifthsSpace] = React.useState(false);
  const [overlayMode, setOverlayMode] = React.useState<"chord" | "scale" | "both">("both");

  // Order of pitch classes around the 12-node clock
  const ringOrder = isFifthsSpace
    ? CIRCLE_OF_FIFTHS_ORDER
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const chordPcs = selectedChord.intervals.map((i) => (rootPc + i) % 12);
  const scalePcs = selectedScale.intervals.map((i) => (rootPc + i) % 12);

  const cx = 210;
  const cy = 210;
  const radius = 152;

  const getNodeCoords = (pc: number, r = radius) => {
    const slotIndex = ringOrder.indexOf(pc);
    const angle = (slotIndex * 30 - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      slotIndex,
    };
  };

  // Sort polygon vertices in clockwise order around the ring so the polygon never self-intersects
  const getPolygonPoints = (pcs: number[], r = radius) => {
    const sorted = [...pcs].sort(
      (a, b) => ringOrder.indexOf(a) - ringOrder.indexOf(b)
    );
    return sorted
      .map((pc) => {
        const pt = getNodeCoords(pc, r);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");
  };

  const triggerChordAudio = (root = rootPc, chord = selectedChord, arp = false) => {
    const midis = chord.intervals.map((semi) => 60 + root + semi);
    onPlayNotes(midis, arp);
  };

  // Compute intervals between adjacent chord notes for geometric proof
  const intervalGaps = selectedChord.intervals.map((val, idx, arr) => {
    const next = idx === arr.length - 1 ? 12 : arr[idx + 1];
    return next - val;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Interactive SVG Polygon Clock */}
      <Card className="lg:col-span-7 bg-secondary-background">
        <CardHeader className="border-b-2 border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge className="mb-1.5 bg-main text-main-foreground">
                VISUAL INSIGHT #1 // HARMONY = GEOMETRY
              </Badge>
              <CardTitle className="text-xl sm:text-2xl">
                The 12-Tone Polygon & Circle of Fifths Clock
              </CardTitle>
              <CardDescription className="mt-1">
                Every chord and scale is a geometric polygon inscribed in a 12-point circle. Rotate the polygon to transpose to any key!
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-background px-3 py-2 shadow-[2px_2px_0px_0px_#000]">
              <Compass className="size-4" />
              <span className="text-xs font-heading">
                {isFifthsSpace ? "Circle of 5ths (+7)" : "Chromatic (+1)"}
              </span>
              <Switch
                checked={isFifthsSpace}
                onCheckedChange={(checked) => setIsFifthsSpace(Boolean(checked))}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex flex-col items-center">
          {/* Overlay Mode Selector + Play Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full mb-3">
            <div className="flex items-center gap-1.5">
              {(["both", "chord", "scale"] as const).map((m) => (
                <Button
                  key={m}
                  size="xs"
                  variant={overlayMode === m ? "default" : "neutral"}
                  onClick={() => setOverlayMode(m)}
                >
                  {m === "both"
                    ? "Chord + Scale"
                    : m === "chord"
                      ? "Chord Polygon"
                      : "Scale Star"}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="neutral"
                onClick={() => {
                  const nextRoot = isFifthsSpace
                    ? (rootPc + 7) % 12
                    : (rootPc + 1) % 12;
                  onSelectRoot(nextRoot);
                  triggerChordAudio(nextRoot, selectedChord, false);
                }}
              >
                <RotateCcw className="size-3.5 rotate-180" />
                Rotate Clockwise
              </Button>
              <Button
                size="xs"
                onClick={() => triggerChordAudio(rootPc, selectedChord, false)}
              >
                <Play className="size-3.5" />
                Strum {CHROMATIC_NOTES[rootPc]}
                {selectedChord.symbol}
              </Button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full max-w-[430px] aspect-square rounded-base border-2 border-border bg-background bg-grid-pattern shadow-shadow p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 420 420"
              className="w-full h-full overflow-visible select-none"
            >
              {/* Outer Guide Circles */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="white"
                fillOpacity={0.75}
                stroke="#000"
                strokeWidth="3"
              />
              <circle
                cx={cx}
                cy={cy}
                r={radius * 0.68}
                fill="none"
                stroke="#000"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                opacity={0.45}
              />

              {/* Radial Spokes */}
              {ringOrder.map((pc) => {
                const pt = getNodeCoords(pc);
                const isScaleNote = scalePcs.includes(pc);
                return (
                  <line
                    key={`spoke-${pc}`}
                    x1={cx}
                    y1={cy}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#000"
                    strokeWidth={isScaleNote ? "1.5" : "1"}
                    strokeOpacity={isScaleNote ? 0.25 : 0.1}
                  />
                );
              })}

              {/* Scale Polygon Layer */}
              {(overlayMode === "scale" || overlayMode === "both") && (
                <polygon
                  points={getPolygonPoints(scalePcs, radius)}
                  fill="#00D696"
                  fillOpacity={overlayMode === "scale" ? 0.35 : 0.18}
                  stroke="#000"
                  strokeWidth="2.5"
                  strokeDasharray={overlayMode === "both" ? "6 4" : undefined}
                />
              )}

              {/* Chord Polygon Layer */}
              {(overlayMode === "chord" || overlayMode === "both") && (
                <polygon
                  points={getPolygonPoints(chordPcs, radius)}
                  fill={selectedChord.color}
                  fillOpacity={0.55}
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              )}

              {/* Center Hub Badge */}
              <circle
                cx={cx}
                cy={cy}
                r={42}
                fill="#ffffff"
                stroke="#000"
                strokeWidth="3"
              />
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                className="font-heading text-lg fill-black"
              >
                {CHROMATIC_NOTES[rootPc]}
                {selectedChord.symbol}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                className="font-mono text-[10px] fill-black/75"
              >
                {selectedChord.formula.join(" – ")}
              </text>

              {/* 12 Pitch Class Nodes */}
              {ringOrder.map((pc) => {
                const pt = getNodeCoords(pc);
                const isRoot = pc === rootPc;
                const isInChord = chordPcs.includes(pc);
                const isInScale = scalePcs.includes(pc);
                const semitoneFromRoot = (pc - rootPc + 12) % 12;

                return (
                  <g
                    key={`node-${pc}`}
                    className="cursor-pointer"
                    onClick={() => {
                      onSelectRoot(pc);
                      triggerChordAudio(pc, selectedChord, false);
                    }}
                  >
                    {/* Shadow Circle */}
                    <circle
                      cx={pt.x + 3}
                      cy={pt.y + 3}
                      r={isRoot ? 26 : isInChord ? 23 : 19}
                      fill="#000"
                    />
                    {/* Main Node Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isRoot ? 26 : isInChord ? 23 : 19}
                      fill={
                        isRoot || isInChord
                          ? PITCH_COLORS[pc]
                          : isInScale
                            ? "#ffffff"
                            : "#e5e5e5"
                      }
                      stroke="#000"
                      strokeWidth={isRoot ? "3.5" : "2.5"}
                    />
                    {/* Note Name */}
                    <text
                      x={pt.x}
                      y={pt.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-heading text-xs sm:text-sm fill-black"
                    >
                      {CHROMATIC_NOTES[pc]}
                    </text>
                    {/* Semitone Badge */}
                    <text
                      x={pt.x}
                      y={pt.y + 13}
                      textAnchor="middle"
                      className="font-mono text-[9px] fill-black/80"
                    >
                      +{semitoneFromRoot}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Geometric Law Callout */}
          <div className="mt-4 w-full rounded-base border-2 border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase text-foreground/70">
                GEOMETRIC SIGNATURE: {selectedChord.shapeName}
              </div>
              <div className="text-sm font-base mt-0.5">
                {isFifthsSpace ? (
                  <>
                    In <strong>Circle of Fifths space</strong>, the 7 notes of{" "}
                    <strong>
                      {CHROMATIC_NOTES[rootPc]} {selectedScale.name}
                    </strong>{" "}
                    cluster into a contiguous crescent! Adjacent keys share 6 of 7 notes.
                  </>
                ) : (
                  <>
                    In <strong>Chromatic space</strong>, a Major triad is always a{" "}
                    <strong>4 + 3 + 5</strong> triangle, and a Minor triad is its exact mirror reflection (<strong>3 + 4 + 5</strong>)!
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {intervalGaps.map((gap, i) => (
                <Badge key={i} variant="neutral" className="font-mono">
                  {gap} semi
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Shape Controls & Symmetry Inspector */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Triangle className="size-5" />
              1. Pick a Chord Polygon Shape
            </CardTitle>
            <CardDescription>
              Watch how symmetric shapes (Augmented = equilateral triangle, Diminished 7th = square) sound floating and restless, while asymmetric shapes feel grounded.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHORD_QUALITIES.map((chord) => {
                const isSelected = selectedChord.id === chord.id;
                return (
                  <button
                    key={chord.id}
                    onClick={() => {
                      onSelectChord(chord);
                      triggerChordAudio(rootPc, chord, false);
                    }}
                    className={`p-2.5 rounded-base border-2 border-border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-black"
                        : "bg-background shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    }`}
                    style={{
                      backgroundColor: isSelected ? chord.color : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm">
                        {CHROMATIC_NOTES[rootPc]}
                        {chord.symbol}
                      </span>
                      <span className="font-mono text-[10px] px-1 rounded bg-white/80 border border-black">
                        {chord.intervals.join("-")}
                      </span>
                    </div>
                    <div className="text-xs font-base mt-1 truncate">
                      {chord.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Chord Breakdown */}
            <div className="mt-4 rounded-base border-2 border-border bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading text-base">
                  {ENHARMONIC_LABELS[CHROMATIC_NOTES[rootPc]]}{" "}
                  {selectedChord.name}
                </span>
                <Button
                  size="xs"
                  variant="neutral"
                  onClick={() => triggerChordAudio(rootPc, selectedChord, true)}
                >
                  <Play className="size-3.5" />
                  Arpeggiate
                </Button>
              </div>
              <p className="text-xs text-foreground/80 mb-3">
                {selectedChord.character}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedChord.intervals.map((semi, idx) => {
                  const pc = (rootPc + semi) % 12;
                  return (
                    <button
                      key={semi}
                      onClick={() => onPlayNotes([60 + rootPc + semi], false)}
                      className="flex items-center gap-1.5 rounded-base border-2 border-border px-2.5 py-1 text-xs font-heading shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                      style={{ backgroundColor: PITCH_COLORS[pc] }}
                    >
                      <span>{selectedChord.formula[idx]}:</span>
                      <span>{CHROMATIC_NOTES[pc]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Orbit className="size-5" />
              2. Overlay Scale / Mode Constellation
            </CardTitle>
            <CardDescription>
              Toggle to Circle of Fifths (+7) on the clock above to see why Major and Pentatonic scales group together cleanly.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-2">
              {SCALES.slice(0, 8).map((scale) => {
                const isSelected = selectedScale.id === scale.id;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      onSelectScale(scale);
                      const midis = [
                        ...scale.intervals.map((s) => 60 + rootPc + s),
                        72 + rootPc,
                      ];
                      onPlayNotes(midis, true);
                    }}
                    className={`p-2 rounded-base border-2 border-border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-main translate-x-[2px] translate-y-[2px] shadow-none"
                        : "bg-background shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    }`}
                  >
                    <div className="font-heading text-xs sm:text-sm">
                      {scale.name}
                    </div>
                    <div className="text-[11px] font-mono text-foreground/75">
                      {scale.characterNote}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
