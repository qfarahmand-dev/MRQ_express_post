import type { Metadata } from 'next'
import { LoginView } from '@/components/auth/login-view'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to the MRQ Express Post shipment management dashboard.',
}

export default function LoginPage() {
  return <LoginView />
}
