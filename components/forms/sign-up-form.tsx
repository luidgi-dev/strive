'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

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

// Validation schema based on Scope requirements
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be under 30 characters')
    .regex(/^[a-z0-9_]+$/i, 'Alphanumeric and underscores only'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpValues = z.infer<typeof signUpSchema>

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (values: SignUpValues) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Silent timezone capture
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      // 1. Supabase Auth Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          // We pass username to metadata so triggers can access it if needed
          data: {
            username: values.username,
            timezone: timezone,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (signUpError) throw signUpError

      // 2. Profile Upsert (as requested in Scope section 2)
      // Note: If you have a DB trigger handling this, this call ensures 
      // the username and timezone are correctly set immediately.


      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8 w-full max-w-md mx-auto', className)} {...props}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm border border-black/5 dark:border-white/10">
          <Image
            src="/icon.svg"
            alt="Strive logo"
            width={64}
            height={64}
            className="dark:invert"
          />
        </div>
      </div>

      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-4 p-6 pt-8 text-center">
          <CardTitle className="font-sora text-3xl font-bold tracking-tight">
            Find your rhythm
          </CardTitle>
          <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
            Build the momentum you have always wanted, one ritual at a time.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-dm-sans text-sm font-medium">
                  Your email
                </Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="font-dm-sans h-11"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Username */}
              <div className="grid gap-2">
                <Label htmlFor="username" className="font-dm-sans text-sm font-medium">
                  How should we call you?
                </Label>
                <Input
                  {...register('username')}
                  id="username"
                  placeholder="username"
                  className="font-dm-sans h-11"
                />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password" className="font-dm-sans text-sm font-medium">
                  Your password
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  className="font-dm-sans h-11"
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="font-dm-sans text-sm font-medium">
                  Repeat your password
                </Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  className="font-dm-sans h-11"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-dm-sans">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 font-dm-sans text-base font-semibold transition-all" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating your arc...' : 'Start your arc'}
            </Button>

            <div className="text-center pt-2">
              <p className="font-dm-sans text-sm text-muted-foreground">
                Already steady?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}