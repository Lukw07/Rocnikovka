import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[Absence API] Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Neautorizováno' },
        { status: 401 }
      )
    }

    // Get Bakaláři access token from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bakalariToken: true }
    })
    console.log('[Absence API] User token exists:', !!user?.bakalariToken)
    
    if (!user?.bakalariToken) {
      return NextResponse.json(
        { success: false, error: 'Chybí Bakaláři access token' },
        { status: 401 }
      )
    }

    // Fetch absence data from Bakaláři API (prefer school domain like https://spsul.bakalari.cz)
    const bakalariUrl = process.env.BAKALARI_URL || process.env.BAKALARI_API_URL || 'https://spsul.bakalari.cz'
    const endpoint = `${bakalariUrl.replace(/\/$/, '')}/api/3/absence/student`
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.bakalariToken}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Accept-Language': 'cs-CZ,cs;q=0.9',
        'Host': new URL(bakalariUrl).host,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
  console.error('Bakaláři absence API error:', response.status, errorText)
      return NextResponse.json(
        { success: false, error: 'Chyba při načítání absence z Bakalářů' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('[Absence API] Error fetching absence:', error)
    console.error('[Absence API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[Absence API] Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, error: 'Interní chyba serveru', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
