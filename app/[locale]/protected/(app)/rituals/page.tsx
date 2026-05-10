import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function RitualsPage() {
    
  const tNav = useTranslations("navigation");
  const tApp = useTranslations("app.rituals"); 
  const tLanding = useTranslations("landing.hero");
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      {/* Nav */}
      <h1 className="text-4xl font-bold tracking-tighter">
        {tNav("rituals")}
      </h1>
      
      {/* Rituals description */}
      <p className="text-muted-foreground max-w-[250px]">
        {tApp("description")}
      </p>
      
      {/* Available soon CTA */}
      <Button disabled size="lg" variant="outline" className="mt-4 min-h-[44px] px-6 border-dashed opacity-50">
        {tLanding("cta")}
      </Button>
    </div>
  );
}