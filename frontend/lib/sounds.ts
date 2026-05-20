/**
 * Sound effects via Web Audio API — no audio files required.
 * All sounds are programmatically generated.
 */

let _ctx: AudioContext | null = null;
let _enabled = true;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return _ctx;
}

function play(fn: (c: AudioContext) => void) {
  if (!_enabled) return;
  const c = ctx();
  if (!c) return;
  try { fn(c); } catch { /* ignore audio errors */ }
}

/** Whoosh — sent a message */
export function playSend() {
  play((c) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.2);
  });
}

/** Ding — plan is ready */
export function playPlanReady() {
  play((c) => {
    [523, 659, 784].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, c.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.35);
      osc.start(c.currentTime + i * 0.12);
      osc.stop(c.currentTime + i * 0.12 + 0.4);
    });
  });
}

/** Paper shuffle — document generated */
export function playDocGenerated() {
  play((c) => {
    const bufferSize = c.sampleRate * 0.12;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    source.start(c.currentTime);
  });
}

/** Chime — agent response received */
export function playAgentResponse() {
  play((c) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, c.currentTime);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.45);
  });
}

export function setSoundEnabled(enabled: boolean) {
  _enabled = enabled;
}

export function isSoundEnabled() {
  return _enabled;
}
