type SupabaseErrorSummary = {
  code?: string
  status?: number
  message?: string
}

const SCHEMA_ERROR_CODES = new Set(['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'])

export function managementDatabaseError(
  error: SupabaseErrorSummary,
  fallback: string,
): string {
  if (error.code && SCHEMA_ERROR_CODES.has(error.code)) return 'rbac_migration_required'
  if (error.status === 401 || /invalid (api )?key|invalid jwt/i.test(error.message ?? '')) {
    return 'service_role_key_invalid'
  }
  return fallback
}

export function isSchemaMigrationError(error: SupabaseErrorSummary): boolean {
  return Boolean(error.code && SCHEMA_ERROR_CODES.has(error.code))
}
