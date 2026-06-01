import type { UIMessage } from "ai";

import { cn } from "@/lib/utils";

import { VoiceMessage } from "./voice-message";

/**
 * A single chat bubble. User messages sit right with a subtle fill; agent
 * messages sit left in the accent surface (no avatar, per the minimal design).
 * A user voice message renders as a playable bubble; otherwise we render text.
 * Tool/step parts are ignored for now (until the interactive-card follow-up).
 */
export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const audioPart = message.parts.find(
    (part) => part.type === "file" && part.mediaType.startsWith("audio/"),
  );
  if (audioPart?.type === "file") {
    return <VoiceMessage url={audioPart.url} />;
  }

  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");

  if (!text) return null;

  return (
    <div
      className={cn(
        "max-w-[84%] whitespace-pre-wrap break-words px-3 py-2 text-sm leading-snug text-foreground",
        isUser
          ? "self-end rounded-[18px_18px_4px_18px] bg-foreground/10"
          : "self-start rounded-[18px_18px_18px_4px] bg-accent",
      )}
    >
      {text}
    </div>
  );
}
