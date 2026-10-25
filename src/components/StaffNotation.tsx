"use client";

import React from "react";
import { isNeutralColor, noteColor, noteOutline, playedColor } from "@/lib/note-colors";
import { midiFromPosition, spellMidi, staffPosition, vexKeySpec } from "@/lib/notation";

interface StaffNote {
  midi: number;
  color?: string;
}

interface StaffNotationProps {
  clef?: "treble" | "bass" | "grand";
  notes?: StaffNote[];
  /** Sounding pitches. Notes without their own color use this, then a palette color. */
  litMidis?: number[];
  /** Color of each sounding pitch, shared with the instrument. */
  soundColors?: Record<number, string>;
  fifths?: number;
  /** Stack the notes into one chord instead of a left-to-right line. */
  chord?: boolean;
  /** Draw only as wide as the clef, the signature, and the sounding notes. */
  compact?: boolean;
  interactive?: boolean;
  onPickMidi?: (midi: number) => void;
}

interface DrawnNote {
  midi: number;
  color: string;
}

interface StaveMetric {
  clef: "treble" | "bass";
  top: number;
  space: number;
}

function paintNotes(
  notes: StaffNote[],
  litMidis: number[] | undefined,
  soundColors: Record<number, string> | undefined
): DrawnNote[] {
  const lit = new Set(litMidis ?? []);
  return [...notes]
    .sort((a, b) => a.midi - b.midi)
    .map((note, index) => {
      const fromSound = soundColors?.[note.midi];
      const explicit = note.color;
      const chosen =
        fromSound && !isNeutralColor(fromSound)
          ? fromSound
          : explicit && !isNeutralColor(explicit)
            ? explicit
            : lit.has(note.midi)
              ? playedColor(undefined, index)
              : noteColor(index);
      return { midi: note.midi, color: chosen };
    });
}

function vexPitch(midi: number, fifths: number): string {
  const spelled = spellMidi(midi, fifths);
  const letter = "cdefgab"[spelled.letter];
  const accidental =
    spelled.accidental === 1 ? "#" : spelled.accidental === -1 ? "b" : "";
  return `${letter}${accidental}/${spelled.octave}`;
}

function staffPadding(clef: "treble" | "bass", notes: DrawnNote[], fifths: number, compact: boolean) {
  const positions = notes.map((note) => staffPosition(note.midi, clef, fifths));
  const highest = Math.max(8, ...positions);
  const lowest = Math.min(0, ...positions);
  return {
    above: Math.max(compact ? 10 : 18, (highest - 8) * 5 + (compact ? 8 : 16)),
    below: Math.max(compact ? 14 : 28, -lowest * 5 + (compact ? 12 : 22)),
  };
}

function scoreWidth(available: number, fifths: number, slots: number, compact: boolean) {
  const needed = 118 + Math.abs(fifths) * 16 + Math.max(slots, 1) * (compact ? 28 : 46);
  if (compact) return needed;
  return Math.max(available, needed);
}

