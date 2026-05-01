'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image' // Ajout import

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

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8 w-full max-w-md mx-auto', className)} {...props}>
      {/* Brand Identity */}
      <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm border border-border/70">
        <Image
          src="/icon.svg"
          alt="Strive logo"
          width={64}
          height={64}
          className="block"
        />
      </div>

      {success ? (
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-4 p-6 pt-8 text-center">
            <CardTitle className="font-sora text-3xl font-bold tracking-tight">
              Check your email
            </CardTitle>
            <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
              Instructions have been sent to your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-center">
            <p className="font-dm-sans text-sm text-muted-foreground mb-6">
              If an account exists for this email, you will receive a link to reset your password shortly.
            </p>
            <Button variant="outline" className="w-full h-11 font-dm-sans">
              <Link href="/auth/login">
                Back to sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-4 p-6 pt-8 text-center">
            <CardTitle className="font-sora text-3xl font-bold tracking-tight">
              Reset your password
            </CardTitle>
            <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
              Enter your email and we&apos;ll send you a link to get back into your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleForgotPassword} className="space-y-8">
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

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-dm-sans">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-dm-sans text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>

              <div className="text-center">
                <p className="font-dm-sans text-sm text-muted-foreground">
                  Already steady?{' '}
                  <Link 
                    href="/auth/login" 
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    Resume your arc
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}