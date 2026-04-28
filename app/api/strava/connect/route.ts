import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizeUrl } from '@/lib/strava/oauth'

/**
 * GET /api/strava/connect?userId=xxx
 * Strava認可URLにリダイレクト
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/strava/callback`
  const url = buildAuthorizeUrl(userId, redirectUri)

  return NextResponse.redirect(url)
}
