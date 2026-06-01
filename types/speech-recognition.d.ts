// The Web Speech API (SpeechRecognition) is not part of the standard
// TypeScript DOM lib. Augmenting it here lets the dictation hook use the real
// types directly, without `as` casts. Supported in Chrome/Edge (as
// `webkitSpeechRecognition`) and Safari.

declare global {
  /** A single transcription alternative for a recognized phrase. */
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  /** One recognition result, possibly with several alternatives. */
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item: (index: number) => SpeechRecognitionAlternative;
    readonly [index: number]: SpeechRecognitionAlternative;
  }

  /** The list of results produced for a recognition session. */
  interface SpeechRecognitionResultList {
    readonly length: number;
    item: (index: number) => SpeechRecognitionResult;
    readonly [index: number]: SpeechRecognitionResult;
  }

  /** Fired on each (interim or final) recognition result. */
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  /** Fired when recognition fails. */
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  /** The recognizer itself. */
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((event: Event) => void) | null;
    onstart: ((event: Event) => void) | null;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export {};
