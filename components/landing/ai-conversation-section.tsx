import type { LandingChatMessage } from "@/components/landing/types";
import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

type AiConversationSectionProps = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  messages: LandingChatMessage[];
};

export function AiConversationSection({
  eyebrow,
  title,
  paragraphs,
  messages,
}: AiConversationSectionProps) {
  return (
    <LandingSection>
      <LandingEyebrow>{eyebrow}</LandingEyebrow>
      <LandingSectionTitle>{title}</LandingSectionTitle>
      <div className="mb-12 space-y-5 font-sans text-base leading-relaxed text-foreground/80 md:text-lg">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="space-y-4">
        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={`${index}-user`} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.06] px-5 py-3.5">
                <p className="font-sans text-sm text-foreground">{message.text}</p>
              </div>
            </div>
          ) : (
            <div key={`${index}-assistant`} className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-momentum/20 bg-momentum/10 px-5 py-3.5">
                <p className="font-sans text-sm text-foreground">{message.text}</p>
              </div>
            </div>
          )
        )}
      </div>
    </LandingSection>
  );
}
