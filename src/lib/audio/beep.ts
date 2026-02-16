/**
 * Programmatic audio cues for timers (countdown, start, stop, rest complete).
 * Uses Web Audio API so no audio files are required; works offline.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function playTone(
  frequency: number,
  durationMs: number,
  volume: number = 0.3,
  type: OscillatorType = "sine"
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.setValueAtTime(frequency, now + durationMs * 0.001);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.setValueAtTime(volume, now + durationMs * 0.001 - 0.02);
  gain.gain.linearRampToValueAtTime(0, now + durationMs * 0.001);
  osc.start(now);
  osc.stop(now + durationMs * 0.001 + 0.01);
}

/** Short high beep for 3-2-1 countdown ticks. */
export function playCountdownBeep(): void {
  playTone(880, 120, 0.25);
}

/** Longer lower tone for "GO" / start. */
export function playStartBeep(): void {
  playTone(440, 350, 0.3);
}

/** Double beep for "timer done" / stop. */
export function playStopBeep(): void {
  playTone(660, 150, 0.3);
  setTimeout(() => playTone(660, 150, 0.3), 180);
}

/** Distinct chime when rest period finishes. */
export function playRestCompleteChime(): void {
  playTone(523, 120, 0.25);
  setTimeout(() => playTone(659, 120, 0.25), 130);
  setTimeout(() => playTone(784, 180, 0.28), 260);
}

/** Quick single beep for "rest ending in 1 second" warning (repeater timer). */
export function playRestWarningBeep(): void {
  playTone(554, 80, 0.2);
}
