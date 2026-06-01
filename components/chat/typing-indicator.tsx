/**
 * Three pulsing dots shown in the conversation while the agent is responding.
 * Purely presentational; the parent passes a localized aria-label.
 */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-center gap-1 self-start rounded-[18px_18px_18px_4px] bg-accent px-3 py-3"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          aria-hidden
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </div>
  );
}
