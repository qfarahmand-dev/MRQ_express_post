import { getManagementContext } from '@/lib/server/management-context'
import { managementDatabaseError } from '@/lib/server/management-errors'
import type { AccountStatus } from '@/types/user'

type OfficeDraft = {
  name: string
  code: string
  address: string
  phone: string
  email: string
  status: AccountStatus
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === 'active' || value === 'inactive'
}

function readOfficeDraft(body: Record<string, unknown>): OfficeDraft | null {
  if (
    typeof body.name !== 'string'
    || typeof body.code !== 'string'
    || typeof body.address !== 'string'
    || typeof body.phone !== 'string'
    || typeof body.email !== 'string'
    || !isAccountStatus(body.status)
  ) return null

  const draft = {
    name: body.name.trim(),
    code: body.code.trim().toUpperCase(),
    address: body.address.trim(),
    phone: body.phone.trim(),
    email: body.email.trim().toLowerCase(),
    status: body.status,
  }
  if (!draft.name || !draft.code || !/^[A-Z0-9-]{2,20}$/.test(draft.code)) return null
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return null
  return draft
}

export async function GET() {
  const result = await getManagementContext()
  if ('response' in result) return result.response

  const { actor, adminClient } = result.context
  if (actor.role !== 'admin' && actor.role !== 'office_manager') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  let officeQuery = adminClient
    .from('offices')
    .select('id, name, code, address, phone, email, status, created_at, updated_at')
    .order('name', { ascending: true })
  if (actor.role === 'office_manager') officeQuery = officeQuery.eq('id', actor.officeId)
  const { data: offices, error: officesError } = await officeQuery
  if (officesError) {
    return Response.json({ error: managementDatabaseError(officesError, 'office_list_failed') }, { status: 500 })
  }

  const officeIds = offices.map((office) => office.id)
  if (officeIds.length === 0) return Response.json({ offices: [] })

  const [{ data: profiles, error: profilesError }, { data: authUsers, error: authError }] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, full_name, role, office_id, account_status')
      .in('office_id', officeIds),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])
  if (profilesError) {
    return Response.json({ error: managementDatabaseError(profilesError, 'office_members_lookup_failed') }, { status: 500 })
  }
  if (authError) {
    return Response.json({ error: managementDatabaseError(authError, 'service_role_key_invalid') }, { status: 500 })
  }

  const profileGroups = new Map<string, typeof profiles>()
  for (const profile of profiles) {
    if (!profile.office_id) continue
    const members = profileGroups.get(profile.office_id) ?? []
    members.push(profile)
    profileGroups.set(profile.office_id, members)
  }
  const authById = new Map(authUsers.users.map((authUser) => [authUser.id, authUser]))

  return Response.json({
    offices: offices.map((office) => {
      const members = profileGroups.get(office.id) ?? []
      const manager = members.find((member) => member.role === 'office_manager')
      return {
        ...office,
        managerUserId: manager?.id ?? null,
        managerName: manager?.full_name ?? null,
        managerEmail: manager ? authById.get(manager.id)?.email ?? null : null,
        employeeCount: members.filter((member) => member.role === 'storekeeper').length,
      }
    }),
  })
}

export async function POST(request: Request) {
  const result = await getManagementContext()
  if ('response' in result) return result.response
  if (result.context.actor.role !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (!isRecord(body)) return Response.json({ error: 'invalid_request' }, { status: 400 })

  const draft = readOfficeDraft(body)
  if (!draft) return Response.json({ error: 'invalid_office_details' }, { status: 400 })

  const { data: office, error } = await result.context.adminClient
    .from('offices')
    .insert(draft)
    .select('id, name, code, address, phone, email, status, created_at, updated_at')
    .single()
  if (error) {
    if (error.code !== '23505') {
      return Response.json({ error: managementDatabaseError(error, 'office_create_failed') }, { status: 500 })
    }
    const status = error.code === '23505' ? 409 : 500
    return Response.json({ error: status === 409 ? 'office_code_already_exists' : 'office_create_failed' }, { status })
  }

  return Response.json({
    office: {
      ...office,
      managerUserId: null,
      managerName: null,
      managerEmail: null,
      employeeCount: 0,
    },
  }, { status: 201 })
}

export async function PATCH(request: Request) {
  const result = await getManagementContext()
  if ('response' in result) return result.response
  if (result.context.actor.role !== 'admin') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (!isRecord(body) || typeof body.id !== 'string') {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  const draft = readOfficeDraft(body)
  if (!draft) return Response.json({ error: 'invalid_office_details' }, { status: 400 })

  const { data: office, error } = await result.context.adminClient
    .from('offices')
    .update({ ...draft, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('id, name, code, address, phone, email, status, created_at, updated_at')
    .maybeSingle()
  if (error) {
    if (error.code !== '23505') {
      return Response.json({ error: managementDatabaseError(error, 'office_update_failed') }, { status: 500 })
    }
    const status = error.code === '23505' ? 409 : 500
    return Response.json({ error: status === 409 ? 'office_code_already_exists' : 'office_update_failed' }, { status })
  }
  if (!office) return Response.json({ error: 'office_not_found' }, { status: 404 })

  const { data: members, error: membersError } = await result.context.adminClient
    .from('profiles')
    .select('id, full_name, role, office_id')
    .eq('office_id', office.id)
  if (membersError) {
    return Response.json({ error: managementDatabaseError(membersError, 'office_members_lookup_failed') }, { status: 500 })
  }
  const manager = members.find((member) => member.role === 'office_manager')

  return Response.json({
    office: {
      ...office,
      managerUserId: manager?.id ?? null,
      managerName: manager?.full_name ?? null,
      managerEmail: null,
      employeeCount: members.filter((member) => member.role === 'storekeeper').length,
    },
  })
}
