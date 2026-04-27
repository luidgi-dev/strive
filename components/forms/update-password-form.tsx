'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
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
            Set your new password
          </CardTitle>
          <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
            Choose a secure password to get back into your rhythm.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleUpdatePassword} className="space-y-8">
            <div className="grid gap-2">
              <Label 
                htmlFor="password" 
                className="font-dm-sans text-sm font-medium text-foreground"
              >
                Your new password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}