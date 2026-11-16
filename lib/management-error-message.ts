import type { Dictionary } from '@/lib/i18n'

export function managementErrorMessage(
  code: string | null | undefined,
  messages: Dictionary['management']['errors'],
): string {
  switch (code) {
    case 'rbac_migration_required':
      return messages.rbacMigrationRequired
    case 'server_not_configured':
      return messages.serverNotConfigured
    case 'service_role_key_invalid':
      return messages.serviceRoleKeyInvalid
    case 'unauthenticated':
      return messages.unauthenticated
    case 'forbidden':
    case 'office_inactive':
      return messages.forbidden
    case 'office_code_already_exists':
      return messages.officeCodeAlreadyExists
    case 'email_already_invited':
    case 'email_already_exists':
      return messages.emailAlreadyExists
    case 'active_office_required':
    case 'invalid_office_assignment':
    case 'office_assignment_required':
      return messages.officeAssignmentRequired
    case 'password_short':
      return messages.passwordShort
    case 'password_mismatch':
      return messages.passwordMismatch
    case 'new_users_must_be_active':
      return messages.newUsersMustBeActive
    case 'user_creation_failed':
    case 'profile_not_created':
      return messages.userCreationFailed
    default:
      return code ? `${messages.requestFailed} (${code})` : messages.requestFailed
  }
}
