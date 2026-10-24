"use client";

import React from "react";
import { StaffNotation } from "@/components/StaffNotation";
import { Button } from "@/components/ui/button";
import { CHROMATIC_NOTES } from "@/lib/music-theory";
import { fifthsForTonic, keyByFifths, MAJOR_KEYS, spellMidi, staffPosition } from "@/lib/notation";

export function StaffLesson({
  activeMidis,
  soundColors,
  cursorMidi,
  onPickMidi,
}: {
  activeMidis: number[];
  soundColors?: Record<number, string>;
  cursorMidi: number;
  onPickMidi: (midi: number) => void;
}) {
  const midi = activeMidis[activeMidis.length - 1] ?? cursorMidi;
  const spelled = spellMidi(midi);
  const lineNote = staffPosition(midi, "treble") % 2 === 0;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-base border-2 border-border bg-white p-3">
        <p className="mb-2 text-sm">
          Five lines, four spaces. The middle line is the axis. Click a line or a space and the instrument lights the same pitch.
        </p>
        <StaffNotation
          interactive
          litMidis={activeMidis}
          soundColors={soundColors}
          cursorMidi={cursorMidi}
          notes={activeMidis.map((note) => ({ midi: note }))}
          onPickMidi={onPickMidi}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Info label="Note" value={spelled.name} />
        <Info label="Sits on" value={lineNote ? "A line" : "A space"} />
        <Info label="Middle line" value="B4" />
        <Info label="Count from B" value={countFromB(midi)} />
      </div>
    </div>
  );
}

function countFromB(midi: number): string {
  const steps = staffPosition(midi, "treble") - 4;
  if (steps === 0) return "On the axis";
  return `${Math.abs(steps)} letter${Math.abs(steps) === 1 ? "" : "s"} ${steps > 0 ? "above" : "below"}`;
}

export function GrandStaffLesson({
  activeMidis,
  soundColors,
  cursorMidi,
  onPickMidi,
}: {
  activeMidis: number[];
  soundColors?: Record<number, string>;
  cursorMidi: number;
  onPickMidi: (midi: number) => void;
}) {
  const midi = activeMidis[activeMidis.length - 1] ?? cursorMidi;
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Treble and bass are the same ladder, folded around middle C. Click either staff. The instrument keeps every note you add.
      </p>
      <StaffNotation
        clef="grand"
        interactive
        litMidis={activeMidis}
        soundColors={soundColors}
        cursorMidi={cursorMidi}
        notes={activeMidis.map((note) => ({ midi: note }))}
        onPickMidi={onPickMidi}
      />
      <div className="grid grid-cols-3 gap-2">
        <Info label="Sounding" value={spellMidi(midi).name} />
        <Info label="Clef" value={midi >= 60 ? "Treble" : "Bass"} />
        <Info label="Octave" value={String(spellMidi(midi).octave)} />
      </div>
    </div>
  );
}

const SPLITS = [
  { label: "Whole", divisions: 1 },
  { label: "Half", divisions: 2 },
  { label: "Quarter", divisions: 4 },
  { label: "Eighth", divisions: 8 },
];

