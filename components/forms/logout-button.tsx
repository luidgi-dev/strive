'use client'

import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { type ComponentProps } from 'react'

type LogoutButtonProps = ComponentProps<typeof Button>

export function LogoutButton({ children, className, ...props }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Land on the marketing landing page (locale-aware router keeps the current
    // locale) rather than the login screen, which is otherwise rarely seen.
    router.push('/')
    router.refresh()
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