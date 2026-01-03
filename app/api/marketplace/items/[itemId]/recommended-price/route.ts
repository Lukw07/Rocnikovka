/**
 * Dynamic Price Recommendation API
 * GET /api/marketplace/items/[itemId]/recommended-price
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  COMMON: 1.0,
  UNCOMMON: 2.0,
  RARE: 4.0,
  EPIC: 8.0,
  LEGENDARY: 16.0,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    // Získat item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        price: true,
        rarity: true,
        imageUrl: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Získat market demand
    let demand = await prisma.marketDemand.findUnique({
      where: { itemId },
    });

    // Pokud demand neexistuje, vytvořit
    if (!demand) {
      demand = await prisma.marketDemand.create({
        data: {
          itemId,
          recommendedPrice: item.price,
          currentAvgPrice: item.price,
          lowestPrice: item.price,
          highestPrice: item.price,
        },
      });
    }

    const basePrice = item.price;
    const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity] || 1.0;

    // Supply & Demand calculation
    const supply = demand.totalListings;
    const sales24h = demand.totalSales24h;
    const views24h = demand.totalViews24h;
    const watchlistCount = demand.watchlistCount;

    // Výpočet demand multiplier (0.5 - 2.0)
    let demandMultiplier = 1.0;

    // Vysoká poptávka = vyšší cena
    if (sales24h > 10) demandMultiplier += 0.3;
    if (sales24h > 20) demandMultiplier += 0.3;
    if (views24h > 50) demandMultiplier += 0.2;
    if (watchlistCount > 10) demandMultiplier += 0.2;

    // Vysoká nabídka = nižší cena
    if (supply > 20) demandMultiplier -= 0.2;
    if (supply > 50) demandMultiplier -= 0.3;

    // Omezení multiplier na rozumné meze
    demandMultiplier = Math.max(0.5, Math.min(2.0, demandMultiplier));

    // Popularity score (0-100)
    const popularityScore = Math.min(
      100,
      Math.floor(
        (sales24h * 2) + 
        (views24h * 0.5) + 
        (watchlistCount * 3) - 
        (supply * 0.5)
      )
    );

    // Trend detection
    let trend = 'STABLE';
    if (demand.priceChange24h > 10) trend = 'RISING';
    else if (demand.priceChange24h < -10) trend = 'FALLING';
    else if (Math.abs(demand.priceChange24h) > 5) trend = 'VOLATILE';

    // Finální doporučená cena
    const recommendedPrice = Math.floor(
      basePrice * rarityMultiplier * demandMultiplier
    );

    // Cenové rozmezí
    const minRecommended = Math.floor(recommendedPrice * 0.8);
    const maxRecommended = Math.floor(recommendedPrice * 1.2);

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        basePrice: item.price,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
      },
      pricing: {
        recommendedPrice,
        minRecommended,
        maxRecommended,
        currentAvgPrice: demand.currentAvgPrice,
        lowestListing: demand.lowestPrice,
        highestListing: demand.highestPrice,
      },
      market: {
        demandMultiplier,
        rarityMultiplier,
        popularityScore,
        trend,
        priceChange24h: demand.priceChange24h,
      },
      stats: {
        supply: demand.totalListings,
        sales24h: demand.totalSales24h,
        sales7d: demand.totalSales7d,
        views24h: demand.totalViews24h,
        watchlistCount: demand.watchlistCount,
      },
      advice: generatePricingAdvice(trend, demandMultiplier, popularityScore),
    });
  } catch (error) {
    console.error('Error calculating recommended price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate recommended price' },
      { status: 500 }
    );
  }
}

function generatePricingAdvice(trend: string, multiplier: number, popularity: number): string {
  if (trend === 'RISING' && multiplier > 1.3) {
    return 'High demand! You can price above recommended.';
  }
  if (trend === 'FALLING' && multiplier < 0.8) {
    return 'Low demand. Consider pricing below average to sell faster.';
  }
  if (popularity > 80) {
    return 'Very popular item! Quick sale expected at recommended price.';
  }
  if (multiplier > 1.5) {
    return 'Market is hot! Premium pricing recommended.';
  }
  if (multiplier < 0.7) {
    return 'Oversupplied market. Lower price for faster sale.';
  }
  return 'Market is stable. Recommended price should work well.';
}
