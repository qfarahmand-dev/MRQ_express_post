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
    id: 'usr_staff_01',
    fullName: 'Sara Ahmadi',
    email: 'sara.ahmadi@mrqexpress.com',
    role: 'staff',
    createdAt: '2025-09-04T09:00:00.000Z',
  },
]

/**
 * The signed-in user for the UI demo. Change to 'usr_staff_01' to preview the Staff role.
 * Once Supabase is connected this comes from the authenticated session instead.
 */
export const MOCK_CURRENT_USER_ID = 'usr_admin_01'
