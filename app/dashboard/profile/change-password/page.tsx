import type { Metadata } from 'next'
import { ChangePasswordView } from '@/components/profile/change-password-view'

export const metadata: Metadata = {
  title: 'Change Password',
}

export default function ChangePasswordPage() {
  return <ChangePasswordView />
}
