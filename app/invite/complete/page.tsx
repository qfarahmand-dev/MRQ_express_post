import type { Metadata } from 'next'
import { InviteCompletionView } from '@/components/auth/invite-completion-view'

export const metadata: Metadata = {
  title: 'Complete your invitation',
  robots: { index: false, follow: false },
}

export default function InviteCompletionPage() {
  return <InviteCompletionView />
}
