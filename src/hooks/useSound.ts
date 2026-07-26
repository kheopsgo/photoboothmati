import { useCallback, useRef } from "react";

export interface SoundOptions {
  enabled?: boolean;
  volume?: number;
}

export function useSound(options: SoundOptions = {}) {
  const { enabled = true, volume = 0.4 } = options;
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "sine", vol = volume) => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not supported
    }
  }, [enabled, volume, getCtx]);

  const playTick = useCallback(() => {
    playTone(880, 0.12, "sine", volume * 0.7);
  }, [playTone, volume]);

  const playReadyBeep = useCallback(() => {
    // Two quick ascending notes: "ready!"
    playTone(1109, 0.08, "sine", volume * 0.8);
    setTimeout(() => playTone(1479, 0.18, "sine", volume * 0.9), 90);
  }, [playTone, volume]);

  const playShutter = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Audio not supported
    }
  }, [enabled, volume, getCtx]);

  const playSuccess = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        const start = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(volume * 0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {
      // Audio not supported
    }
  }, [enabled, volume, getCtx]);

  const playStart = useCallback(() => {
    // Friendly ascending arpeggio
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [392, 523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "triangle";
        const start = ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(volume * 0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Audio not supported
    }
  }, [enabled, volume, getCtx]);

  const playError = useCallback(() => {
    // Low descending tone
    playTone(200, 0.25, "sawtooth", volume * 0.5);
    setTimeout(() => playTone(150, 0.35, "sawtooth", volume * 0.5), 200);
  }, [playTone, volume]);

  return { playTick, playReadyBeep, playShutter, playSuccess, playStart, playError };
}
