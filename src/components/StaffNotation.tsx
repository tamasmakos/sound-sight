"use client";

import React from "react";
import { midiFromPosition, spellMidi, staffPosition, vexKeySpec } from "@/lib/notation";

interface StaffNote {
  midi: number;
  color?: string;
  open?: boolean;
}

interface StaffNotationProps {
  clef?: "treble" | "bass" | "grand";
  notes?: StaffNote[];
  /** Sounding pitches. Notes without their own color use this, then yellow. */
  litMidis?: number[];
  /** Color of each sounding pitch, shared with the instrument. */
  soundColors?: Record<number, string>;
  /** The note the arrows are editing. It is drawn hollow until it is on the staff. */
  cursorMidi?: number;
  fifths?: number;
  interactive?: boolean;
  onPickMidi?: (midi: number) => void;
}

interface DrawnNote {
  midi: number;
  color: string;
  open: boolean;
  selected: boolean;
}

interface StaveMetric {
  clef: "treble" | "bass";
  top: number;
  space: number;
}

function withCursor(
  notes: StaffNote[],
  cursorMidi: number | undefined,
  litMidis: number[] | undefined,
  soundColors: Record<number, string> | undefined
): DrawnNote[] {
  const lit = new Set(litMidis ?? []);
  const drawn: DrawnNote[] = notes.map((note) => ({
    midi: note.midi,
    open: false,
    selected: cursorMidi === note.midi,
    color:
      soundColors?.[note.midi] ??
      note.color ??
      (lit.has(note.midi) ? "#FACC00" : "#111111"),
  }));
  if (cursorMidi !== undefined && !drawn.some((note) => note.midi === cursorMidi)) {
    drawn.push({
      midi: cursorMidi,
      color: "#ffffff",
      open: true,
      selected: true,
    });
  }
  return drawn.sort((a, b) => a.midi - b.midi);
}

function vexPitch(midi: number, fifths: number): string {
  const spelled = spellMidi(midi, fifths);
  const letter = "cdefgab"[spelled.letter];
  const accidental =
    spelled.accidental === 1 ? "#" : spelled.accidental === -1 ? "b" : "";
  return `${letter}${accidental}/${spelled.octave}`;
}

function staffPadding(clef: "treble" | "bass", notes: DrawnNote[], fifths: number) {
  const positions = notes.map((note) => staffPosition(note.midi, clef, fifths));
  const highest = Math.max(8, ...positions);
  const lowest = Math.min(0, ...positions);
  return {
    above: Math.max(18, (highest - 8) * 6 + 16),
    below: Math.max(28, -lowest * 6 + 22),
  };
}

export function StaffNotation({
  clef = "treble",
  notes = [],
  litMidis,
  soundColors,
  cursorMidi,
  fifths = 0,
  interactive = false,
  onPickMidi,
}: StaffNotationProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const metricsRef = React.useRef<StaveMetric[]>([]);
  const drawn = withCursor(notes, cursorMidi, litMidis, soundColors);
  const drawnRef = React.useRef(drawn);
  const drawnKey = drawn.map((note) => `${note.midi}:${note.color}:${note.open}:${note.selected}`).join("|");

  React.useEffect(() => {
    drawnRef.current = drawn;
  });

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    const paint = async () => {
      const vf = await import("vexflow");
      await vf.VexFlow.loadFonts("Bravura", "Academico");
      if (cancelled || !hostRef.current) return;
      const metrics = drawScore(vf, hostRef.current, {
        clef,
        fifths,
        notes: drawnRef.current,
      });
      metricsRef.current = metrics;
    };

    paint().catch(() => {
      metricsRef.current = [];
    });

    const observer = new ResizeObserver(() => {
      paint().catch(() => {
        metricsRef.current = [];
      });
    });
    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [clef, fifths, drawnKey]);

  const pick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onPickMidi) return;
    const svg = hostRef.current?.querySelector("svg");
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const stave = nearestStave(metricsRef.current, local.y);
    if (!stave) return;
    const line = (local.y - stave.top) / stave.space;
    const position = Math.round(8 - line * 2);
    const clamped = Math.max(-6, Math.min(16, position));
    onPickMidi(midiFromPosition(clamped, stave.clef));
  };

  return (
    <div
      ref={hostRef}
      onClick={pick}
      className={`min-h-24 w-full overflow-x-auto bg-white ${interactive ? "cursor-pointer" : ""}`}
      role="img"
      aria-label={clef === "grand" ? "Grand staff" : clef === "bass" ? "Bass staff" : "Treble staff"}
    />
  );
}

