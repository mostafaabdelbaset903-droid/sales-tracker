"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundName =
  | "hover"
  | "click"
  | "expand"
  | "collapse"
  | "theme"
  | "achievement";

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) {
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

/**
 * Plays a single soft synth tone.
 * - freq: pitch in Hz
 * - duration: seconds
 * - type: oscillator waveform — 'sine'/'triangle' read as soft, rounded tones
 * - gain: peak volume (0–1), kept low across the app for a "soft" feel
 * - delay: seconds before this tone starts (for tiny arpeggios)
 */
function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.06,
  delay = 0
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  const startAt = ctx.currentTime + delay;
  const endAt = startAt + duration;

  // Soft attack, smooth release — avoids any clicky/harsh edge.
  env.gain.setValueAtTime(0, startAt);
  env.gain.linearRampToValueAtTime(gain, startAt + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, endAt);

  osc.connect(env);
  env.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(endAt + 0.02);
}

function fireSound(name: SoundName) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Browsers suspend AudioContext until a user gesture; resume defensively.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  switch (name) {
    case "hover":
      playTone(ctx, 1180, 0.05, "sine", 0.025);
      break;

    case "click":
      playTone(ctx, 740, 0.09, "sine", 0.05);
      break;

    case "expand":
      playTone(ctx, 660, 0.08, "triangle", 0.045);
      playTone(ctx, 880, 0.1, "triangle", 0.04, 0.05);
      break;

    case "collapse":
      playTone(ctx, 740, 0.08, "triangle", 0.04);
      playTone(ctx, 560, 0.1, "triangle", 0.035, 0.05);
      break;

    case "theme":
      playTone(ctx, 520, 0.09, "sine", 0.045);
      playTone(ctx, 780, 0.12, "sine", 0.04, 0.06);
      break;

    case "achievement":
      // Short rising arpeggio — celebratory but still soft, never harsh.
      playTone(ctx, 523.25, 0.16, "sine", 0.06, 0);
      playTone(ctx, 659.25, 0.16, "sine", 0.06, 0.09);
      playTone(ctx, 783.99, 0.22, "sine", 0.065, 0.18);
      playTone(ctx, 1046.5, 0.28, "triangle", 0.05, 0.27);
      break;
  }
}

const MUTE_STORAGE_KEY = "sales-tracker-sound-muted";

/**
 * App-wide sound hook. Exposes:
 * - play(name): fire a sound effect (no-ops if muted or unsupported)
 * - muted / toggleMuted: shared mute state, persisted to localStorage
 *   for convenience across visits (not used for any business data).
 */
export function useSound() {
  const [muted, setMuted] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const stored = window.localStorage.getItem(MUTE_STORAGE_KEY);
      if (stored === "true") setMuted(true);
    } catch {
      // localStorage unavailable — default to unmuted, no crash.
    }
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // ignore persistence failures
      }
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      fireSound(name);
    },
    [muted]
  );

  return { play, muted, toggleMuted };
}
