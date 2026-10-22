# TEORIA // VISUAL LAB — Neobrutalist Music Theory Playground

An interactive music theory visual laboratory inspired by [Teoria.com](https://teoria.com/index.php) and built with the [Neobrutalism UI component library](https://www.neobrutalism.dev/docs/installation), Next.js, TypeScript, Tailwind CSS, and a real-time polyphonic Web Audio synthesizer.

## Visual Modules

1. **12-Tone Polygon & Circle of Fifths Clock (`HarmonicGeometryLab`)**
   - Visualizes chords and scales as geometric polygons inscribed inside a 12-node pitch clock.
   - Toggle seamlessly between **Chromatic (+1 semitone)** and **Circle of Fifths (+7 semitones)** geometry to see why diatonic scales form contiguous crescents and why Major (`4+3`) and Minor (`3+4`) triads are mirror triangles.
2. **Interval Wave Interference & Lissajous Lab (`IntervalWaveLab`)**
   - Real-time dual-frequency wave superposition oscilloscope and Lissajous knot generator showing why simple integer ratios (`3:2` Perfect Fifth, `5:4` Major Third) produce acoustic consonance while complex ratios (`16:15` Minor Second, `45:32` Tritone) create rapid wave beating.
3. **Modal Brightness Spectrum & Step Ruler (`ScaleModeLab`)**
   - Orders the 7 diatonic modes from brightest (**Lydian +3**) to darkest (**Locrian -3**), highlighting each mode's single "Spice Note" alongside a 12-semitone physical ruler.
4. **Voice-Leading River & Functional Gravity Sequencer (`ChordFlowLab`)**
   - Interactive 4-bar chord progression builder with a smooth voice-leading streamline graph showing common tones and minimal semitone glides across Tonic, Subdominant, and Dominant gravity zones.
5. **Euclidean & Polyrhythm Orbit Radar (`PolyrhythmOrbitLab`)**
   - Concentric spinning polygon sequencer (`3:2`, `4:3`, `5:4`, `3:8`) with a Least-Common-Multiple unrolled subdivision grid and synthesized percussion.
6. **Teoria-Inspired Aural & Geometric Ear Gym (`TeoriaEarGym`)**
   - Interactive ear-training drills for intervals, chord qualities, and modes with instant visual and acoustic feedback.

## Running Locally

```bash
pnpm install
pnpm dev --port 4321
```

Then open `http://localhost:4321` in your browser.
