export type LandingChatRole = "user" | "assistant";

export type LandingChatMessage = {
  role: LandingChatRole;
  text: string;
};

export type LandingVocabularyItem = {
  from: string;
  to: string;
  description: string;
};

export type LandingWeekdayState = "logged" | "rest" | "empty";

export type LandingWeekdayCell = {
  shortLabel: string;
  state: LandingWeekdayState;
};

export type LandingVisualizationCard = {
  name: string;
  schedule: string;
  statusLabel: string;
  weekdays: LandingWeekdayCell[];
  momentumLabel: string;
  momentumPrimary: string;
  momentumSecondary: string;
  arcLabel: string;
  arcPrimary: string;
  arcSecondary: string;
  restMarker: string;
};

export type LandingContent = {
  meta: {
    logoAlt: string;
  };
  hero: {
    title: string;
    description: string;
    cta: string;
  };
  philosophy: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  intelligence: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    messages: LandingChatMessage[];
  };
  vocabulary: {
    eyebrow: string;
    title: string;
    items: LandingVocabularyItem[];
  };
  visualization: {
    eyebrow: string;
    title: string;
    card: LandingVisualizationCard;
  };
  footer: {
    thanks: string;
    cta: string;
  };
};
