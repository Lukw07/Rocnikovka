import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[Homeworks API] Session:', session?.user?.id)
    
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
    console.log('[Homeworks API] User token exists:', !!user?.bakalariToken)
    
    if (!user?.bakalariToken) {
      return NextResponse.json(
        { success: false, error: 'Chybí Bakaláři access token' },
        { status: 401 }
      )
    }

    // Get date range from query params (default: today to 14 days ahead)
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    // Default: today to 14 days ahead
    const today = new Date()
    const defaultFrom = today.toISOString().split('T')[0]
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 14)
    const defaultTo = futureDate.toISOString().split('T')[0]
    
    const fromDate = from || defaultFrom
    const toDate = to || defaultTo

    // Fetch homeworks data from Bakaláři API (prefer school domain like https://spsul.bakalari.cz)
    const bakalariUrl = process.env.BAKALARI_URL || process.env.BAKALARI_API_URL || 'https://spsul.bakalari.cz'
    const safeFrom = String(fromDate)
    const safeTo = String(toDate)
    const endpoint = `${bakalariUrl.replace(/\/$/, '')}/api/3/homeworks?from=${encodeURIComponent(safeFrom)}&to=${encodeURIComponent(safeTo)}`
    
    console.log('[Homeworks API] Fetching from:', endpoint)
    console.log('[Homeworks API] Date range:', { from: safeFrom, to: safeTo })
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.bakalariToken}`,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Accept-Language': 'cs-CZ,cs;q=0.9',
        // Some Bakaláři deployments are sensitive to Host header
        'Host': new URL(bakalariUrl).host,
      }
    })

    console.log('[Homeworks API] Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Homeworks API] Bakaláři API error:', response.status, errorText)
      
      // Provide more specific error messages
      let errorMessage = 'Chyba při načítání úkolů z Bakalářů'
      if (response.status === 401) {
        errorMessage = 'Neplatný nebo expirovaný Bakaláři token. Prosím, přihlaste se znovu.'
      } else if (response.status === 404) {
        errorMessage = 'Endpoint pro úkoly nebyl nalezen v Bakalářích'
      } else if (response.status >= 500) {
        errorMessage = 'Bakaláři server je dočasně nedostupný'
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log('[Homeworks API] Successfully fetched homeworks data')

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('[Homeworks API] Error fetching homeworks:', error)
    console.error('[Homeworks API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[Homeworks API] Error message:', error instanceof Error ? error.message : String(error))
    
    // Provide better error information
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNetworkError ? 'Nepodařilo se připojit k Bakalářům. Zkontrolujte připojení k internetu.' : 'Chyba při načítání úkolů z Bakalářů',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}
