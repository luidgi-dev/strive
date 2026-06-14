"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceClip = {
  /** A `data:audio/wav;base64,...` URL, ready to send as a file part and to play back. */
  url: string;
  /** Clip length in milliseconds. */
  durationMs: number;
};

type RecorderState = "idle" | "recording";

type UseVoiceRecorder = {
  /** Whether the browser can capture and decode microphone audio. */
  supported: boolean;
  state: RecorderState;
  /** Set when the user blocks the microphone. */
  error: "denied" | null;
  start: () => Promise<void>;
  /** Stop and return the recorded clip as WAV, or null if it was too short. */
  stop: () => Promise<VoiceClip | null>;
  /** Stop and discard the recording. */
  cancel: () => void;
};

const TARGET_SAMPLE_RATE = 16_000; // Gemini downsamples voice to 16 kHz anyway.
const MIN_DURATION_MS = 300;

/**
 * Records a microphone clip and normalizes it to mono 16 kHz WAV.
 *
 * MediaRecorder yields a platform-specific container (webm/opus on Android,
 * mp4/aac on iOS); we decode it and re-encode to WAV so the payload sent to the
 * model is the same Gemini-accepted format everywhere. WAV is heavier than the
 * native codecs, which is why the chat trims old clips from the history.
 */
export function useVoiceRecorder(): UseVoiceRecorder {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.MediaRecorder !== "undefined" &&
      typeof window.AudioContext !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
  );
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<"denied" | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      // Most commonly NotAllowedError (permission blocked).
      releaseStream();
      setState("idle");
      setError("denied");
    }
  }, [releaseStream]);

  const stop = useCallback(async (): Promise<VoiceClip | null> => {
    const recorder = recorderRef.current;
    if (!recorder) return null;

    const recorded = await new Promise<Blob>((resolve) => {
      recorder.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      recorder.stop();
    });
    releaseStream();
    setState("idle");

    const clip = await encodeClip(recorded);
    return clip && clip.durationMs >= MIN_DURATION_MS ? clip : null;
  }, [releaseStream]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    releaseStream();
    setState("idle");
  }, [releaseStream]);

  return { supported, state, error, start, stop, cancel };
}

/** Decode the recorded container and re-encode it to a mono 16 kHz WAV data URL. */
async function encodeClip(recorded: Blob): Promise<VoiceClip | null> {
  if (recorded.size === 0) return null;

  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(
      await recorded.arrayBuffer(),
    );
    const mono = downsample(
      mixToMono(decoded),
      decoded.sampleRate,
      TARGET_SAMPLE_RATE,
    );
    const wav = encodeWav(mono, TARGET_SAMPLE_RATE);
    const url = await blobToDataUrl(wav);
    return { url, durationMs: Math.round(decoded.duration * 1000) };
  } catch {
    return null;
  } finally {
    void audioContext.close();
  }
}

/** Average all channels down to a single mono track. */
function mixToMono(buffer: AudioBuffer): Float32Array {
  const { numberOfChannels, length } = buffer;
  if (numberOfChannels === 1) return buffer.getChannelData(0);

  const mono = new Float32Array(length);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) mono[i] += data[i] / numberOfChannels;
  }
  return mono;
}

/** Nearest-neighbour downsample; good enough for speech. */
function downsample(
  samples: Float32Array,
  inputRate: number,
  targetRate: number,
): Float32Array {
  if (targetRate >= inputRate) return samples;
  const ratio = inputRate / targetRate;
  const length = Math.floor(samples.length / ratio);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = samples[Math.min(Math.round(i * ratio), samples.length - 1)];
  }
  return result;
}

/** Encode mono float samples as a 16-bit PCM WAV blob. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