export function StaffNotation({
  clef = "treble",
  notes = [],
  litMidis,
  soundColors,
  fifths = 0,
  chord = false,
  compact = false,
  interactive = false,
  onPickMidi,
}: StaffNotationProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const metricsRef = React.useRef<StaveMetric[]>([]);
  const drawn = paintNotes(notes, litMidis, soundColors);
  const drawnRef = React.useRef(drawn);
  const drawnKey = drawn.map((note) => `${note.midi}:${note.color}`).join("|");

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
        chord,
        compact,
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
  }, [clef, fifths, drawnKey, chord, compact]);

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
      className={`flex w-full justify-center bg-white ${
        compact ? "overflow-x-auto" : "min-h-24 overflow-x-auto"
      } ${interactive ? "cursor-pointer" : ""}`}
      role="img"
      aria-label={
        chord
          ? "Staff showing the sounding chord"
          : clef === "grand"
            ? "Grand staff"
            : clef === "bass"
              ? "Bass staff"
              : "Treble staff"
      }
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
  score: {
    clef: "treble" | "bass" | "grand";
    fifths: number;
    notes: DrawnNote[];
    chord: boolean;
    compact: boolean;
  }
): StaveMetric[] {
  const { Renderer, StaveConnector } = vf;
  host.replaceChildren();
  const key = vexKeySpec(score.fifths);
  const available = score.compact
    ? Math.max(160, host.clientWidth || 220)
    : Math.max(280, host.clientWidth || 480);

  if (score.clef === "grand") {
    const trebleNotes = score.notes.filter((note) => note.midi >= 60);
    const bassNotes = score.notes.filter((note) => note.midi < 60);
    const slots = score.chord ? 1 : Math.max(trebleNotes.length, bassNotes.length, 1);
    const width = scoreWidth(available, score.fifths, slots, score.compact);
    const treblePad = staffPadding("treble", trebleNotes, score.fifths, score.compact);
    const bassPad = staffPadding("bass", bassNotes, score.fifths, score.compact);
    const gap = score.compact ? 58 : 90;
    const trebleY = treblePad.above;
    const bassY = trebleY + gap + bassPad.above;
    const height = bassY + (score.compact ? 58 : 70) + bassPad.below;
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const treble = drawStave(vf, context, {
      x: 8,
      y: trebleY,
      width: width - 16,
      clef: "treble",
      fifths: score.fifths,
      key,
      notes: trebleNotes,
      chord: score.chord,
      compact: score.compact,
    });
    const bass = drawStave(vf, context, {
      x: 8,
      y: bassY,
      width: width - 16,
      clef: "bass",
      fifths: score.fifths,
      key,
      notes: bassNotes,
      chord: score.chord,
      compact: score.compact,
    });
    new StaveConnector(treble.stave, bass.stave).setType("brace").setContext(context).draw();
    fitSvg(host);
    return [treble.metric, bass.metric];
  }

  const slots = score.chord ? 1 : Math.max(score.notes.length, 1);
  const width = scoreWidth(available, score.fifths, slots, score.compact);
  const pad = staffPadding(score.clef, score.notes, score.fifths, score.compact);
  const height = pad.above + (score.compact ? 58 : 72) + pad.below;
  const renderer = new Renderer(host, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  const drawn = drawStave(vf, context, {
    x: 8,
    y: pad.above,
    width: width - 16,
    clef: score.clef,
    fifths: score.fifths,
    key,
    notes: score.notes,
    chord: score.chord,
    compact: score.compact,
  });
  fitSvg(host);
  return [drawn.metric];
}

/**
 * Music-font glyphs report a huge em box. Measure the staff lines, stems, and
 * the baselines of the glyphs so the canvas hugs the music.
 */
function fitSvg(host: HTMLDivElement) {
  const svg = host.querySelector("svg");
  if (!svg) return;
  let minY = Infinity;
  let maxY = -Infinity;
  svg.querySelectorAll("path, rect, text").forEach((node) => {
    if (node.getAttribute("opacity") === "0") return;
    if (node instanceof SVGTextElement) {
      const y = Number(node.getAttribute("y") ?? 0);
      const above = node.closest(".vf-clef") ? 40 : 9;
      const below = node.closest(".vf-clef") ? 16 : 9;
      minY = Math.min(minY, y - above);
      maxY = Math.max(maxY, y + below);
      return;
    }
    const box = (node as SVGGraphicsElement).getBBox();
    minY = Math.min(minY, box.y);
    maxY = Math.max(maxY, box.y + box.height);
  });
  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return;
  const pad = 6;
  const width = Number(svg.getAttribute("width"));
  const top = minY - pad;
  const height = Math.ceil(maxY - minY + pad * 2);
  svg.setAttribute("viewBox", `0 ${top} ${width} ${maxY - minY + pad * 2}`);
  svg.setAttribute("height", String(height));
  svg.style.height = `${height}px`;
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
    chord: boolean;
    compact: boolean;
  }
) {
  const { Stave, StaveNote, Voice, VoiceMode, Formatter, Accidental } = vf;
  const stave = new Stave(options.x, options.y, options.width);
  stave.addClef(options.clef).addKeySignature(options.key);
  stave.setContext(context).draw();

  if (options.notes.length > 0) {
    const tickables = makeTickables(StaveNote, options.notes, options.clef, options.fifths, options.chord);
    const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(VoiceMode.SOFT);
    voice.addTickables(tickables);
    Accidental.applyAccidentals([voice], options.key);
    const room = Math.max(40, stave.getNoteEndX() - stave.getNoteStartX() - 12);
    const justify = options.chord
      ? Math.min(room, options.compact ? 52 : 72)
      : Math.min(room, Math.max(72, options.notes.length * (options.compact ? 36 : 54)));
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

function makeTickables(
  StaveNote: typeof import("vexflow").StaveNote,
  notes: DrawnNote[],
  clef: "treble" | "bass",
  fifths: number,
  chord: boolean
) {
  const styleFor = (color: string) => ({
    fillStyle: color,
    strokeStyle: noteOutline(color),
  });
  if (chord) {
    const head = new StaveNote({
      keys: notes.map((note) => vexPitch(note.midi, fifths)),
      duration: "q",
      clef,
    });
    notes.forEach((note, index) => head.setKeyStyle(index, styleFor(note.color)));
    return [head];
  }
  return notes.map((note) => {
    const head = new StaveNote({
      keys: [vexPitch(note.midi, fifths)],
      duration: "q",
      clef,
    });
    head.setKeyStyle(0, styleFor(note.color));
    return head;
  });
}
