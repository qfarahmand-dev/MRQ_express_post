export type UserRole = 'admin' | 'staff'

export interface AppUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export interface ProfileUpdateInput {
  fullName: string
  email: string
}

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'updateStatus'

/**
 * UI-only permission map. Real authorization must be enforced server-side
 * with Supabase Auth and Row Level Security — never trust this alone.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['view', 'create', 'edit', 'delete', 'updateStatus'],
  staff: ['view', 'create', 'edit', 'updateStatus'],
}
