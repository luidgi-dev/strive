'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Redirect to the protected dashboard
      router.push('/protected')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8 w-full max-w-md mx-auto', className)} {...props}>
      {/* Brand Identity */}
      <div className="overflow-hidden rounded-2xl shadow-sm mx-auto">
        <Image
          src="/icon.svg"
          alt="Strive logo"
          width={64}
          height={64}
          className="block" 
        />
      </div>

      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-4 p-6 pt-8 text-center">
          <CardTitle className="font-sora text-3xl font-bold tracking-tight">
            Find your rhythm
          </CardTitle>
          <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
             Ready to continue? Consistency is the only way forward.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="grid gap-2">
                <Label 
                  htmlFor="email" 
                  className="font-dm-sans text-sm font-medium text-foreground"
                >
                  Your email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-dm-sans h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="password" 
                    className="font-dm-sans text-sm font-medium text-foreground"
                  >
                    Your password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-dm-sans text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-dm-sans h-11 bg-background border-input focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-dm-sans">
                {error}
              </div>
            )}

            {/* CTA Button */}
            <Button 
              type="submit" 
              className="w-full h-11 font-dm-sans text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Resume your arc'}
            </Button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-8 text-center">
            <p className="font-dm-sans text-sm text-muted-foreground">
              New here?{' '}
              <Link 
                href="/auth/sign-up" 
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Start your arc
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}