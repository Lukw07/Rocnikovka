import { NextRequest, NextResponse } from "next/server"
import { ItemsService } from "@/app/lib/services/items"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { withValidation } from "@/app/lib/validation/validator"
import { createItemSchema, CreateItemRequest } from "./schema"

export async function GET(request: NextRequest) {
  try {
    const items = await ItemsService.getAllItems()
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Items GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== UserRole.OPERATOR && session.user.role !== UserRole.TEACHER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = request.headers.get('x-request-id') || undefined
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createItemSchema.parse(body)
    
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const itemData = {
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      rarity: validatedData.rarity,
      type: validatedData.type,
      ...(validatedData.imageUrl && { imageUrl: validatedData.imageUrl }),
      isPurchasable: validatedData.isPurchasable
    }
    
    const item = await ItemsService.createItem(itemData)
    
    return NextResponse.json({ 
      ok: true,
      data: { item },
      requestId 
    }, { status: 201 })
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || undefined
    console.error("API Error:", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({
      ok: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: "Internal server error",
      requestId
    }, { status: 500 })
  }
}
