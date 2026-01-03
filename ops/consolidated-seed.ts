/**
 * ============================================================================
 * CONSOLIDATED SEED FILE
 * ============================================================================
 * 
 * Tento soubor konsoliduje všechny seed scripty do jednoho místa.
 * Sloučeny seed soubory:
 * - seed-achievements.ts
 * - seed-core-attributes.ts
 * - seed-economy.ts
 * - seed-friend-quests.ts
 * - seed-friends.ts
 * - seed-gamification-complete.ts
 * - seed-guilds.ts
 * - seed-job-categories.ts
 * - seed-marketplace.ts
 * - seed-skills.ts
 * - seed-trading.ts
 * 
 * Spuštění: npx tsx ops/consolidated-seed.ts
 * Nebo importuj jednotlivé funkce podle potřeby
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function clearDatabase() {
  console.log('🗑️  Clearing existing seed data...')
  
  // Smazat v pořadí závislostí
  await prisma.achievement.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.jobCategory.deleteMany()
  await prisma.item.deleteMany()
  await prisma.marketplaceListing.deleteMany()
  await prisma.quest.deleteMany()
  await prisma.guild.deleteMany()
  
  console.log('✅ Database cleared')
}

// ============================================================================
// SECTION 1: ACHIEVEMENTS
// ============================================================================

async function seedAchievements() {
  console.log('🎯 Seeding achievements...')

  const levelAchievements = [
    {
      name: 'First Steps',
      description: 'Dosáhni levelu 1',
      type: 'NORMAL',
      category: 'LEVEL',
      icon: '🌱',
      color: '#10b981',
      rarity: 'COMMON',
      target: 1,
      xpReward: 0,
      skillpointsReward: 0,
      reputationReward: 0,
      moneyReward: 0,
      sortOrder: 1
    },
    {
      name: 'Beginner Scholar',
      description: 'Dosáhni levelu 5',
      type: 'NORMAL',
      category: 'LEVEL',
      icon: '📚',
      color: '#3b82f6',
      rarity: 'COMMON',
      target: 5,
      xpReward: 100,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 2
    },
    {
      name: 'Intermediate Student',
      description: 'Dosáhni levelu 10',
      type: 'NORMAL',
      category: 'LEVEL',
      icon: '🎓',
      color: '#8b5cf6',
      rarity: 'UNCOMMON',
      target: 10,
      xpReward: 200,
      skillpointsReward: 2,
      reputationReward: 25,
      moneyReward: 100,
      sortOrder: 3
    },
    {
      name: 'Advanced Scholar',
      description: 'Dosáhni levelu 25',
      type: 'NORMAL',
      category: 'LEVEL',
      icon: '📜',
      color: '#ec4899',
      rarity: 'RARE',
      target: 25,
      xpReward: 500,
      skillpointsReward: 5,
      reputationReward: 50,
      moneyReward: 250,
      sortOrder: 4
    },
    {
      name: 'Master of Knowledge',
      description: 'Dosáhni levelu 50',
      type: 'NORMAL',
      category: 'LEVEL',
      icon: '👑',
      color: '#f59e0b',
      rarity: 'EPIC',
      target: 50,
      xpReward: 1000,
      skillpointsReward: 10,
      reputationReward: 100,
      moneyReward: 500,
      sortOrder: 5
    }
  ]

  const questAchievements = [
    {
      name: 'Quest Beginner',
      description: 'Dokončit první quest',
      type: 'NORMAL',
      category: 'QUEST',
      icon: '✅',
      color: '#10b981',
      rarity: 'COMMON',
      target: 1,
      xpReward: 50,
      skillpointsReward: 1,
      reputationReward: 5,
      moneyReward: 25,
      sortOrder: 10
    },
    {
      name: 'Quest Hunter',
      description: 'Dokončit 10 questů',
      type: 'NORMAL',
      category: 'QUEST',
      icon: '🎯',
      color: '#3b82f6',
      rarity: 'UNCOMMON',
      target: 10,
      xpReward: 150,
      skillpointsReward: 2,
      reputationReward: 15,
      moneyReward: 75,
      sortOrder: 11
    },
    {
      name: 'Quest Master',
      description: 'Dokončit 50 questů',
      type: 'NORMAL',
      category: 'QUEST',
      icon: '⭐',
      color: '#8b5cf6',
      rarity: 'RARE',
      target: 50,
      xpReward: 500,
      skillpointsReward: 5,
      reputationReward: 50,
      moneyReward: 250,
      sortOrder: 12
    }
  ]

  const streakAchievements = [
    {
      name: 'Consistency Rookie',
      description: 'Udrž 7denní streak',
      type: 'NORMAL',
      category: 'STREAK',
      icon: '🔥',
      color: '#ef4444',
      rarity: 'COMMON',
      target: 7,
      xpReward: 100,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 20
    },
    {
      name: 'Consistency Pro',
      description: 'Udrž 30denní streak',
      type: 'NORMAL',
      category: 'STREAK',
      icon: '🔥',
      color: '#f97316',
      rarity: 'RARE',
      target: 30,
      xpReward: 300,
      skillpointsReward: 3,
      reputationReward: 30,
      moneyReward: 150,
      sortOrder: 21
    }
  ]

  await prisma.achievement.createMany({
    data: [...levelAchievements, ...questAchievements, ...streakAchievements],
    skipDuplicates: true
  })

  console.log(`✅ Created ${levelAchievements.length + questAchievements.length + streakAchievements.length} achievements`)
}

// ============================================================================
// SECTION 2: CORE ATTRIBUTES (SKILLS)
// ============================================================================

async function seedCoreAttributes() {
  console.log('💪 Seeding core attributes...')

  const coreAttributes = [
    {
      name: "Time Management",
      description: "Master the art of time management. Each level increases XP gain by 2%.",
      category: "Core",
      icon: "⏰",
      maxLevel: 10,
      unlockLevel: 0,
      isCoreAttribute: true
    },
    {
      name: "Focus",
      description: "Sharpen your focus. Each level increases skill learning speed by 3%.",
      category: "Core",
      icon: "🎯",
      maxLevel: 10,
      unlockLevel: 0,
      isCoreAttribute: true
    },
    {
      name: "Leadership",
      description: "Become a leader. Each level increases job rewards by 2%.",
      category: "Core",
      icon: "👑",
      maxLevel: 10,
      unlockLevel: 0,
      isCoreAttribute: true
    },
    {
      name: "Communication",
      description: "Master communication. Each level increases reputation gains by 2%.",
      category: "Core",
      icon: "💬",
      maxLevel: 10,
      unlockLevel: 0,
      isCoreAttribute: true
    },
    {
      name: "Consistency",
      description: "Build consistency. Each level increases streak bonuses by 5%.",
      category: "Core",
      icon: "🔄",
      maxLevel: 10,
      unlockLevel: 0,
      isCoreAttribute: true
    }
  ]

  for (const attr of coreAttributes) {
    await prisma.skill.upsert({
      where: { name: attr.name },
      update: attr,
      create: attr
    })
  }

  console.log(`✅ Created ${coreAttributes.length} core attributes`)
}

// ============================================================================
// SECTION 3: REGULAR SKILLS
// ============================================================================

async function seedSkills() {
  console.log('🎓 Seeding skills...')

  const skills = [
    // Programming Skills
    { name: "JavaScript", category: "Programming", icon: "🟨", maxLevel: 100, unlockLevel: 0 },
    { name: "TypeScript", category: "Programming", icon: "🔷", maxLevel: 100, unlockLevel: 5 },
    { name: "Python", category: "Programming", icon: "🐍", maxLevel: 100, unlockLevel: 0 },
    { name: "Java", category: "Programming", icon: "☕", maxLevel: 100, unlockLevel: 3 },
    { name: "React", category: "Programming", icon: "⚛️", maxLevel: 100, unlockLevel: 10 },
    
    // Math Skills
    { name: "Algebra", category: "Math", icon: "🔢", maxLevel: 100, unlockLevel: 0 },
    { name: "Geometry", category: "Math", icon: "📐", maxLevel: 100, unlockLevel: 0 },
    { name: "Calculus", category: "Math", icon: "∫", maxLevel: 100, unlockLevel: 15 },
    { name: "Statistics", category: "Math", icon: "📊", maxLevel: 100, unlockLevel: 10 },
    
    // Science Skills
    { name: "Physics", category: "Science", icon: "⚛️", maxLevel: 100, unlockLevel: 0 },
    { name: "Chemistry", category: "Science", icon: "🧪", maxLevel: 100, unlockLevel: 0 },
    { name: "Biology", category: "Science", icon: "🧬", maxLevel: 100, unlockLevel: 0 },
    
    // Language Skills
    { name: "English", category: "Languages", icon: "🇬🇧", maxLevel: 100, unlockLevel: 0 },
    { name: "Czech", category: "Languages", icon: "🇨🇿", maxLevel: 100, unlockLevel: 0 },
    { name: "German", category: "Languages", icon: "🇩🇪", maxLevel: 100, unlockLevel: 5 },
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: skill,
      create: { ...skill, description: `Master ${skill.name}` }
    })
  }

  console.log(`✅ Created ${skills.length} skills`)
}

// ============================================================================
// SECTION 4: JOB CATEGORIES
// ============================================================================

async function seedJobCategories() {
  console.log('💼 Seeding job categories...')

  const jobCategories = [
    {
      name: "Frontend Development",
      description: "Work on user interfaces and web design",
      icon: "🎨",
      baseReward: 100,
      reputationReward: 10,
      requiredLevel: 0
    },
    {
      name: "Backend Development",
      description: "Build server-side logic and databases",
      icon: "⚙️",
      baseReward: 120,
      reputationReward: 12,
      requiredLevel: 5
    },
    {
      name: "Data Science",
      description: "Analyze data and build ML models",
      icon: "📊",
      baseReward: 150,
      reputationReward: 15,
      requiredLevel: 10
    },
    {
      name: "Teaching Assistant",
      description: "Help other students learn",
      icon: "👨‍🏫",
      baseReward: 80,
      reputationReward: 20,
      requiredLevel: 0
    },
    {
      name: "Research",
      description: "Conduct research projects",
      icon: "🔬",
      baseReward: 130,
      reputationReward: 18,
      requiredLevel: 8
    }
  ]

  for (const category of jobCategories) {
    await prisma.jobCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category
    })
  }

  console.log(`✅ Created ${jobCategories.length} job categories`)
}

// ============================================================================
// SECTION 5: ECONOMY (ITEMS)
// ============================================================================

async function seedEconomy() {
  console.log('💰 Seeding economy...')

  // Update starter currency for users with 0
  const updatedUsers = await prisma.user.updateMany({
    where: {
      gold: 0,
      gems: 0,
    },
    data: {
      gold: 500,
      gems: 10,
    },
  })
  console.log(`✅ Updated ${updatedUsers.count} users with starter currency`)

  const items = [
    // COSMETIC Items
    {
      name: "Golden Frame",
      description: "Luxusní zlatý rámeček pro profilový obrázek",
      price: 500,
      rarity: 'RARE',
      type: 'COSMETIC',
      category: "frame",
      isTradeable: true,
    },
    {
      name: "Silver Frame",
      description: "Elegantní stříbrný rámeček",
      price: 200,
      rarity: 'UNCOMMON',
      type: 'COSMETIC',
      category: "frame",
      isTradeable: true,
    },
    {
      name: "Dragon Avatar",
      description: "Epický dračí avatar",
      price: 1500,
      rarity: 'EPIC',
      type: 'COSMETIC',
      category: "avatar",
      isTradeable: true,
    },
    
    // CONSUMABLE Items
    {
      name: "XP Potion",
      description: "Zvyšuje XP gain o 50% na 1 hodinu",
      price: 100,
      rarity: 'COMMON',
      type: 'CONSUMABLE',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Lucky Charm",
      description: "Zvyšuje šanci na rare items o 25%",
      price: 250,
      rarity: 'UNCOMMON',
      type: 'CONSUMABLE',
      category: "buff",
      isTradeable: true,
    },
    
    // MATERIAL Items
    {
      name: "Leather",
      description: "Základní crafting materiál",
      price: 10,
      rarity: 'COMMON',
      type: 'MATERIAL',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Gold Ore",
      description: "Cenný crafting materiál",
      price: 50,
      rarity: 'RARE',
      type: 'MATERIAL',
      category: "resource",
      isTradeable: true,
    },
    
    // SPECIAL Items
    {
      name: "Mystery Box",
      description: "Obsahuje náhodný item",
      price: 300,
      rarity: 'RARE',
      type: 'SPECIAL',
      category: "lootbox",
      isTradeable: false,
    }
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: item,
      create: item
    })
  }

  console.log(`✅ Created ${items.length} items`)
}

// ============================================================================
// SECTION 6: QUESTS
// ============================================================================

async function seedQuests() {
  console.log('📋 Seeding quests...')

  const quests = [
    {
      title: "Matematický Maraton",
      description: "Vyřešte 10 matematických příkladů z algebry",
      category: "Math",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 100,
      moneyReward: 50,
      createdBy: "system"
    },
    {
      title: "Vědecký Experiment",
      description: "Proveďte experiment o fotosyntéze a napište report",
      category: "Science",
      difficulty: 'MEDIUM',
      requiredLevel: 5,
      xpReward: 250,
      moneyReward: 100,
      createdBy: "system"
    },
    {
      title: "Literární Analýza",
      description: "Napište rozbor 3 klasických děl",
      category: "Literature",
      difficulty: 'HARD',
      requiredLevel: 10,
      xpReward: 500,
      moneyReward: 200,
      createdBy: "system"
    },
    {
      title: "Programovací Výzva",
      description: "Vytvořte React komponentu s TypeScriptem",
      category: "Programming",
      difficulty: 'MEDIUM',
      requiredLevel: 8,
      xpReward: 300,
      moneyReward: 150,
      createdBy: "system"
    },
    {
      title: "Historická Prezentace",
      description: "Vytvoř prezentaci o druhé světové válce",
      category: "History",
      difficulty: 'MEDIUM',
      requiredLevel: 3,
      xpReward: 200,
      moneyReward: 75,
      createdBy: "system"
    }
  ]

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { title: quest.title },
      update: quest,
      create: quest
    })
  }

  console.log(`✅ Created ${quests.length} quests`)
}

// ============================================================================
// SECTION 7: GUILDS
// ============================================================================

async function seedGuilds() {
  console.log('🏰 Seeding guilds...')

  // Note: Guilds require existing users as leaders
  // This is a basic seed - in production, you'd create guilds with real users
  
  const users = await prisma.user.findMany({ take: 3 })
  
  if (users.length === 0) {
    console.log('⚠️  No users found - skipping guild creation')
    return
  }

  const guilds = [
    {
      name: "Code Warriors",
      description: "Pro vývojáře a programátory",
      leaderId: users[0]?.id || "system",
      treasury: 1000,
      level: 1
    },
    {
      name: "Math Wizards",
      description: "Pro matematické génie",
      leaderId: users[1]?.id || users[0]?.id || "system",
      treasury: 800,
      level: 1
    },
    {
      name: "Science Squad",
      description: "Pro vědecké nadšence",
      leaderId: users[2]?.id || users[0]?.id || "system",
      treasury: 900,
      level: 1
    }
  ]

  for (const guild of guilds) {
    try {
      await prisma.guild.upsert({
        where: { name: guild.name },
        update: guild,
        create: guild
      })
    } catch (error) {
      console.log(`⚠️  Could not create guild ${guild.name}`)
    }
  }

  console.log(`✅ Guild seeding completed`)
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🌱 Starting consolidated seed...\n')
  
  try {
    // Optional: Clear existing data (commented out for safety)
    // await clearDatabase()
    
    // Seed in logical order
    await seedAchievements()
    await seedCoreAttributes()
    await seedSkills()
    await seedJobCategories()
    await seedEconomy()
    await seedQuests()
    await seedGuilds()
    
    console.log('\n✅ All seed data created successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

// Export functions for selective use
export {
  seedAchievements,
  seedCoreAttributes,
  seedSkills,
  seedJobCategories,
  seedEconomy,
  seedQuests,
  seedGuilds,
  clearDatabase
}
