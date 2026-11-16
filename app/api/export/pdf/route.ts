import { getManagementContext } from '@/lib/server/management-context'
import { generatePdfExport, getExportFilename } from '@/lib/exports/pdf'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const result = await getManagementContext()
  if ('response' in result) return result.response

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as any
  const officeId = searchParams.get('office_id') || undefined
  const startDate = searchParams.get('start_date') || undefined
  const endDate = searchParams.get('end_date') || undefined

  if (!type) {
    return Response.json({ error: 'missing_type' }, { status: 400 })
  }

  const validTypes = ['shipments', 'warehouse-operations', 'office-operations', 'transfers', 'issues', 'audit-logs', 'financial', 'notifications']
  if (!validTypes.includes(type)) {
    return Response.json({ error: 'invalid_type' }, { status: 400 })
  }

  try {
    const buffer = await generatePdfExport({
      type,
      officeId,
      startDate,
      endDate,
    })

    const filename = getExportFilename(type, { officeId, startDate, endDate })

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    return Response.json({ error: 'export_failed' }, { status: 500 })
  }
}
