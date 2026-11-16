'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { notificationService } from '@/services/warehouse-service'
import { useLanguage } from '@/contexts/language-context'

export function NotificationBell() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    notificationService.getUnreadCount().then(setUnreadCount).finally(() => setLoading(false))
  }, [user])

  if (loading) return null

  return (
    <button
      aria-label={t.nav.notifications || 'Notifications'}
      className="relative flex items-center justify-center rounded-lg p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {unreadCount > 0 ? <BellOff className="size-5" /> : <Bell className="size-5" />}
      {unreadCount > 0 && (
        <Badge className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold leading-none ring-offset-background border-2 ring-offset-scale/95 scale-95 badge-destructive">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </button>
  )
}
