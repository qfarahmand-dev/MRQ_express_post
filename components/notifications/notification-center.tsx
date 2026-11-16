'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Clock, CheckCircle2, Bell, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/contexts/auth-context'
import { notificationService } from '@/services/warehouse-service'
import { useLanguage } from '@/contexts/language-context'
import { formatDateTime } from '@/lib/format'

const MAX_NOTIFICATIONS = 20

type PriorityColor = {
  low: 'text-muted-foreground'
  normal: 'text-foreground'
  high: 'text-orange-600 dark:text-orange-400'
  urgent: 'text-destructive'
}

export function NotificationCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: string
    title: string
    message: string
    entityType: string | null
    entityId: string | null
    officeId: string | null
    priority: string
    isRead: boolean
    readAt: string | null
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [list, count] = await Promise.all([
        notificationService.listNotifications(undefined, false),
        notificationService.getUnreadCount(),
      ])
      setNotifications(list)
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id)
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead()
      setNotifications((current) =>
        current.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read', err)
    }
  }

  const priorityColor: PriorityColor = {
    low: 'text-muted-foreground',
    normal: 'text-foreground',
    high: 'text-orange-600 dark:text-orange-400',
    urgent: 'text-destructive',
  }

  const priorityLabel: Record<string, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  }

  const typeIcon: Record<string, typeof Bell> = {
    shipment_registered: Mail,
    shipment_received: Bell,
    shipment_dispatched: ArrowRight,
    transfer_created: ArrowRight,
    transfer_completed: CheckCircle2,
    problem_reported: Bell,
    system_alert: Bell,
  }

  if (!open) return null

  const displayNotifications = notifications.slice(0, MAX_NOTIFICATIONS)

  return (
    <Card className="w-80">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded w-3/4 bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded w-1/2 bg-muted animate-pulse" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {displayNotifications.map((n) => {
                const Icon = typeIcon[n.type] ?? Bell
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className="flex items-start gap-3 p-3 hover:bg-muted transition-colors border-none text-left w-full"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${priorityColor[n.priority as keyof PriorityColor]}`}>
                          {priorityLabel[n.priority] || n.priority}
                        </span>
                        {!n.isRead && (
                          <Badge variant="outline" className="h-2 w-2 px-0 py-0 text-xs">
                            <span className="sr-only">Unread</span>
                          </Badge>
                        )}
                      </div>
                      <h4 className={`text-sm font-medium ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </h4>
                      <p className={`text-xs ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}/70 line-clamp-2`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(n.createdAt, lang)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {notifications.length > MAX_NOTIFICATIONS && (
                <div className="p-3 text-center">
                  <Button size="sm" variant="ghost" className="w-full">
                    View more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
