"use client";

import React from "react";
import {
  CHROMATIC_NOTES,
  CHORD_QUALITIES,
  SCALES,
  ChordQuality,
  ScaleDefinition,
} from "@/lib/music-theory";
import { soundEngine, SynthWaveform } from "@/lib/audio-engine";
import { InteractiveKeyboard } from "@/components/InteractiveKeyboard";
import { HarmonicGeometryLab } from "@/components/HarmonicGeometryLab";
import { IntervalWaveLab } from "@/components/IntervalWaveLab";
import { ScaleModeLab } from "@/components/ScaleModeLab";
import { ChordFlowLab } from "@/components/ChordFlowLab";
import { PolyrhythmOrbitLab } from "@/components/PolyrhythmOrbitLab";
import { TeoriaEarGym } from "@/components/TeoriaEarGym";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Waves,
  Layers,
  GitBranch,
  Disc,
  Ear,
  Volume2,
  VolumeX,
  Palette,
  Music,
  BookOpen,
} from "lucide-react";

type PaletteTheme = "yellow" | "violet" | "mint" | "coral";

export default function HomePage() {
  const [rootPc, setRootPc] = React.useState<number>(0); // C
  const [selectedChord, setSelectedChord] = React.useState<ChordQuality>(
    CHORD_QUALITIES[0]
  );
  const [selectedScale, setSelectedScale] = React.useState<ScaleDefinition>(
    SCALES[1] // Major (Ionian)
  );
  const [activeMidis, setActiveMidis] = React.useState<number[]>([60, 64, 67]);
  const [waveform, setWaveform] = React.useState<SynthWaveform>("triangle");
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [palette, setPalette] = React.useState<PaletteTheme>("yellow");
  const [activeTab, setActiveTab] = React.useState<string>("geometry");

  React.useEffect(() => {
    if (palette === "yellow") {
      document.documentElement.removeAttribute("data-palette");
    } else {
      document.documentElement.setAttribute("data-palette", palette);
    }
  }, [palette]);

  const handleTriggerSingleMidi = React.useCallback((midi: number) => {
    soundEngine.playMidi(midi, 0.55);
    setActiveMidis([midi]);
  }, []);

  const handlePlayNotes = React.useCallback(
    (midis: number[], arpeggiate = false) => {
      setActiveMidis(midis);
      if (arpeggiate) {
        soundEngine.playScaleSequence(midis, 0.19);
      } else {
        soundEngine.playChord(midis, 0.85, 0.03);
      }
    },
    []
  );

  // Compute highlighted pitch classes for the piano keyboard based on current tab
  const highlightedPitchClasses = React.useMemo(() => {
    if (activeTab === "scales") {
      return selectedScale.intervals.map((s) => (rootPc + s) % 12);
    }
    const chordPcs = selectedChord.intervals.map((s) => (rootPc + s) % 12);
    const scalePcs = selectedScale.intervals.map((s) => (rootPc + s) % 12);
    return Array.from(new Set([...chordPcs, ...scalePcs]));
  }, [activeTab, rootPc, selectedChord, selectedScale]);

  const handleStrumHighlighted = () => {
    if (activeTab === "scales") {
      const midis = [
        ...selectedScale.intervals.map((s) => 60 + rootPc + s),
        72 + rootPc,
      ];
      handlePlayNotes(midis, true);
    } else {
      const midis = selectedChord.intervals.map((s) => 60 + rootPc + s);
      handlePlayNotes(midis, false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Neobrutalist Header */}
      <header className="sticky top-0 z-40 border-b-2 border-border bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-base border-2 border-border bg-main shadow-[3px_3px_0px_0px_#000] flex items-center justify-center">
              <Music className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg sm:text-xl tracking-tight">
                  TEORIA // VISUAL LAB
                </span>
                <Badge className="hidden sm:inline-flex font-mono text-[10px]">
                  NEOBRUTALIST EDITION
                </Badge>
              </div>
              <p className="text-xs text-foreground/75">
                See Music Theory Through Geometry, Wave Ratios & Interactive Synthesis
              </p>
            </div>
          </div>

          {/* Right Synth & Palette Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Synth Waveform Selector */}
            <div className="flex items-center rounded-base border-2 border-border bg-background p-0.5">
              {(["triangle", "sine", "sawtooth", "square"] as SynthWaveform[]).map(
                (w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWaveform(w);
                      soundEngine.setWaveform(w);
                      soundEngine.playMidi(60 + rootPc, 0.35, 0, w);
                    }}
                    className={`px-2 py-1 text-xs font-mono rounded-base transition-all cursor-pointer uppercase ${
                      waveform === w
                        ? "bg-main font-bold border border-border"
                        : "hover:bg-white/60"
                    }`}
                  >
                    {w === "sawtooth" ? "saw" : w}
                  </button>
                )
              )}
            </div>

            {/* Palette Switcher */}
            <div className="flex items-center gap-1 rounded-base border-2 border-border bg-background px-2 py-1">
              <Palette className="size-3.5 mr-0.5" />
              {(
                [
                  { id: "yellow", color: "#FACC00" },
                  { id: "violet", color: "#88AAEE" },
                  { id: "mint", color: "#00D696" },
                  { id: "coral", color: "#FF6B6B" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  aria-label={`Switch palette to ${p.id}`}
                  onClick={() => setPalette(p.id)}
                  className={`size-4 rounded-full border-2 border-black cursor-pointer transition-transform ${
                    palette === p.id ? "scale-125 ring-1 ring-black" : ""
                  }`}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>

            <Button
              size="xs"
              variant={isMuted ? "neutral" : "default"}
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                soundEngine.setMuted(next);
              }}
            >
              {isMuted ? (
                <>
                  <VolumeX className="size-3.5" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="size-3.5" /> Audio Live
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Banner */}
        <section className="rounded-base border-2 border-border bg-main shadow-shadow p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="neutral"
                className="font-mono text-xs uppercase bg-white"
              >
                <BookOpen className="size-3 mr-1" /> Inspired by Teoria.com
              </Badge>
              <Badge
                variant="neutral"
                className="font-mono text-xs uppercase bg-white"
              >
                100% Live Web Audio Synthesis
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading tracking-tight leading-tight">
              Don&apos;t Memorize Rules.{" "}
              <span className="underline decoration-4">
                See the Shapes of Sound.
              </span>
            </h1>
            <p className="text-sm sm:text-base font-base text-main-foreground/90">
              Every music theory concept has a dead-simple visual truth: chords are{" "}
              <strong>polygons on a 12-hour clock</strong>, consonance is{" "}
              <strong>wave synchronization</strong>, modes are a{" "}
              <strong>brightness dimmer switch</strong>, and polyrhythms are{" "}
              <strong>spinning geometric orbits</strong>.
            </p>
          </div>

          {/* Quick Mental Model Pill Cards */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <div className="rounded-base border-2 border-border bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="text-[11px] font-mono uppercase text-foreground/70">
                ACTIVE ROOT KEY
              </div>
              <div className="text-2xl font-heading">
                {CHROMATIC_NOTES[rootPc]} Major /{" "}
                {CHROMATIC_NOTES[(rootPc + 9) % 12]}m
              </div>
            </div>
            <div className="rounded-base border-2 border-border bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="text-[11px] font-mono uppercase text-foreground/70">
                ACTIVE CHORD SHAPE
              </div>
              <div className="text-2xl font-heading">
                {CHROMATIC_NOTES[rootPc]}
                {selectedChord.symbol}{" "}
                <span className="text-xs font-mono">
                  ({selectedChord.formula.join("-")})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive 6-Lab Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(String(val))}
          className="w-full"
        >
          <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1.5 p-1.5">
            <TabsTrigger value="geometry">
              <Compass className="size-4" />
              1. 12-Tone Polygon & Circle of 5ths
            </TabsTrigger>
            <TabsTrigger value="waves">
              <Waves className="size-4" />
              2. Interval Wave Physics
            </TabsTrigger>
            <TabsTrigger value="scales">
              <Layers className="size-4" />
              3. Modal Brightness Spectrum
            </TabsTrigger>
            <TabsTrigger value="progressions">
              <GitBranch className="size-4" />
              4. Chord Gravity & Voice Leading
            </TabsTrigger>
            <TabsTrigger value="rhythm">
              <Disc className="size-4" />
              5. Polyrhythm Orbit Radar
            </TabsTrigger>
            <TabsTrigger value="eargym">
              <Ear className="size-4" />
              6. Teoria Ear-Training Gym
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geometry">
            <HarmonicGeometryLab
              rootPc={rootPc}
              onSelectRoot={setRootPc}
              selectedChord={selectedChord}
              onSelectChord={setSelectedChord}
              selectedScale={selectedScale}
              onSelectScale={setSelectedScale}
              onPlayNotes={handlePlayNotes}
            />
          </TabsContent>

          <TabsContent value="waves">
            <IntervalWaveLab rootPc={rootPc} onPlayNotes={handlePlayNotes} />
          </TabsContent>

          <TabsContent value="scales">
            <ScaleModeLab
              rootPc={rootPc}
              selectedScale={selectedScale}
              onSelectScale={setSelectedScale}
              onPlayNotes={handlePlayNotes}
              onPlaySingleMidi={handleTriggerSingleMidi}
            />
          </TabsContent>

          <TabsContent value="progressions">
            <ChordFlowLab rootPc={rootPc} onPlayNotes={handlePlayNotes} />
          </TabsContent>

          <TabsContent value="rhythm">
            <PolyrhythmOrbitLab />
          </TabsContent>

          <TabsContent value="eargym">
            <TeoriaEarGym onPlayNotes={handlePlayNotes} />
          </TabsContent>
        </Tabs>

        {/* Persistent Interactive Piano & Harmonic Strip */}
        <section>
          <InteractiveKeyboard
            rootPc={rootPc}
            highlightedPitchClasses={highlightedPitchClasses}
            activeMidis={activeMidis}
            onTriggerMidi={handleTriggerSingleMidi}
            onSelectRoot={setRootPc}
            onStrumHighlighted={handleStrumHighlighted}
          />
        </section>
      </main>

      {/* Neobrutalist Footer */}
      <footer className="border-t-2 border-border bg-secondary-background py-4 px-4 sm:px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span>
            TEORIA // VISUAL LAB • Built with Neobrutalism UI & Web Audio API
          </span>
          <span>
            Curriculum inspired by{" "}
            <a
              href="https://teoria.com/index.php"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              teoria.com
            </a>{" "}
            &{" "}
            <a
              href="https://www.neobrutalism.dev/docs/installation"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              neobrutalism.dev
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
