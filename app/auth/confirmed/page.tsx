// app/auth/confirmed/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function ConfirmedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8">
        
        {/* Logo centered with your fix */}
        <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm mb-4">
          <Image
            src="/icon.svg"
            alt="Strive logo"
            width={80}
            height={80}
            className="block dark:invert"
          />
        </div>

        <div className="space-y-4">
          <h1 className="font-sora text-4xl font-bold tracking-tight">
            Your rhythm is set
          </h1>
          <p className="font-dm-sans text-lg text-muted-foreground leading-relaxed">
            Your email has been confirmed. You are ready to start your journey with Strive.
          </p>
        </div>

        <div className="pt-4">
          <Button size="lg" className="h-12 rounded-full px-10 font-medium">
            <Link href="/protected">
              Enter the Strive app
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}