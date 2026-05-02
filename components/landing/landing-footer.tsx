// components/landing/landing-footer.tsx
import { LogoutButton } from "@/components/forms/logout-button";

type LandingFooterProps = {
  thanks: string;
  cta: string;
};

export function LandingFooter({ thanks, cta }: LandingFooterProps) {
  return (
    <footer className="flex flex-col items-center justify-center py-24 border-t border-border/40 bg-muted/5">
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground leading-relaxed italic px-6">
        {thanks}
      </p>
      
      {/* Strive branded Supabase logout button */}
      <LogoutButton 
        variant="outline" 
        size="sm" 
        className="rounded-full text-xs font-normal text-muted-foreground hover:text-foreground"
      >
        {cta}
      </LogoutButton>
    </footer>
  );
}