"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseDictation = {
  /** Whether the browser exposes the Web Speech API at all. */
  supported: boolean;
  /** Whether a recognition session is currently active. */
  listening: boolean;
  start: () => void;
  stop: () => void;
};

/**
 * Thin wrapper around the browser SpeechRecognition API for dictation. The
 * recognized transcript is handed to `onTranscript` (the caller appends it to
 * the message input); we never send it on the user's behalf. Returns
 * `supported: false` where the API is missing (e.g. Firefox) so the caller can
 * hide the mic button.
 */
export function useDictation(
  lang: string,
  onTranscript: (text: string) => void,
): UseDictation {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Keep the latest callback without re-creating the recognizer on every render.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // Drive `listening` from the recognizer's own lifecycle events rather than
    // optimistically, so the UI stays correct if start fails or the engine ends
    // a session on its own (silence timeout, permission denied, etc.).
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscriptRef.current(transcript);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    try {
      recognition.start();
    } catch {
      // start() throws if a session is already running; safe to ignore.
    }
  }, [listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, listening, start, stop };
}
