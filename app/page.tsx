// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-10">
        
        {/*Logo */}
        <div className="flex flex-col items-center mb-8">
         <div className="overflow-hidden rounded-[22%] shadow-lg ring-1 ring-border/50">
           <Image
             src="/icon.svg"
             alt="Strive logo"
             width={100}
             height={100}
             className="aspect-square object-cover"
           />
         </div>
       </div>

        {/* Title & Slogan */}
        <div className="space-y-4">
          <h1 className="font-sora text-6xl font-bold tracking-tight sm:text-7xl">
            Strive
          </h1>
          <p className="font-dm-sans text-xl text-muted-foreground sm:text-2xl">
            An app designed for those who prefer <br className="hidden sm:block" />
            <span className="text-foreground font-medium">consistency over intensity.</span>
          </p>
        </div>

        {/* CTA Button*/}
        <div className="pt-4">
          <Button  
            size="lg" 
            className="h-14 rounded-full px-10 text-lg font-medium transition-transform hover:scale-105 active:scale-95"
          >
            <Link href="/auth/login">
              Find your rhythm
            </Link>
          </Button>
        </div>

      </div>
    </main>
  );
}