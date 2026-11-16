
import { getManagementContext } from '@/lib/server/management-context'
import { managementDatabaseError } from '@/lib/server/management-errors'
import { isValidEmail } from '@/lib/validation'
import { USER_ROLES, type AccountStatus, type UserRole } from '@/types/user'

type UserDraft = {
  fullName: string
  email: string
  role: UserRole
  officeId: string | null
  accountStatus: AccountStatus
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === 'active' || value === 'inactive'
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.some((role) => role === value)
}

function validateOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const host = request.headers.get('host')
  if (!host) return null

  try {
    const originHost = new URL(origin).host

    if (originHost !== host) {
      return Response.json({ error: 'invalid_origin' }, { status: 403 })
    }
  } catch {
    return Response.json({ error: 'invalid_origin' }, { status: 403 })
  }

  return null
}

export async function GET() {
  const result = await getManagementContext()
  if ('response' in result) return result.response

  const { actor, adminClient } = result.context

  if (actor.role !== 'admin' && actor.role !== 'office_manager') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  let profileQuery = adminClient
    .from('profiles')
    .select('id, full_name, role, office_id, account_status, created_at')
    .order('created_at', { ascending: false })

  if (actor.role === 'office_manager') {
    profileQuery = profileQuery.eq('office_id', actor.officeId)
  }

  const [
    { data: profiles, error: profilesError },
    { data: authUsers, error: authError },
  ] = await Promise.all([
    profileQuery,
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  if (profilesError) {
    return Response.json(
      { error: managementDatabaseError(profilesError, 'user_list_failed') },
      { status: 500 }
    )
  }

  if (authError) {
    return Response.json(
      { error: managementDatabaseError(authError, 'service_role_key_invalid') },
      { status: 500 }
    )
  }

  const authById = new Map(
    authUsers.users.map((authUser) => [authUser.id, authUser])
  )

  const users = profiles
    .filter((profile) => actor.role === 'admin' || profile.role === 'storekeeper')
    .map((profile) => {
      const authUser = authById.get(profile.id)

      return {
        id: profile.id,
        fullName: profile.full_name,
        email: authUser?.email ?? '',
        role: profile.role,
        officeId: profile.office_id,
        accountStatus: profile.account_status,
        createdAt: profile.created_at,
        lastLoginAt: authUser?.last_sign_in_at ?? null,
      }
    })

  return Response.json({ users })
}

export async function POST(request: Request) {
  const result = await getManagementContext()
  if ('response' in result) return result.response

  const { actor, adminClient } = result.context

  if (actor.role !== 'admin' && actor.role !== 'office_manager') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const originError = validateOrigin(request)
  if (originError) return originError

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  if (!isRecord(body)) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const email = typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : ''

  const role = body.role
  const requestedOfficeId = typeof body.officeId === 'string'
    ? body.officeId
    : null

  const accountStatus = body.accountStatus

  if (
    !fullName ||
    !isValidEmail(email) ||
    !isUserRole(role) ||
    !isAccountStatus(accountStatus)
  ) {
    return Response.json({ error: 'invalid_user_details' }, { status: 400 })
  }

  if (accountStatus !== 'active') {
    return Response.json(
      { error: 'new_users_must_be_invited_active' },
      { status: 400 }
    )
  }

  const officeId = actor.role === 'office_manager'
    ? actor.officeId
    : requestedOfficeId

  if (actor.role === 'office_manager' && role !== 'storekeeper') {
    return Response.json(
      { error: 'office_managers_can_only_invite_storekeepers' },
      { status: 403 }
    )
  }

  if ((role === 'admin' && officeId) || (role !== 'admin' && !officeId)) {
    return Response.json(
      { error: 'invalid_office_assignment' },
      { status: 400 }
    )
  }

  if (officeId) {
    const { data: office, error: officeError } = await adminClient
      .from('offices')
      .select('id, status')
      .eq('id', officeId)
      .maybeSingle()

    if (officeError) {
      return Response.json({ error: 'office_lookup_failed' }, { status: 500 })
    }

    if (!office || office.status !== 'active') {
      return Response.json(
        { error: 'active_office_required' },
        { status: 400 }
      )
    }
  }

  // Use the canonical production URL for invitation redirects.
  // Never derive the invitation URL from request.url because
  // Vercel preview deployments have different hostnames.
  const appUrl = process.env.APP_URL

  if (!appUrl) {
    console.error('Invitation failed: APP_URL is not configured.')

    return Response.json(
      { error: 'app_url_not_configured' },
      { status: 500 }
    )
  }

  let redirectUrl: URL

  try {
    const parsedAppUrl = new URL(appUrl)

    if (
      parsedAppUrl.protocol !== 'https:' &&
      process.env.NODE_ENV === 'production'
    ) {
      return Response.json(
        { error: 'invalid_app_url_configuration' },
        { status: 500 }
      )
    }

    redirectUrl = new URL('/auth/callback', parsedAppUrl.origin)
    redirectUrl.searchParams.set('next', '/invite/complete')
  } catch {
    return Response.json(
      { error: 'invalid_app_url_configuration' },
      { status: 500 }
    )
  }

  // Create the invitation record in the database.
  const { error: inviteInsertError } = await adminClient
    .from('user_invites')
    .insert({
      email,
      full_name: fullName,
      role,
      office_id: officeId,
      invited_by: actor.id,
    })

  if (inviteInsertError) {
    if (inviteInsertError.code !== '23505') {
      return Response.json(
        {
          error: managementDatabaseError(
            inviteInsertError,
            'invite_record_failed'
          ),
        },
        { status: 500 }
      )
    }

    return Response.json(
      { error: 'email_already_invited' },
      { status: 409 }
    )
  }

  // Send the Supabase authentication invitation.
  const { data: invitation, error: authInviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
      },
      redirectTo: redirectUrl.toString(),
    })

  if (authInviteError || !invitation?.user) {
    // Log the actual Supabase error on the server.
    console.error('Supabase invitation failed:', {
      message: authInviteError?.message,
      status: authInviteError?.status,
      code: authInviteError?.code,
    })

    // Remove the pending invitation record if email invitation fails.
    const { error: cleanupError } = await adminClient
      .from('user_invites')
      .delete()
      .eq('email', email)
      .is('accepted_at', null)

    if (cleanupError) {
      console.error('Invitation cleanup failed:', cleanupError.message)

      return Response.json(
        { error: 'invite_failed_cleanup_failed' },
        { status: 500 }
      )
    }

    return Response.json(
      { error: 'auth_invite_failed' },
      { status: 400 }
    )
  }

  // Fetch the profile created by the database trigger.
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, full_name, role, office_id, account_status, created_at')
    .eq('id', invitation.user.id)
    .single()

  if (profileError) {
    console.error('Invited profile lookup failed:', profileError.message)

    return Response.json(
      { error: 'invited_profile_not_created' },
      { status: 500 }
    )
  }

  return Response.json(
    {
      user: {
        id: profile.id,
        fullName: profile.full_name,
        email: invitation.user.email ?? email,
        role: profile.role,
        officeId: profile.office_id,
        accountStatus: profile.account_status,
        createdAt: profile.created_at,
        lastLoginAt: invitation.user.last_sign_in_at ?? null,
      },
    },
    { status: 201 }
  )
}

