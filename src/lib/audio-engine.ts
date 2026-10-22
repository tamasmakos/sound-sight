"use client";

import { midiToFreq } from "./music-theory";

export type SynthWaveform = "triangle" | "sine" | "sawtooth" | "square";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waveform: SynthWaveform = "triangle";
  private muted: boolean = false;
  private volume: number = 0.65;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setWaveform(wave: SynthWaveform) {
    this.waveform = wave;
  }

  public getWaveform(): SynthWaveform {
    return this.waveform;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime
      );
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playMidi(
    midi: number,
    duration = 0.55,
    delay = 0,
    customWave?: SynthWaveform
  ) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime + delay;
    const freq = midiToFreq(midi);

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    const wave = customWave ?? this.waveform;
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);

    // Warm harmonic layer
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(freq * 2, now);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(freq * 5.5, 4800), now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(freq * 1.8, 400),
      now + duration
    );

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.32, now + 0.018);
    env.gain.exponentialRampToValueAtTime(0.14, now + duration * 0.45);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.08);

    osc.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + duration + 0.1);
    subOsc.stop(now + duration + 0.1);
  }

  public playChord(
    midis: number[],
    duration = 0.85,
    strumDelay = 0.035,
    customWave?: SynthWaveform
  ) {
    midis.forEach((midi, idx) => {
      this.playMidi(midi, duration, idx * strumDelay, customWave);
    });
  }

  public playScaleSequence(
    midis: number[],
    stepDuration = 0.22,
    onStep?: (midi: number, index: number) => void
  ) {
    midis.forEach((midi, idx) => {
      this.playMidi(midi, stepDuration * 1.15, idx * stepDuration);
      if (onStep) {
        setTimeout(() => onStep(midi, idx), idx * stepDuration * 1000);
      }
    });
  }

  // Synthesized percussion click/drum for the Polyrhythm Orbit lab
  public playPercussion(type: "ringA" | "ringB" | "accent") {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    if (type === "accent") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
      env.gain.setValueAtTime(0.45, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    } else if (type === "ringA") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5 woodblock
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
      env.gain.setValueAtTime(0.36, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(329.63, now); // E4 rimshot
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      env.gain.setValueAtTime(0.36, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const soundEngine = new SoundEngine();
