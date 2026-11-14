'use client'

import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { ROLE_NAVIGATION } from '@/components/layout/dashboard-navigation'

export function DashboardModulePlaceholder() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()
  const item = user && ROLE_NAVIGATION[user.role].find((entry) => (
    pathname === entry.href || (!entry.exact && pathname.startsWith(`${entry.href}/`))
  ))

  return (
    <>
      <PageHeader
        title={item ? t.nav[item.label] : t.nav.modulePreview}
        description={t.nav.modulePreviewDescription}
      />
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t.nav.modulePreviewDescription}</p>
        </CardContent>
      </Card>
    </>
  )
}