export async function PATCH(request: Request) {
  const result = await getManagementContext()
  if ('response' in result) return result.response

  const { actor, adminClient } = result.context

  if (actor.role !== 'admin' && actor.role !== 'office_manager') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const originError = validateOrigin(request)
  if (originError) return originError

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  if (!isRecord(body) || typeof body.id !== 'string') {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  const { data: target, error: targetError } = await adminClient
    .from('profiles')
    .select('id, full_name, role, office_id, account_status')
    .eq('id', body.id)
    .maybeSingle()

  if (targetError) {
    return Response.json(
      { error: managementDatabaseError(targetError, 'user_lookup_failed') },
      { status: 500 }
    )
  }

  if (!target) {
    return Response.json({ error: 'user_not_found' }, { status: 404 })
  }

  if (actor.role === 'office_manager') {
    if (
      target.office_id !== actor.officeId ||
      target.role !== 'storekeeper' ||
      target.id === actor.id
    ) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }

    if ('role' in body || 'officeId' in body || 'email' in body) {
      return Response.json(
        { error: 'office_managers_cannot_change_role_office_or_email' },
        { status: 403 }
      )
    }
  }

  const fullName = typeof body.fullName === 'string'
    ? body.fullName.trim()
    : target.full_name

  const role = isUserRole(body.role) ? body.role : target.role

  const accountStatus = isAccountStatus(body.accountStatus)
    ? body.accountStatus
    : target.account_status

  const officeId = actor.role === 'office_manager'
    ? actor.officeId
    : role === 'admin'
      ? null
      : typeof body.officeId === 'string'
        ? body.officeId
        : target.office_id

  const email = typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : undefined

  if (
    !fullName ||
    (body.role !== undefined && !isUserRole(body.role)) ||
    (body.accountStatus !== undefined && !isAccountStatus(body.accountStatus))
  ) {
    return Response.json({ error: 'invalid_user_details' }, { status: 400 })
  }

  if ((role === 'admin' && officeId) || (role !== 'admin' && !officeId)) {
    return Response.json(
      { error: 'invalid_office_assignment' },
      { status: 400 }
    )
  }

  if (email !== undefined && !isValidEmail(email)) {
    return Response.json({ error: 'invalid_email' }, { status: 400 })
  }

  if (officeId) {
    const { data: office, error: officeError } = await adminClient
      .from('offices')
      .select('id, status')
      .eq('id', officeId)
      .maybeSingle()

    if (officeError) {
      return Response.json({ error: 'office_lookup_failed' }, { status: 500 })
    }

    if (!office || (office.status !== 'active' && officeId !== target.office_id)) {
      return Response.json(
        { error: 'active_office_required' },
        { status: 400 }
      )
    }
  }

  if (
    target.role === 'admin' &&
    target.account_status === 'active' &&
    (role !== 'admin' || accountStatus !== 'active')
  ) {
    const { count, error: adminCountError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('account_status', 'active')

    if (adminCountError) {
      return Response.json(
        { error: managementDatabaseError(adminCountError, 'admin_count_failed') },
        { status: 500 }
      )
    }

    if ((count ?? 0) <= 1) {
      return Response.json(
        { error: 'cannot_disable_last_admin' },
        { status: 409 }
      )
    }
  }

  const { data: authUser, error: authUserError } =
    await adminClient.auth.admin.getUserById(target.id)

  if (authUserError || !authUser.user) {
    return Response.json(
      { error: 'auth_user_lookup_failed' },
      { status: 500 }
    )
  }

  if (email !== undefined && email !== authUser.user.email) {
    const { error: emailError } =
      await adminClient.auth.admin.updateUserById(target.id, { email })

    if (emailError) {
      return Response.json({ error: 'email_update_failed' }, { status: 400 })
    }
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from('profiles')
    .update({
      full_name: fullName,
      role,
      office_id: officeId,
      account_status: accountStatus,
    })
    .eq('id', target.id)
    .select('id, full_name, role, office_id, account_status, created_at')
    .single()

  if (updateError) {
    return Response.json(
      { error: managementDatabaseError(updateError, 'profile_update_failed') },
      { status: 500 }
    )
  }

  const { error: metadataError } =
    await adminClient.auth.admin.updateUserById(target.id, {
      user_metadata: {
        ...authUser.user.user_metadata,
        full_name: fullName,
      },
    })

  if (metadataError) {
    return Response.json(
      { error: 'profile_metadata_update_failed' },
      { status: 500 }
    )
  }

  return Response.json({
    user: {
      id: updatedProfile.id,
      fullName: updatedProfile.full_name,
      email: email ?? authUser.user.email ?? '',
      role: updatedProfile.role,
      officeId: updatedProfile.office_id,
      accountStatus: updatedProfile.account_status,
      createdAt: updatedProfile.created_at,
      lastLoginAt: authUser.user.last_sign_in_at ?? null,
    },
  })
}
