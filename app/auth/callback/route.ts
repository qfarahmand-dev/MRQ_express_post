import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

function redirectWithoutCaching(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url))
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return redirectWithoutCaching(request, '/login?error=invalid_link')
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return redirectWithoutCaching(request, '/login?error=invalid_link')
  }

  return redirectWithoutCaching(request, '/dashboard')
}
