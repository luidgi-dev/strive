"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Mic, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { useVoiceRecorder } from "./use-voice-recorder";

const SUGGESTION_KEYS = ["momentum", "log", "list"] as const;

/**
 * Replace audio in every message except the most recent with a short text
 * placeholder before sending. The newest clip is the one the model needs to
 * transcribe; re-uploading earlier (large WAV) clips each turn would waste
 * tokens and bandwidth while the assistant's own replies already carry context.
 */
function stripHistoryAudio(messages: UIMessage[]): UIMessage[] {
  const lastIndex = messages.length - 1;
  return messages.map((message, index) => {
    if (index === lastIndex || message.role !== "user") return message;
    const hasAudio = message.parts.some(
      (part) => part.type === "file" && part.mediaType.startsWith("audio/"),
    );
    if (!hasAudio) return message;
    return {
      ...message,
      parts: message.parts.map((part) =>
        part.type === "file" && part.mediaType.startsWith("audio/")
          ? { type: "text" as const, text: "[voice message]" }
          : part,
      ),
    };
  });
}

/**
 * The conversation surface: streams replies from `/api/chat` via `useChat`,
 * renders the message list, shows a typing indicator while the agent thinks,
 * and offers a text + voice input bar. Input state is managed locally (AI SDK
 * v6 no longer owns it). One `sendMessage` per user turn keeps API calls minimal.
 */
export function StriveChat() {
  const t = useTranslations("rituals.ai");
  const [input, setInput] = useState("");
  const recorder = useVoiceRecorder();
  const [elapsed, setElapsed] = useState(0);

  const { messages, sendMessage, status } = useChat({
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: "/api/chat",
          prepareSendMessagesRequest: ({ messages }) => ({
            body: { messages: stripHistoryAudio(messages) },
          }),
        }),
      [],
    ),
  });

  const isStreaming = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;
  const isRecording = recorder.state === "recording";

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Tick the on-screen recording timer; resetting happens when recording starts.
  useEffect(() => {
    if (!isRecording) return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      250,
    );
    return () => clearInterval(id);
  }, [isRecording]);

  const submitText = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const startRecording = () => {
    setElapsed(0);
    void recorder.start();
  };

  const sendVoice = async () => {
    const clip = await recorder.stop();
    if (!clip || isStreaming) return;
    sendMessage({
      files: [
        {
          type: "file",
          mediaType: "audio/wav",
          url: clip.url,
          filename: "voice-message.wav",
        },
      ],
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-3"
      >
        {isEmpty ? (
          <div className="mt-auto flex flex-wrap gap-1.5">
            {SUGGESTION_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setInput(t(`suggestions.${key}`))}
                className="rounded-full border border-foreground/25 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                {t(`suggestions.${key}`)}
              </button>
            ))}
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {isStreaming ? <TypingIndicator label={t("thinkingLabel")} /> : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitText();
        }}
        className="border-t border-border bg-card px-3.5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        {recorder.error === "denied" ? (
          <p className="px-1 pb-2 text-xs text-muted-foreground">
            {t("micDenied")}
          </p>
        ) : null}

        {isRecording ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recorder.cancel}
              aria-label={t("cancelLabel")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm text-foreground">
              <span
                aria-hidden
                className="size-2 animate-pulse rounded-full bg-missed"
              />
              <span>{t("recording")}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatElapsed(elapsed)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void sendVoice()}
              aria-label={t("stopLabel")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90"
            >
              <ArrowUp aria-hidden className="size-[18px]" strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              disabled={isStreaming}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full bg-accent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            {recorder.supported ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isStreaming}
                aria-label={t("recordLabel")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <Mic aria-hidden className="size-[18px]" strokeWidth={1.75} />
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isStreaming || input.trim().length === 0}
              aria-label={t("sendLabel")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
            >
              <ArrowUp aria-hidden className="size-[18px]" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
