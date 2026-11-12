import type { AppUser } from '@/types/user'

export const mockUsers: AppUser[] = [
  {
    id: 'usr_admin_01',
    fullName: 'Mohammad Rahimi',
    email: 'admin@mrqexpress.com',
    role: 'admin',
    createdAt: '2025-03-12T09:00:00.000Z',
  },
  {
    id: 'usr_admin_02',
    fullName: 'Sara Ahmadi',
    email: 'sara.ahmadi@mrqexpress.com',
    role: 'admin',
    createdAt: '2025-09-04T09:00:00.000Z',
  },
]

/**
 * Demo identities retained for local fixtures. Production identity comes from Supabase Auth.
 */
