import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md space-y-8">
        
        {/* Centered Strive Logo */}
        <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
          <Image
            src="/icon.svg"
            alt="Strive logo"
            width={64}
            height={64}
            className="dark:invert"
          />
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-4 p-6 pt-8 text-center">
            <CardTitle className="font-sora text-3xl font-bold tracking-tight">
              Check your inbox
            </CardTitle>
            <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
              Confirm your email to set your rhythm.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 pt-0 text-center space-y-6">
            <p className="font-dm-sans text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent a confirmation link to your email address. 
              Please click it to activate your account and begin your arc.
            </p>
            
            <div className="pt-2">
              <p className="font-dm-sans text-xs text-muted-foreground/60 italic">
                Can&apos;t find it? Check your spam folder or wait a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}