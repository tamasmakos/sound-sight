"use client";

import { midiToFreq } from "./music-theory";

export type SynthWaveform = "triangle" | "sine" | "sawtooth" | "square";
export type AudioPhase = "unready" | AudioContextState;

/**
 * Browsers block sound until a real gesture. MDN and Chrome both say to
 * create or resume the AudioContext inside click, keydown, or touchend.
 * pointerdown is not one of those, and preventDefault() on it cancels the
 * click that would have unlocked audio.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
 * https://developer.chrome.com/blog/autoplay/#web_audio
 * https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private waveform: SynthWaveform = "triangle";
  private muted = false;
  private volume = 0.85;
  private bound = false;
  private listeners = new Set<() => void>();
  private toneUrls = new Map<string, string>();

  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    // Defer so a click that both starts the context and handles the button
    // still sees the label from before this gesture. Otherwise the first
    // "Start sound" click mutes itself.
    queueMicrotask(() => {
      this.listeners.forEach((listener) => listener());
    });
  }

  public getState(): AudioPhase {
    return this.ctx?.state ?? "unready";
  }

  public bind() {
    if (this.bound || typeof document === "undefined") return;
    this.bound = true;
    const unlock = () => this.unlock();
    document.addEventListener("click", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("touchend", unlock, true);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      this.recover();
    });
  }

  /**
   * Synchronous on purpose. resume() has to run in the same turn as the
   * click, before any await, or Safari drops the gesture and stays silent.
   */
  public unlock(): void {
    if (typeof window === "undefined") return;
    this.bind();
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try {
        nav.audioSession.type = "playback";
      } catch {
        // Older browsers have no audio session.
      }
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state !== "running") void ctx.resume().then(() => this.emit());
    this.kick(ctx);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx && this.ctx.state !== "closed") return this.ctx;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      this.ctx = new AudioCtx({ latencyHint: "interactive" });
    } catch {
      return null;
    }
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);
    this.ctx.addEventListener("statechange", () => this.emit());
    this.emit();
    return this.ctx;
  }

  /** A one-sample buffer started in the gesture is what older iOS needs. */
  private kick(ctx: AudioContext) {
    try {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // The note itself is the next attempt.
    }
  }

  /**
   * WebKit can report "running" while the clock is stuck, or sit in
   * "interrupted" after the tab was backgrounded. Suspend, then resume.
   */
  private recover() {
    const ctx = this.ctx;
    if (!ctx || ctx.state === "closed") return;
    if (ctx.state === "suspended" || ctx.state === "interrupted") {
      void ctx.resume().then(() => this.emit());
      return;
    }
    const started = ctx.currentTime;
    window.setTimeout(() => {
      if (!this.ctx || document.hidden || this.ctx.state !== "running") return;
      if (this.ctx.currentTime !== started) return;
      void this.ctx.suspend().then(() => {
        window.setTimeout(() => {
          void this.ctx?.resume().then(() => this.emit());
        }, 80);
      });
    }, 200);
  }

  public setWaveform(wave: SynthWaveform) {
    this.waveform = wave;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
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
    if (!ctx || !this.masterGain) {
      if (delay === 0) this.playElement(midi, duration);
      return;
    }
    if (ctx.state !== "running") void ctx.resume();
    if (ctx.state === "running") {
      this.soundNote(ctx, midi, duration, delay, customWave);
      return;
    }
    const heard = delay === 0 && this.playElement(midi, duration);
    void ctx.resume().then(() => {
      this.emit();
      if (heard || this.muted || !this.ctx || this.ctx.state !== "running" || !this.masterGain) return;
      this.soundNote(this.ctx, midi, duration, delay, customWave);
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
    scheduleTone(ctx, this.masterGain, midiToFreq(midi), duration, delay, customWave ?? this.waveform);
  }

  /** Used when the context is still suspended, so this click can still be heard. */
  private playElement(midi: number, duration: number): boolean {
    if (typeof Audio === "undefined") return false;
    try {
      const audio = new Audio(this.toneUrl(midi, Math.min(Math.max(duration, 0.2), 1.2)));
      audio.volume = 0.9;
      void audio.play().catch(() => this.emit());
      return true;
    } catch {
      return false;
    }
  }

  private toneUrl(midi: number, duration: number): string {
    const key = `${midi}:${duration.toFixed(2)}`;
    const cached = this.toneUrls.get(key);
    if (cached) return cached;
    const sampleRate = 22050;
    const length = Math.floor(sampleRate * duration);
    const samples = new Int16Array(length);
    const freq = midiToFreq(midi);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const attack = Math.min(1, i / (sampleRate * 0.015));
      const release = Math.max(0, 1 - t / duration);
      const sample = Math.sin(2 * Math.PI * freq * t) * attack * release;
      samples[i] = Math.max(-1, Math.min(1, sample * 0.8)) * 0x7fff;
    }
    const url = URL.createObjectURL(new Blob([encodeWav(samples, sampleRate)], { type: "audio/wav" }));
    this.toneUrls.set(key, url);
    return url;
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
    const midi = type === "accent" ? 76 : type === "ringA" ? 72 : 64;
    this.playMidi(midi, 0.18, 0, "triangle");
  }
}

/** Linear ramps only. Exponential ramps throw when a value hits zero and abort the note. */
export function scheduleTone(
  ctx: BaseAudioContext,
  output: AudioNode,
  frequency: number,
  duration: number,
  delay: number,
  wave: OscillatorType = "triangle"
) {
  const start = ctx.currentTime + Math.max(0, delay);
  const freq = Math.max(40, frequency);
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const overtoneGain = ctx.createGain();
  const env = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(freq * 2, start);
  overtoneGain.gain.setValueAtTime(0.18, start);

  const release = start + Math.max(duration, 0.12);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(0.9, start + 0.02);
  env.gain.linearRampToValueAtTime(0.0001, release);

  osc.connect(env);
  overtone.connect(overtoneGain);
  overtoneGain.connect(env);
  env.connect(output);

  osc.start(start);
  overtone.start(start);
  osc.stop(release + 0.03);
  overtone.stop(release + 0.03);
}

export async function renderedTonePeak(): Promise<number> {
  const ctx = new OfflineAudioContext(1, 44100, 44100);
  const gain = ctx.createGain();
  gain.gain.value = 0.85;
  gain.connect(ctx.destination);
  scheduleTone(ctx, gain, 261.63, 0.45, 0);
  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  return peak;
}

function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) view.setInt16(44 + i * 2, samples[i], true);
  return buffer;
}

export const soundEngine = new SoundEngine();
