"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Mic } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { useDictation } from "./use-dictation";

const SUGGESTION_KEYS = ["momentum", "log", "list"] as const;

/**
 * The conversation surface: streams replies from `/api/chat` via `useChat`,
 * renders the message list, shows a typing indicator while the agent thinks,
 * and offers a text + voice input bar. Input state is managed locally (AI SDK
 * v6 no longer owns it). One `sendMessage` per user turn keeps API calls minimal.
 */
export function StriveChat() {
  const t = useTranslations("rituals.ai");
  const locale = useLocale();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: useMemo(
      () => new DefaultChatTransport({ api: "/api/chat" }),
      [],
    ),
  });

  const isStreaming = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const dictation = useDictation(
    locale === "fr" ? "fr-FR" : "en-US",
    (transcript) =>
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript)),
  );

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
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
          submit();
        }}
        className="flex items-center gap-1 border-t border-border bg-card px-3.5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            dictation.listening ? t("micListening") : t("placeholder")
          }
          aria-label={t("placeholder")}
          disabled={isStreaming}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full bg-accent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {dictation.supported ? (
          <button
            type="button"
            onClick={() =>
              dictation.listening ? dictation.stop() : dictation.start()
            }
            aria-label={t("micLabel")}
            aria-pressed={dictation.listening}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
              dictation.listening
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
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
      </form>
    </div>
  );
}
