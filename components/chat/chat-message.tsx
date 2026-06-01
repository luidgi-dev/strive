import { isToolUIPart, type UIMessage } from "ai";

import { ToolCard } from "./cards/tool-card";
import { VoiceMessage } from "./voice-message";

/**
 * A single chat message. User messages sit right (a voice message renders as a
 * playable bubble, otherwise text). Assistant messages render any tool calls as
 * cards, followed by the model's short accompanying text (left, minimal, no
 * avatar). Step parts are ignored.
 */
export function ChatMessage({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const audioPart = message.parts.find(
      (part) => part.type === "file" && part.mediaType.startsWith("audio/"),
    );
    if (audioPart?.type === "file") {
      return <VoiceMessage url={audioPart.url} />;
    }
    const text = textOf(message);
    if (!text) return null;
    return (
      <div className="max-w-[84%] self-end whitespace-pre-wrap break-words rounded-[18px_18px_4px_18px] bg-foreground/10 px-3 py-2 text-sm leading-snug text-foreground">
        {text}
      </div>
    );
  }

  const toolParts = message.parts.filter(isToolUIPart);
  const text = textOf(message);
  if (toolParts.length === 0 && !text) return null;

  return (
    <>
      {toolParts.map((part, index) => (
        <ToolCard key={part.toolCallId ?? index} part={part} />
      ))}
      {text ? (
        <div className="max-w-[84%] self-start whitespace-pre-wrap break-words rounded-[18px_18px_18px_4px] bg-accent px-3 py-2 text-sm leading-snug text-foreground">
          {text}
        </div>
      ) : null}
    </>
  );
}

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}
