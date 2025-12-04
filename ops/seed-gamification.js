const { PrismaClient } = require('../app/lib/generated');

const prisma = new PrismaClient();

async function seedGamification() {
  console.log('🎮 Seeding gamification data...');

  try {
    // Items
    console.log('🛍️ Creating items...');
    const items = [
      {
        name: 'Wooden Sword',
        description: 'A basic practice sword.',
        price: 50,
        rarity: 'COMMON',
        type: 'COSMETIC',
        imageUrl: '/images/items/wooden-sword.png'
      },
      {
        name: 'Iron Shield',
        description: 'Provides basic protection.',
        price: 150,
        rarity: 'UNCOMMON',
        type: 'COSMETIC',
        imageUrl: '/images/items/iron-shield.png'
      },
      {
        name: 'XP Boost (1h)',
        description: 'Double XP for 1 hour.',
        price: 500,
        rarity: 'RARE',
        type: 'BOOST',
        imageUrl: '/images/items/xp-boost.png'
      },
      {
        name: 'Golden Apple',
        description: 'A shiny collectible.',
        price: 1000,
        rarity: 'EPIC',
        type: 'COLLECTIBLE',
        imageUrl: '/images/items/golden-apple.png'
      }
    ];

    for (const item of items) {
      await prisma.item.create({
        data: item
      });
    }
    console.log(`✅ Created ${items.length} items`);

    // Achievements
    console.log('🏆 Creating achievements...');
    const achievements = [
      {
        name: 'First Steps',
        description: 'Log in for the first time.',
        criteria: 'login_count >= 1',
        badgeUrl: '/images/badges/first-steps.png'
      },
      {
        name: 'Big Spender',
        description: 'Spend 1000 coins in the shop.',
        criteria: 'coins_spent >= 1000',
        badgeUrl: '/images/badges/big-spender.png'
      },
      {
        name: 'Top of the Class',
        description: 'Reach level 10.',
        criteria: 'level >= 10',
        badgeUrl: '/images/badges/level-10.png'
      }
    ];

    for (const achievement of achievements) {
      await prisma.achievement.create({
        data: achievement
      });
    }
    console.log(`✅ Created ${achievements.length} achievements`);

    // Events
    console.log('📅 Creating events...');
    const events = [
      {
        title: 'Exam Week',
        description: 'Double XP for all homeworks!',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        xpBonus: 100,
        isActive: true
      }
    ];

    for (const event of events) {
      await prisma.event.create({
        data: event
      });
    }
    console.log(`✅ Created ${events.length} events`);

  } catch (error) {
    console.error('❌ Error seeding gamification data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedGamification();