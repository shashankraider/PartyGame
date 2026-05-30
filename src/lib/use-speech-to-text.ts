"use client";

/**
 * Voice-to-text hook backed by the Web Speech API
 * (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).
 *
 * Used by the phone-side interrogation UI so a detective can tap a mic,
 * speak the question, and have the textarea fill in real time. No audio
 * leaves the device — recognition runs locally on iOS Safari (15+) and
 * Chrome/Edge. Firefox doesn't ship SpeechRecognition; `isSupported`
 * returns false there and callers should hide the mic button.
 *
 * Behaviour:
 * - `interimTranscript` is the in-flight partial that the engine is still
 *   refining. `finalTranscript` is the chunk the engine committed to.
 * - On stop, the hook returns the full text via `finalTranscript`; callers
 *   typically write that into a controlled textarea on each change.
 * - `continuous: true` so a detective can speak a long question without
 *   the engine auto-stopping after silence.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// The DOM lib for SpeechRecognition is patchy across TS versions; declare the
// minimum shape we use here. The vendor-prefixed `webkitSpeechRecognition` is
// what Safari exposes today.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechToTextResult = {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useSpeechToText(options: { lang?: string } = {}): UseSpeechToTextResult {
  const lang = options.lang ?? "en-US";
  // Lazy init so SSR returns false and the client picks up the real value on
  // first render — and so we don't trip react-hooks/set-state-in-effect.
  const [isSupported] = useState(() => getRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Tear down on unmount so a navigation doesn't leave the mic hot.
  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.stop();
        } catch {
          // already stopped
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser.");
      return;
    }

    // Already listening? Treat start as a no-op.
    if (recognitionRef.current) return;

    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalDelta = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0].transcript;
        if (result.isFinal) {
          finalDelta += chunk;
        } else {
          interim += chunk;
        }
      }
      if (finalDelta) {
        setFinalTranscript((prev) =>
          (prev ? `${prev} ${finalDelta}` : finalDelta).replace(/\s+/g, " "),
        );
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are routine: user stopped early or paused.
      // Surface only the actionable ones.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission denied.");
      } else if (event.error === "audio-capture") {
        setError("No microphone detected.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (startError) {
      // Some browsers throw if start() is called twice in quick succession.
      setError(startError instanceof Error ? startError.message : "Could not start voice input.");
    }
  }, [lang]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // already stopped
    }
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