export function RhythmLesson({ onPlay }: { onPlay: (midis: number[], arpeggiate?: boolean) => void }) {
  const [divisions, setDivisions] = React.useState(4);
  const play = (count: number) => {
    onPlay(Array.from({ length: count }, () => 60), true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">
        A bar is a rectangle. Cut it down the middle and you have halves. Cut again and you have quarters. Every longer value is two of the next shorter one.
      </p>
      <div className="grid grid-cols-4 gap-2">
        {SPLITS.map((split) => (
          <Button
            key={split.label}
            variant={divisions === split.divisions ? "default" : "neutral"}
            onClick={() => {
              setDivisions(split.divisions);
              play(split.divisions);
            }}
          >
            {split.label}
          </Button>
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${divisions}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: divisions }, (_, index) => (
          <div
            key={index}
            className={`flex h-16 items-end justify-center rounded-base border-2 border-border pb-1 text-xs font-heading ${
              index === 0 ? "bg-main" : "bg-white"
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

const METERS = [
  { id: "2/4", groups: [2] },
  { id: "3/4", groups: [3] },
  { id: "4/4", groups: [4] },
  { id: "6/8", groups: [3, 3] },
];

export function MeterLesson({ onPlay }: { onPlay: (midis: number[], arpeggiate?: boolean) => void }) {
  const [meter, setMeter] = React.useState(METERS[2]);
  const play = (groups: number[]) => {
    const beats = groups.flatMap((size) =>
      Array.from({ length: size }, (_, index) => (index === 0 ? 60 : 67))
    );
    onPlay(beats, true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">
        The top number is how many beats. The bottom number is which value counts as one beat. 6/8 is not six strong beats — it is two groups of three. The yellow cell is the strong beat.
      </p>
      <div className="grid grid-cols-4 gap-2">
        {METERS.map((item) => (
          <Button
            key={item.id}
            variant={meter.id === item.id ? "default" : "neutral"}
            onClick={() => {
              setMeter(item);
              play(item.groups);
            }}
          >
            {item.id}
          </Button>
        ))}
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${meter.groups.length}, minmax(0, 1fr))` }}
      >
        {meter.groups.map((size, groupIndex) => (
          <div
            key={groupIndex}
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: size }, (_, index) => (
              <div
                key={index}
                className={`h-14 rounded-base border-2 border-border ${index === 0 ? "bg-main" : "bg-white"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeySignatureLesson({
  onPlayNotes,
  onSelectRoot,
}: {
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onSelectRoot: (pc: number) => void;
}) {
  const [fifths, setFifths] = React.useState(0);
  const key = keyByFifths(fifths);

  return (
    <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
      <CircleOfFifths
        fifths={fifths}
        onPick={(next) => {
          setFifths(next);
          const picked = keyByFifths(next);
          onSelectRoot(picked.tonicPc);
          const scale = [0, 2, 4, 5, 7, 9, 11, 12].map((semi) => 60 + picked.tonicPc + semi);
          onPlayNotes(scale, true);
        }}
      />
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Info label="Major" value={key.major} />
          <Info label="Minor" value={key.minor} />
          <Info label="Accidentals" value={fifths === 0 ? "None" : `${Math.abs(fifths)} ${fifths > 0 ? "sharps" : "flats"}`} />
        </div>
        <StaffNotation clef="treble" fifths={fifths} notes={[{ midi: 60 + key.tonicPc, color: "#FACC00" }]} />
        <p className="text-sm">
          Turn the circle. Clockwise adds a sharp. Counterclockwise adds a flat. The last sharp sits a half step under the major home.
        </p>
      </div>
    </div>
  );
}

export function MinorLesson({
  onPlayNotes,
  onSelectRoot,
}: {
  onPlayNotes: (midis: number[], arpeggiate?: boolean) => void;
  onSelectRoot: (pc: number) => void;
}) {
  const [fifths, setFifths] = React.useState(0);
  const key = keyByFifths(fifths);
  const minorPc = (key.tonicPc + 9) % 12;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm">
          Relative major and minor share one signature. The minor home is three semitones under the major home — a minor third, the same flip as a minor triad.
        </p>
        <StaffNotation
          fifths={fifths}
          notes={[
            { midi: 60 + key.tonicPc, color: "#FACC00" },
            { midi: 60 + minorPc, color: "#7A83FF" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              onSelectRoot(key.tonicPc);
              onPlayNotes([0, 2, 4, 5, 7, 9, 11, 12].map((semi) => 60 + key.tonicPc + semi), true);
            }}
          >
            {key.major} major
          </Button>
          <Button
            variant="neutral"
            onClick={() => {
              onPlayNotes([0, 2, 3, 5, 7, 8, 10, 12].map((semi) => 60 + minorPc + semi), true);
            }}
          >
            {key.minor} minor
          </Button>
        </div>
      </div>
      <CircleOfFifths
        fifths={fifths}
        showMinor
        onPick={(next) => {
          setFifths(next);
          onSelectRoot(keyByFifths(next).tonicPc);
        }}
      />
    </div>
  );
}

export function InversionLesson({
  rootPc,
  onPlay,
}: {
  rootPc: number;
  onPlay: (midis: number[]) => void;
}) {
  const shapes = [
    { id: "Root", intervals: [0, 4, 7], bass: "1" },
    { id: "First", intervals: [4, 7, 12], bass: "3" },
    { id: "Second", intervals: [7, 12, 16], bass: "5" },
  ];
  const [index, setIndex] = React.useState(0);
  const shape = shapes[index];
  const midis = shape.intervals.map((semi) => 60 + rootPc + semi);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-2">
        <p className="text-sm">
          A triad is the same triangle in every inversion. Only the bass corner changes. Root keeps step 1 on the bottom. First puts step 3 there. Second puts step 5 there.
        </p>
        <StaffNotation fifths={fifthsForTonic(rootPc)} notes={midis.map((midi) => ({ midi }))} />
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((item, itemIndex) => (
            <Button
              key={item.id}
              variant={itemIndex === index ? "default" : "neutral"}
              onClick={() => {
                setIndex(itemIndex);
                onPlay(item.intervals.map((semi) => 60 + rootPc + semi));
              }}
            >
              {item.id}
            </Button>
          ))}
        </div>
      </div>
      <div className="rounded-base border-2 border-border bg-white p-3">
        <TriadClock rootPc={rootPc} intervals={shape.intervals} />
        <p className="mt-2 text-center text-sm font-heading">Bass is step {shape.bass}</p>
      </div>
    </div>
  );
}

function TriadClock({ rootPc, intervals }: { rootPc: number; intervals: number[] }) {
  const points = intervals.map((semi) => {
    const pc = (rootPc + semi) % 12;
    const angle = ((pc / 12) * Math.PI * 2) - Math.PI / 2;
    return { x: 80 + Math.cos(angle) * 58, y: 80 + Math.sin(angle) * 58, pc };
  });
  return (
    <svg viewBox="0 0 160 160" className="mx-auto w-full max-w-48">
      <circle cx={80} cy={80} r={58} fill="none" stroke="#000" strokeWidth={2} />
      {Array.from({ length: 12 }, (_, pc) => {
        const angle = ((pc / 12) * Math.PI * 2) - Math.PI / 2;
        const x = 80 + Math.cos(angle) * 58;
        const y = 80 + Math.sin(angle) * 58;
        return <circle key={pc} cx={x} cy={y} r={3} fill="#000" />;
      })}
      <polygon
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="#FACC00"
        stroke="#000"
        strokeWidth={2}
      />
      {points.map((point) => (
        <text key={point.pc} x={point.x} y={point.y - 8} textAnchor="middle" fontSize={11} fontWeight={700}>
          {CHROMATIC_NOTES[point.pc]}
        </text>
      ))}
    </svg>
  );
}

function CircleOfFifths({
  fifths,
  onPick,
  showMinor = false,
}: {
  fifths: number;
  onPick: (fifths: number) => void;
  showMinor?: boolean;
}) {
  const keys = MAJOR_KEYS.filter((item) => Math.abs(item.fifths) <= 6);
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-56">
      {keys.map((key, index) => {
        const angle = (index / keys.length) * Math.PI * 2 - Math.PI / 2;
        const x = 110 + Math.cos(angle) * 78;
        const y = 110 + Math.sin(angle) * 78;
        const selected = key.fifths === fifths;
        return (
          <g key={key.fifths} onClick={() => onPick(key.fifths)} className="cursor-pointer">
            <circle cx={x} cy={y} r={16} fill={selected ? "#FACC00" : "#fff"} stroke="#000" strokeWidth={2} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700}>
              {key.major}
            </text>
            {showMinor && (
              <text
                x={110 + Math.cos(angle) * 48}
                y={110 + Math.sin(angle) * 48 + 3}
                textAnchor="middle"
                fontSize={9}
              >
                {key.minor}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-base border-2 border-border bg-white px-2 py-2">
      <div className="text-[10px] font-heading uppercase tracking-wide text-foreground/55">{label}</div>
      <div className="font-heading text-lg leading-tight">{value}</div>
    </div>
  );
}