function nearestStave(staves: StaveMetric[], y: number): StaveMetric | null {
  if (staves.length === 0) return null;
  return staves.reduce((best, stave) => {
    const bestDistance = Math.abs(y - (best.top + best.space * 2));
    const distance = Math.abs(y - (stave.top + stave.space * 2));
    return distance < bestDistance ? stave : best;
  });
}

function drawScore(
  vf: typeof import("vexflow"),
  host: HTMLDivElement,
  score: { clef: "treble" | "bass" | "grand"; fifths: number; notes: DrawnNote[] }
): StaveMetric[] {
  const { Renderer, StaveConnector } = vf;
  host.replaceChildren();
  const key = vexKeySpec(score.fifths);
  const available = Math.max(280, host.clientWidth || 480);
  const signatureRoom = Math.abs(score.fifths) * 16;

  if (score.clef === "grand") {
    const trebleNotes = score.notes.filter((note) => note.midi >= 60);
    const bassNotes = score.notes.filter((note) => note.midi < 60);
    const width = Math.max(
      available,
      180 + signatureRoom + Math.max(trebleNotes.length, bassNotes.length, 1) * 46
    );
    const treblePad = staffPadding("treble", trebleNotes, score.fifths);
    const bassPad = staffPadding("bass", bassNotes, score.fifths);
    const trebleY = treblePad.above;
    const bassY = trebleY + 90 + bassPad.above;
    const height = bassY + 70 + bassPad.below;
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const treble = drawStave(vf, context, {
      x: 10,
      y: trebleY,
      width: width - 20,
      clef: "treble",
      fifths: score.fifths,
      key,
      notes: trebleNotes,
    });
    const bass = drawStave(vf, context, {
      x: 10,
      y: bassY,
      width: width - 20,
      clef: "bass",
      fifths: score.fifths,
      key,
      notes: bassNotes,
    });
    new StaveConnector(treble.stave, bass.stave).setType("brace").setContext(context).draw();
    return [treble.metric, bass.metric];
  }

  const width = Math.max(available, 170 + signatureRoom + Math.max(score.notes.length, 1) * 46);
  const pad = staffPadding(score.clef, score.notes, score.fifths);
  const height = pad.above + 72 + pad.below;
  const renderer = new Renderer(host, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  const drawn = drawStave(vf, context, {
    x: 10,
    y: pad.above,
    width: width - 20,
    clef: score.clef,
    fifths: score.fifths,
    key,
    notes: score.notes,
  });
  return [drawn.metric];
}

function drawStave(
  vf: typeof import("vexflow"),
  context: ReturnType<InstanceType<typeof import("vexflow").Renderer>["getContext"]>,
  options: {
    x: number;
    y: number;
    width: number;
    clef: "treble" | "bass";
    fifths: number;
    key: string;
    notes: DrawnNote[];
  }
) {
  const { Stave, StaveNote, Voice, VoiceMode, Formatter, Accidental } = vf;
  const stave = new Stave(options.x, options.y, options.width);
  stave.addClef(options.clef).addKeySignature(options.key);
  stave.setContext(context).draw();

  if (options.notes.length > 0) {
    const tickables = options.notes.map((note) => {
      const head = new StaveNote({
        keys: [vexPitch(note.midi, options.fifths)],
        duration: "q",
        clef: options.clef,
      });
      head.setKeyStyle(0, {
        fillStyle: note.open ? "#ffffff" : note.color,
        strokeStyle: "#111111",
        lineWidth: note.selected ? 2.4 : 1.1,
      });
      return head;
    });
    const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(VoiceMode.SOFT);
    voice.addTickables(tickables);
    Accidental.applyAccidentals([voice], options.key);
    const room = Math.max(48, stave.getNoteEndX() - stave.getNoteStartX() - 16);
    const justify = Math.min(room, Math.max(72, options.notes.length * 54));
    new Formatter().joinVoices([voice]).format([voice], justify);
    voice.draw(context, stave);
  }

  return {
    stave,
    metric: {
      clef: options.clef,
      top: stave.getYForLine(0),
      space: stave.getSpacingBetweenLines(),
    },
  };
}
