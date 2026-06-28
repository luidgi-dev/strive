"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Mic, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatMessage } from "./chat-message";
import { Greeting } from "./greeting";
import { TypingIndicator } from "./typing-indicator";
import { useVoiceRecorder } from "./use-voice-recorder";

const SUGGESTION_KEYS = ["momentum", "create", "list"] as const;

// Cap the auto-growing input at roughly five lines, then it scrolls internally.
const MAX_INPUT_HEIGHT = 132;

// Block codes the chat route puts in a non-2xx JSON body ({ code, resetAt }).
// These two keep the input locked; any other failure is a transient retry.
const BLOCKING_CODES = new Set(["credits_exhausted", "ai_paused"]);

type ChatBlock = { code: string; resetAt: string | null };

/**
 * Read the structured `{ code, resetAt }` the route returns when a request is
 * blocked. `useChat` surfaces a non-2xx response as an Error whose message is
 * the response body. Anything we can't parse is treated as a generic error.
 */
function parseChatError(error: Error | undefined): ChatBlock | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { code?: unknown }).code === "string"
    ) {
      const { code, resetAt } = parsed as { code: string; resetAt?: unknown };
      return { code, resetAt: typeof resetAt === "string" ? resetAt : null };
    }
  } catch {
    // Not a structured block (network error, 500 without body, etc.).
  }
  return { code: "error", resetAt: null };
}

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
  const format = useFormatter();
  const [input, setInput] = useState("");
  const recorder = useVoiceRecorder();
  const [elapsed, setElapsed] = useState(0);

  const { messages, sendMessage, status, error } = useChat({
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

  // Map a blocked request to a calm, localized notice. The quota case shows the
  // renewal date; the global pause and generic failures reuse their own copy.
  const block = useMemo(() => parseChatError(error), [error]);
  const isBlocked = block ? BLOCKING_CODES.has(block.code) : false;
  const noticeText = useMemo(() => {
    if (!block) return null;
    if (block.code === "credits_exhausted") {
      return t("creditsExhausted", {
        resetDate: block.resetAt
          ? format.dateTime(new Date(block.resetAt), { dateStyle: "long" })
          : "",
      });
    }
    if (block.code === "ai_paused") return t("aiPaused");
    return t("errorMessage");
  }, [block, t, format]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Grow the textarea with its content (long messages stay fully visible)
  // up to MAX_INPUT_HEIGHT, after which it scrolls. Runs on every edit and
  // resets naturally when `input` is cleared after sending.
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [input]);

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
    if (!trimmed || isStreaming || isBlocked) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  // On a device with a physical keyboard, Enter sends and Shift+Enter inserts a
  // newline. On touch devices the Enter key always inserts a newline (sending is
  // the on-screen button), so a long message can be composed across lines.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      event.preventDefault();
      submitText();
    }
  };

  const startRecording = () => {
    setElapsed(0);
    void recorder.start();
  };

  const sendVoice = async () => {
    const clip = await recorder.stop();
    if (!clip || isStreaming || isBlocked) return;
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
        <Greeting />
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
        {noticeText ? (
          <div
            role="status"
            className="mb-2 rounded-2xl border border-border bg-accent px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground"
          >
            {noticeText}
          </div>
        ) : null}

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
          <div className="flex items-end gap-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              disabled={isStreaming || isBlocked}
              autoComplete="off"
              rows={1}
              // text-base (16px) keeps iOS Safari from zooming the viewport on focus.
              className="min-w-0 flex-1 resize-none overflow-y-auto rounded-3xl bg-accent px-4 py-2.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
              style={{ maxHeight: MAX_INPUT_HEIGHT }}
            />
            {recorder.supported ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isStreaming || isBlocked}
                aria-label={t("recordLabel")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <Mic aria-hidden className="size-[18px]" strokeWidth={1.75} />
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isStreaming || isBlocked || input.trim().length === 0}
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
