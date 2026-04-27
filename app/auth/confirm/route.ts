import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const { searchParams } = url
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/auth/confirmed'

  if (error || errorDescription) {
    const errorMessage = errorDescription ?? error ?? 'Invalid or expired confirmation link'
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorMessage)}`, url.origin)
    )
  }

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }

    console.error('Auth verification error:', error.message)
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, url.origin)
    )
  }

  return NextResponse.redirect(
    new URL('/auth/error?error=Invalid token or missing type', url.origin)
  )
}