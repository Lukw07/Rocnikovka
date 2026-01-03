import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

/**
 * GET /api/marketplace
 * Získá aktivní marketplace listings s filtrováním
 * 
 * Query params:
 * - itemId?: string (filtr podle itemu)
 * - rarity?: ItemRarity (filtr podle rarity)
 * - minPrice?: number
 * - maxPrice?: number
 * - sortBy?: 'price' | 'date' | 'popular'
 * - sortOrder?: 'asc' | 'desc'
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const itemId = searchParams.get('itemId');
    const rarity = searchParams.get('rarity');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      status: 'ACTIVE',
      // Pouze nezexpirované nebo bez expirace
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (itemId) where.itemId = itemId;
    if (minPrice) where.pricePerUnit = { ...where.pricePerUnit, gte: parseInt(minPrice) };
    if (maxPrice) where.pricePerUnit = { ...where.pricePerUnit, lte: parseInt(maxPrice) };

    // Sorting
    const orderBy: any = {};
    if (sortBy === 'price') orderBy.pricePerUnit = sortOrder;
    else if (sortBy === 'popular') orderBy.views = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    // Fetch items for all listings
    const itemIds = listings.map(l => l.itemId);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        rarity: true,
        type: true,
      },
    });

    // Merge listings with items
    const itemMap = new Map(items.map(item => [item.id, item]));
    const listingsWithItems = listings.map(listing => ({
      ...listing,
      item: itemMap.get(listing.itemId),
    }));

    // Filtr podle rarity (nutné dělat po query, protože je nested)
    let filteredListings = listingsWithItems;
    if (rarity) {
      filteredListings = listingsWithItems.filter((l: any) => l.item?.rarity === rarity);
    }

    return NextResponse.json({
      listings: filteredListings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace
 * Vytvoří novou marketplace listing
 * 
 * Body:
 * - itemId: string
 * - quantity: number
 * - pricePerUnit: number
 * - gemPrice?: number
 * - title?: string
 * - description?: string
 * - expiresAt?: string (ISO date)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      itemId,
      quantity,
      pricePerUnit,
      gemPrice = 0,
      title,
      description,
      expiresAt,
    } = body;

    // Validace
    if (!itemId || !quantity || !pricePerUnit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity <= 0 || pricePerUnit <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity or price' },
        { status: 400 }
      );
    }

    // Ověřit vlastnictví itemu
    const inventoryItem = await prisma.userInventory.findFirst({
      where: {
        userId: user.id,
        itemId,
      },
      include: {
        item: true,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    if (inventoryItem.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity in inventory' },
        { status: 400 }
      );
    }

    if (!inventoryItem.item.isTradeable) {
      return NextResponse.json(
        { error: 'This item cannot be traded' },
        { status: 400 }
      );
    }

    // Vytvořit listing v transakci
    const listing = await prisma.$transaction(async (tx) => {
      // Odečíst z inventáře (zamknout do marketplace)
      await tx.userInventory.update({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // Vytvořit listing
      const newListing = await tx.marketplaceListing.create({
        data: {
          sellerId: user.id,
          itemId,
          quantity,
          pricePerUnit,
          originalPrice: pricePerUnit, // Store original price at creation time
          gemPrice,
          title,
          description,
          status: 'ACTIVE',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      listing,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
