import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  // 1. Change the default redirect to your new branded page
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/auth/confirmed'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // 2. On success, the user goes to /auth/confirmed
      redirect(next)
    } else {
      // Log the error for debugging in development
      console.error('Auth verification error:', error.message)
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
    }
  }

  redirect(`/auth/error?error=Invalid token or missing type`)
}