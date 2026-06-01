"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

// Static decorative waveform (heights in px), mirroring the wireframe bubble.
const WAVEFORM_BARS = [6, 10, 4, 13, 8, 16, 10, 14, 6, 12, 5, 11, 15, 8, 10, 6];

/**
 * A sent voice message: a play/pause control, a decorative waveform, and the
 * clip duration. Plays the audio (a WAV data URL) locally; the model received
 * the same audio to transcribe and act on.
 */
export function VoiceMessage({ url }: { url: string }) {
  const t = useTranslations("rituals.ai");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    const onEnded = () => setPlaying(false);
    const onMeta = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onMeta);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex max-w-[84%] items-center gap-2.5 self-end rounded-[18px_18px_4px_18px] bg-foreground/10 py-2 pl-2 pr-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("voicePauseLabel") : t("voicePlayLabel")}
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-foreground text-background"
      >
        {playing ? (
          <Pause aria-hidden className="size-2.5" />
        ) : (
          <Play aria-hidden className="size-2.5" />
        )}
      </button>
      <span aria-hidden className="flex h-5 items-center gap-0.5">
        {WAVEFORM_BARS.map((height, index) => (
          <span
            key={index}
            className="w-0.5 rounded-full bg-foreground/55"
            style={{ height: `${height}px` }}
          />
        ))}
      </span>
      {duration != null ? (
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {formatDuration(duration)}
        </span>
      ) : null}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
