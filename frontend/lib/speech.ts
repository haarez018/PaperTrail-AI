/**
 * Web Speech API wrapper with Indian language support.
 * Works in Chrome / Edge. Firefox/Safari get a graceful fallback tooltip.
 */

export type SpeechLanguage = "en-IN" | "ta-IN" | "hi-IN";

/** Maps NyayaMitra language codes to BCP-47 locale codes for Speech API. */
export const speechLocale: Record<string, SpeechLanguage> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
};

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export interface SpeechRecognitionOptions {
  language: string;              // NyayaMitra language code: en | ta | hi
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  silenceTimeoutMs?: number;     // Auto-stop after N ms of silence (default: 4000)
}

type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: (e: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: { transcript: string; confidence: number };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
};

type SpeechRecognitionErrorEvent = { error: string };

/** Creates and manages a single speech recognition session. */
export function createSpeechSession(options: SpeechRecognitionOptions): {
  start: () => void;
  stop: () => void;
} {
  const locale = speechLocale[options.language] ?? "en-IN";
  const silenceMs = options.silenceTimeoutMs ?? 4000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = ((window as any).SpeechRecognition ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition) as new () => WebSpeechRecognition;

  const rec = new SR();
  rec.lang = locale;
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  rec.onstart = () => options.onStart?.();

  rec.onresult = (e: SpeechRecognitionEvent) => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const transcript = e.results[0][0].transcript;
    options.onResult(transcript);
  };

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const msg =
      e.error === "not-allowed"
        ? "Microphone access denied. Please allow mic permissions."
        : e.error === "no-speech"
        ? "No speech detected. Try again."
        : `Speech error: ${e.error}`;
    options.onError?.(msg);
  };

  rec.onend = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    options.onEnd?.();
  };

  return {
    start() {
      rec.start();
      // Auto-stop safety valve
      silenceTimer = setTimeout(() => rec.stop(), silenceMs);
    },
    stop() {
      if (silenceTimer) clearTimeout(silenceTimer);
      rec.stop();
    },
  };
}
