"use client";

import { midiToFreq } from "./music-theory";

export type SynthWaveform = "triangle" | "sine" | "sawtooth" | "square";
export type AudioPhase = "unready" | AudioContextState;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waveform: SynthWaveform = "triangle";
  private muted = false;
  private volume = 0.7;
  private listeners = new Set<() => void>();

  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  public getState(): AudioPhase {
    return this.ctx?.state ?? "unready";
  }

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
      this.ctx.addEventListener("statechange", () => this.emit());
      this.emit();
    }
    return this.ctx;
  }

  /**
   * Browsers, especially iPadOS, stay silent until audio is started inside a tap.
   * Call this from a pointer or key handler. It is synchronous on purpose.
   */
  public unlock(): void {
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try {
        nav.audioSession.type = "playback";
      } catch {
        // Older browsers have no audio session.
      }
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (ctx.state !== "running") {
      void ctx.resume().then(() => this.emit());
    }
    try {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.masterGain);
      src.start(0);
    } catch {
      // The next note still tries to start the context.
    }
  }

  public setWaveform(wave: SynthWaveform) {
    this.waveform = wave;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      const value = this.muted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(value, this.ctx.currentTime);
      this.masterGain.gain.value = value;
    }
    this.emit();
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
    this.unlock();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const start = () => {
      try {
        this.soundNote(ctx, midi, duration, delay, customWave);
      } catch {
        this.soundNoteSimple(ctx, midi, duration, delay);
      }
    };

    if (ctx.state === "running") {
      start();
      return;
    }
    void ctx.resume().then(() => {
      if (!this.muted) start();
      this.emit();
    });
  }

  private soundNote(
    ctx: AudioContext,
    midi: number,
    duration: number,
    delay: number,
    customWave?: SynthWaveform
  ) {
    if (!this.masterGain) return;
    const now = ctx.currentTime + delay + 0.02;
    const freq = Math.max(40, midiToFreq(midi));
    const wave = customWave ?? this.waveform;

    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(freq * 2, now);
    overtoneGain.gain.setValueAtTime(0.08, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(freq * 6, 5000), now);

    const attack = now + 0.015;
    const body = now + Math.max(duration * 0.4, 0.06);
    const release = now + duration + 0.06;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.9, attack);
    env.gain.exponentialRampToValueAtTime(0.35, body);
    env.gain.exponentialRampToValueAtTime(0.0001, release);

    osc.connect(filter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    overtone.start(now);
    osc.stop(release + 0.02);
    overtone.stop(release + 0.02);
  }

  private soundNoteSimple(
    ctx: AudioContext,
    midi: number,
    duration: number,
    delay: number
  ) {
    if (!this.masterGain) return;
    const now = ctx.currentTime + delay + 0.02;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = midiToFreq(midi);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.8, now + 0.02);
    env.gain.linearRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
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

  public playScaleSequence(midis: number[], stepDuration = 0.22) {
    midis.forEach((midi, idx) => {
      this.playMidi(midi, stepDuration * 1.15, idx * stepDuration);
    });
  }

  public playPercussion(type: "ringA" | "ringB" | "accent") {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const hit = () => {
      if (!this.masterGain) return;
      const now = ctx.currentTime + 0.02;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      if (type === "accent") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.09);
      } else if (type === "ringA") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.07);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.08);
      }
      env.gain.setValueAtTime(0.7, now);
      env.gain.linearRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    };

    if (ctx.state === "running") hit();
    else void ctx.resume().then(hit);
  }
}

export const soundEngine = new SoundEngine();
