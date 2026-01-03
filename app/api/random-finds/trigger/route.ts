import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import { ItemRarity, Item } from '@/app/lib/generated';

/**
 * POST /api/random-finds/trigger
 * Spustí náhodný nález (pokud je dostupný)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Zkontrolovat cooldown
    const cooldown = await prisma.randomFindCooldown.findUnique({
      where: { userId: user.id },
    });

    if (cooldown) {
      if (cooldown.nextAvailableAt > now) {
        return NextResponse.json(
          { error: 'Find is on cooldown' },
          { status: 400 }
        );
      }

      if (cooldown.findsToday >= cooldown.dailyLimit) {
        return NextResponse.json(
          { error: 'Daily limit reached' },
          { status: 400 }
        );
      }
    }

    // Určit raritní random item
    const rarity = determineRarity();
    
    // Najít náhodný item z této rarity
    const items = await prisma.item.findMany({
      where: {
        rarity,
        isActive: true,
        isTradeable: true,
      },
    });

    let selectedItem: Item | undefined;
    let goldReward = 0;
    let gemsReward = 0;

    if (items.length > 0 && Math.random() < 0.7) {
      // 70% šance na item
      selectedItem = items[Math.floor(Math.random() * items.length)];
    } else {
      // 30% šance na peníze
      goldReward = calculateGoldReward(rarity);
      if (rarity === 'LEGENDARY' || rarity === 'EPIC') {
        gemsReward = Math.floor(Math.random() * 3) + 1; // 1-3 gems
      }
    }

    // Provést nález
    const result = await prisma.$transaction(async (tx) => {
      // Vytvořit random find záznam
      const find = await tx.randomFind.create({
        data: {
          userId: user.id,
          itemId: selectedItem?.id,
          name: selectedItem?.name || 'Gold & Gems',
          rarity,
          value: goldReward + (gemsReward * 10),
        },
      });

      // Pokud byl nalezen item, přidat do inventáře
      if (selectedItem) {
        await tx.userInventory.upsert({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: selectedItem.id,
            },
          },
          create: {
            userId: user.id,
            itemId: selectedItem.id,
            quantity: 1,
          },
          update: {
            quantity: { increment: 1 },
          },
        });
      }

      // Přidat peníze
      if (goldReward > 0 || gemsReward > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            gold: { increment: goldReward },
            gems: { increment: gemsReward },
          },
        });

        await tx.moneyTx.create({
          data: {
            userId: user.id,
            amount: goldReward,
            type: 'EARNED',
            reason: 'Random find',
          },
        });
      }

      // Aktualizovat/vytvořit cooldown
      const nextAvailable = new Date(now.getTime() + getRandomCooldown());
      
      await tx.randomFindCooldown.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          lastFindAt: now,
          nextAvailableAt: nextAvailable,
          findsToday: 1,
          dailyLimit: 5,
        },
        update: {
          lastFindAt: now,
          nextAvailableAt: nextAvailable,
          findsToday: { increment: 1 },
        },
      });

      // Notifikace
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: '✨ Náhodný nález!',
          message: selectedItem 
            ? `Našel jsi ${getRarityEmoji(rarity)} ${selectedItem.name}!`
            : `Našel jsi ${goldReward} gold${gemsReward > 0 ? ` a ${gemsReward} gems` : ''}!`,
          data: {
            findId: find.id,
            itemId: selectedItem?.id,
            goldReward,
            gemsReward,
            rarity,
          },
        },
      });

      return { find, item: selectedItem, goldReward, gemsReward };
    });

    return NextResponse.json({
      success: true,
      find: result.find,
      item: result.item,
      rewards: {
        gold: result.goldReward,
        gems: result.gemsReward,
      },
      rarity,
    });
  } catch (error) {
    console.error('Error triggering random find:', error);
    return NextResponse.json(
      { error: 'Failed to trigger find' },
      { status: 500 }
    );
  }
}

/**
 * Určí raritu nálezu podle pravděpodobnosti
 */
function determineRarity(): ItemRarity {
  const rand = Math.random();
  
  if (rand < 0.50) return 'COMMON';      // 50%
  if (rand < 0.75) return 'UNCOMMON';    // 25%
  if (rand < 0.90) return 'RARE';        // 15%
  if (rand < 0.97) return 'EPIC';        // 7%
  return 'LEGENDARY';                     // 3%
}

/**
 * Vypočítá gold reward podle rarity
 */
function calculateGoldReward(rarity: ItemRarity): number {
  const rewards: Record<ItemRarity, [number, number]> = {
    COMMON: [10, 30],
    UNCOMMON: [30, 70],
    RARE: [70, 150],
    EPIC: [150, 300],
    LEGENDARY: [300, 500],
  };
  
  const [min, max] = rewards[rarity];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Vrátí náhodný cooldown mezi nálezy (15-45 minut)
 */
function getRandomCooldown(): number {
  const minMinutes = 15;
  const maxMinutes = 45;
  const minutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  return minutes * 60 * 1000; // ms
}

/**
 * Emoji podle rarity
 */
function getRarityEmoji(rarity: ItemRarity): string {
  const emojis = {
    COMMON: '⚪',
    UNCOMMON: '🟢',
    RARE: '🔵',
    EPIC: '🟣',
    LEGENDARY: '🟡',
  };
  return emojis[rarity];
}
