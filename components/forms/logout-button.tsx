'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { type ComponentProps } from 'react'

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton({ children, className, ...props }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/auth/login')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleLogout}
      {...props}
    >
      {children || 'Logout'}
    </Button>
  )
}