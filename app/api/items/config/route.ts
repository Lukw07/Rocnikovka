import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { UserRole } from '@/app/lib/generated'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pouze operátor nebo učitel
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.OPERATOR && userRole !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { itemId, maxPerUser, isSinglePurchase } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    // Validace vstupů
    if (typeof maxPerUser !== 'number' || maxPerUser < 1) {
      return NextResponse.json({ error: 'maxPerUser must be a positive number' }, { status: 400 })
    }

    if (typeof isSinglePurchase !== 'boolean') {
      return NextResponse.json({ error: 'isSinglePurchase must be a boolean' }, { status: 400 })
    }

    // Aktualizuj item konfiguraci
    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        purchaseConfig: {
          maxPerUser,
          isSinglePurchase,
        },
      },
    })

    return NextResponse.json({
      success: true,
      item,
    })
  } catch (error) {
    console.error('Error updating item config:', error)
    return NextResponse.json(
      { error: 'Failed to update item configuration' },
      { status: 500 }
    )
  }
}
