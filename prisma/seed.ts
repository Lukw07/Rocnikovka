/**
 * ============================================================================
 * KOMPLETNÍ SEED SOUBOR PRO EDURPG
 * ============================================================================
 * 
 * Tento soubor obsahuje všechny seed data pro EduRPG systém v češtině.
 * Zahrnuje:
 * - Achievements (Úspěchy)
 * - Skills (Dovednosti)
 * - Job Categories (Kategorie prací)
 * - Economy (Ekonomika - itemy, marketplace)
 * - Quests (Daily, Friend, Guild, Global)
 * - Guilds (Guildy)
 * 
 * Spuštění: npx tsx prisma/seed.ts
 * ============================================================================
 */

import { PrismaClient, AchievementType, AchievementCategory, ItemType, ItemRarity, QuestDifficulty, QuestType, FriendQuestType, UserRole } from '../app/lib/generated'

const prisma = new PrismaClient()

// ============================================================================
// HELPER FUNKCE
// ============================================================================

async function clearDatabase() {
  console.log('🗑️  Mažu existující seed data...')
  
  await prisma.achievement.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.jobCategory.deleteMany()
  await prisma.item.deleteMany()
  await prisma.marketplaceListing.deleteMany()
  await prisma.quest.deleteMany()
  await prisma.friendQuest.deleteMany()
  await prisma.guild.deleteMany()
  
  console.log('✅ Databáze vyčištěna')
}

// ============================================================================
// SEKCE 1: ACHIEVEMENTS (ÚSPĚCHY)
// ============================================================================

async function seedAchievements() {
  console.log('🎯 Seeduji achievements...')

  const levelAchievements = [
    {
      name: 'První kroky',
      description: 'Dosáhni levelu 1',
      type: AchievementType.NORMAL,
      category: AchievementCategory.LEVEL,
      icon: '🌱',
      color: '#10b981',
      rarity: ItemRarity.COMMON,
      target: 1,
      xpReward: 0,
      skillpointsReward: 0,
      reputationReward: 0,
      moneyReward: 0,
      sortOrder: 1
    },
    {
      name: 'Začínající student',
      description: 'Dosáhni levelu 5',
      type: AchievementType.NORMAL,
      category: AchievementCategory.LEVEL,
      icon: '📚',
      color: '#3b82f6',
      rarity: ItemRarity.COMMON,
      target: 5,
      xpReward: 100,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 2
    },
    {
      name: 'Pokročilý žák',
      description: 'Dosáhni levelu 10',
      type: AchievementType.NORMAL,
      category: AchievementCategory.LEVEL,
      icon: '🎓',
      color: '#8b5cf6',
      rarity: ItemRarity.UNCOMMON,
      target: 10,
      xpReward: 200,
      skillpointsReward: 2,
      reputationReward: 25,
      moneyReward: 100,
      sortOrder: 3
    },
    {
      name: 'Mistr znalostí',
      description: 'Dosáhni levelu 25',
      type: AchievementType.NORMAL,
      category: AchievementCategory.LEVEL,
      icon: '📜',
      color: '#ec4899',
      rarity: ItemRarity.RARE,
      target: 25,
      xpReward: 500,
      skillpointsReward: 5,
      reputationReward: 50,
      moneyReward: 250,
      sortOrder: 4
    },
    {
      name: 'Král vědomostí',
      description: 'Dosáhni levelu 50',
      type: AchievementType.NORMAL,
      category: AchievementCategory.LEVEL,
      icon: '👑',
      color: '#f59e0b',
      rarity: ItemRarity.EPIC,
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
      name: 'Začínající questař',
      description: 'Dokončit první quest',
      type: AchievementType.NORMAL,
      category: AchievementCategory.QUEST,
      icon: '✅',
      color: '#10b981',
      rarity: ItemRarity.COMMON,
      target: 1,
      xpReward: 50,
      skillpointsReward: 1,
      reputationReward: 5,
      moneyReward: 25,
      sortOrder: 10
    },
    {
      name: 'Lovec questů',
      description: 'Dokončit 10 questů',
      type: AchievementType.NORMAL,
      category: AchievementCategory.QUEST,
      icon: '🎯',
      color: '#3b82f6',
      rarity: ItemRarity.UNCOMMON,
      target: 10,
      xpReward: 150,
      skillpointsReward: 2,
      reputationReward: 15,
      moneyReward: 75,
      sortOrder: 11
    },
    {
      name: 'Mistr questů',
      description: 'Dokončit 50 questů',
      type: AchievementType.NORMAL,
      category: AchievementCategory.QUEST,
      icon: '⭐',
      color: '#f59e0b',
      rarity: ItemRarity.EPIC,
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
      name: 'Oddaný student',
      description: '7denní série přihlášení',
      type: AchievementType.NORMAL,
      category: AchievementCategory.ACTIVITY,
      icon: '🔥',
      color: '#ef4444',
      rarity: ItemRarity.UNCOMMON,
      target: 7,
      xpReward: 200,
      skillpointsReward: 2,
      reputationReward: 20,
      moneyReward: 100,
      sortOrder: 20
    },
    {
      name: 'Neúnavný bojovník',
      description: '30denní série přihlášení',
      type: AchievementType.NORMAL,
      category: AchievementCategory.ACTIVITY,
      icon: '💪',
      color: '#f97316',
      rarity: ItemRarity.RARE,
      target: 30,
      xpReward: 1000,
      skillpointsReward: 10,
      reputationReward: 100,
      moneyReward: 500,
      sortOrder: 21
    }
  ]

  const socialAchievements = [
    {
      name: 'Sociální motýl',
      description: 'Přidej si 5 přátel',
      type: AchievementType.NORMAL,
      category: AchievementCategory.SOCIAL,
      icon: '👥',
      color: '#06b6d4',
      rarity: ItemRarity.COMMON,
      target: 5,
      xpReward: 100,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 30
    },
    {
      name: 'Týmový hráč',
      description: 'Připoj se ke guildě',
      type: AchievementType.NORMAL,
      category: AchievementCategory.SOCIAL,
      icon: '🛡️',
      color: '#8b5cf6',
      rarity: ItemRarity.UNCOMMON,
      target: 1,
      xpReward: 150,
      skillpointsReward: 2,
      reputationReward: 15,
      moneyReward: 75,
      sortOrder: 31
    }
  ]

  const allAchievements = [
    ...levelAchievements,
    ...questAchievements,
    ...streakAchievements,
    ...socialAchievements
  ]

  // Smaž existující achievementy a vytvoř nové (seed by měl být idempotentní)
  await prisma.achievement.deleteMany({})
  await prisma.achievement.createMany({
    data: allAchievements
  })

  console.log(`✅ Vytvořeno ${allAchievements.length} achievements`)
}

// ============================================================================
// SEKCE 2: SKILLS (DOVEDNOSTI)
// ============================================================================

async function seedSkills() {
  console.log('⚔️ Seeduji skills...')

  const skills = [
    {
      name: 'Matematika',
      description: 'Schopnost řešit matematické problémy',
      icon: '🔢',
      category: 'ACADEMIC',
      maxLevel: 100,
      baseXpCost: 100
    },
    {
      name: 'Čeština',
      description: 'Dovednost v českém jazyce',
      icon: '📝',
      category: 'ACADEMIC',
      maxLevel: 100,
      baseXpCost: 100
    },
    {
      name: 'Angličtina',
      description: 'Znalost anglického jazyka',
      icon: '🇬🇧',
      category: 'ACADEMIC',
      maxLevel: 100,
      baseXpCost: 100
    },
    {
      name: 'Programování',
      description: 'Schopnost psát kód',
      icon: '💻',
      category: 'TECHNICAL',
      maxLevel: 100,
      baseXpCost: 150
    },
    {
      name: 'Fyzika',
      description: 'Porozumění fyzikálním zákonům',
      icon: '⚛️',
      category: 'ACADEMIC',
      maxLevel: 100,
      baseXpCost: 120
    },
    {
      name: 'Kreativita',
      description: 'Tvůrčí myšlení a inovace',
      icon: '🎨',
      category: 'SOFT',
      maxLevel: 100,
      baseXpCost: 80
    },
    {
      name: 'Týmová práce',
      description: 'Spolupráce s ostatními',
      icon: '🤝',
      category: 'SOFT',
      maxLevel: 100,
      baseXpCost: 80
    },
    {
      name: 'Vedení',
      description: 'Schopnost vést tým',
      icon: '👑',
      category: 'SOFT',
      maxLevel: 100,
      baseXpCost: 100
    }
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: skill,
      create: skill
    })
  }

  console.log(`✅ Vytvořeno ${skills.length} skills`)
}

// ============================================================================
// SEKCE 3: JOB CATEGORIES (KATEGORIE PRACÍ)
// ============================================================================

async function seedJobCategories() {
  console.log('💼 Seeduji job categories...')

  const jobCategories = [
    {
      name: 'Domácí úkoly',
      description: 'Úkoly zadané na doma',
      icon: '📚',
      color: '#3b82f6',
      isActive: true
    },
    {
      name: 'Třídní projekty',
      description: 'Týmové projekty ve třídě',
      icon: '👥',
      color: '#8b5cf6',
      isActive: true
    },
    {
      name: 'Prezentace',
      description: 'Prezentování před třídou',
      icon: '🎤',
      color: '#ec4899',
      isActive: true
    },
    {
      name: 'Výzkum',
      description: 'Výzkumné úkoly',
      icon: '🔬',
      color: '#06b6d4',
      isActive: true
    },
    {
      name: 'Testování',
      description: 'Testy a kvízy',
      icon: '📝',
      color: '#f59e0b',
      isActive: true
    },
    {
      name: 'Extra úkoly',
      description: 'Bonusové úkoly za extra body',
      icon: '⭐',
      color: '#10b981',
      isActive: true
    }
  ]

  for (const category of jobCategories) {
    await prisma.jobCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category
    })
  }

  console.log(`✅ Vytvořeno ${jobCategories.length} job categories`)
}

// ============================================================================
// SEKCE 4: ECONOMY (ITEMY & MARKETPLACE)
// ============================================================================

async function seedEconomy() {
  console.log('💰 Seeduji economy items...')

  const items = [
    // Consumables
    {
      name: 'XP Boost (1h)',
      description: '+50% XP na 1 hodinu',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      price: 100,
      icon: '⚡',
      effectType: 'XP_BOOST',
      effectValue: 50,
      effectDuration: 3600,
      isStackable: true,
      maxStack: 10
    },
    {
      name: 'XP Boost (24h)',
      description: '+100% XP na 24 hodin',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.EPIC,
      price: 500,
      icon: '💫',
      effectType: 'XP_BOOST',
      effectValue: 100,
      effectDuration: 86400,
      isStackable: true,
      maxStack: 5
    },
    {
      name: 'Lucky Coin',
      description: '+25% šance na lepší odměny',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.RARE,
      price: 200,
      icon: '🍀',
      effectType: 'LUCK_BOOST',
      effectValue: 25,
      effectDuration: 3600,
      isStackable: true,
      maxStack: 10
    },
    // Cosmetics
    {
      name: 'Kouzelný klobouk',
      description: 'Stylový klobouk pro tvůj avatar',
      type: ItemType.COSMETIC,
      rarity: ItemRarity.UNCOMMON,
      price: 150,
      icon: '🎩',
      cosmeticSlot: 'HEAD',
      isStackable: false
    },
    {
      name: 'Zlatá koruna',
      description: 'Koruna hodná krále',
      type: ItemType.COSMETIC,
      rarity: ItemRarity.LEGENDARY,
      price: 1000,
      icon: '👑',
      cosmeticSlot: 'HEAD',
      isStackable: false
    },
    {
      name: 'Neonové brýle',
      description: 'Svítící brýle do tmy',
      type: ItemType.COSMETIC,
      rarity: ItemRarity.RARE,
      price: 300,
      icon: '🕶️',
      cosmeticSlot: 'ACCESSORY',
      isStackable: false
    },
    // Materials
    {
      name: 'Dřevo',
      description: 'Základní materiál pro craftování',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      price: 10,
      icon: '🪵',
      isStackable: true,
      maxStack: 999
    },
    {
      name: 'Železo',
      description: 'Kovový materiál',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.UNCOMMON,
      price: 25,
      icon: '⚙️',
      isStackable: true,
      maxStack: 999
    },
    {
      name: 'Krystal',
      description: 'Vzácný magický krystal',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.RARE,
      price: 100,
      icon: '💎',
      isStackable: true,
      maxStack: 99
    },
    // Quest Items
    {
      name: 'Studijní průvodce',
      description: 'Pomůcka pro těžké questy',
      type: ItemType.QUEST_ITEM,
      rarity: ItemRarity.UNCOMMON,
      price: 75,
      icon: '📖',
      isStackable: true,
      maxStack: 5
    }
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: item,
      create: item
    })
  }

  console.log(`✅ Vytvořeno ${items.length} items`)
}

// ============================================================================
// SEKCE 5: QUESTS (DENNÍ, PŘÁTELSKÉ, GLOBÁLNÍ)
// ============================================================================

async function seedQuests() {
  console.log('🎯 Seeduji quests...')

  // Najdi nebo vytvoř tvůrce questů
  let creator = await prisma.user.findFirst({
    where: { role: { in: [UserRole.TEACHER, UserRole.OPERATOR] } }
  })

  if (!creator) {
    console.log('Vytvářím systémového učitele pro questy...')
    creator = await prisma.user.create({
      data: {
        email: 'system.teacher@edurpg.local',
        name: 'Systémový Učitel',
        role: UserRole.TEACHER,
        bakalariId: 'sys_teacher_01'
      }
    })
  }

  // Denní Questy
  const dailyQuests = [
    {
      title: 'Denní docházka',
      description: 'Označ svou docházku v systému dnes.',
      category: 'Rutina',
      difficulty: QuestDifficulty.EASY,
      questType: QuestType.DAILY,
      xpReward: 50,
      moneyReward: 10,
      requiredLevel: 0,
      createdBy: creator.id
    },
    {
      title: 'Odpověz na 3 otázky',
      description: 'Správně odpověz na 3 standardní otázky.',
      category: 'Akademické',
      difficulty: QuestDifficulty.MEDIUM,
      questType: QuestType.DAILY,
      xpReward: 100,
      moneyReward: 20,
      requiredLevel: 0,
      createdBy: creator.id
    },
    {
      title: 'Pomoz spolužákovi',
      description: 'Asistuj jinému studentovi s úkolem.',
      category: 'Sociální',
      difficulty: QuestDifficulty.EASY,
      questType: QuestType.DAILY,
      xpReward: 75,
      moneyReward: 15,
      requiredLevel: 0,
      createdBy: creator.id
    }
  ]

  for (const quest of dailyQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: quest.title, questType: QuestType.DAILY }
    })
    if (!exists) {
      await prisma.quest.create({ data: quest })
    }
  }

  // Přátelské Questy
  const friendQuests = [
    {
      title: 'Studijní kamarád',
      description: 'Studujte společně 30 minut v knihovně.',
      category: 'Sociální',
      difficulty: QuestDifficulty.EASY,
      questType: FriendQuestType.WEEKLY,
      createdBy: creator.id
    },
    {
      title: 'Společné programování',
      description: 'Společně dokončete programovací výzvu.',
      category: 'Technologie',
      difficulty: QuestDifficulty.MEDIUM,
      questType: FriendQuestType.WEEKLY,
      createdBy: creator.id
    }
  ]

  for (const fq of friendQuests) {
    const exists = await prisma.friendQuest.findFirst({
      where: { title: fq.title }
    })
    if (!exists) {
      await prisma.friendQuest.create({
        data: {
          ...fq,
          rewards: {
            create: [
              { rewardType: 'XP', amount: 300 },
              { rewardType: 'MONEY', amount: 50 }
            ]
          }
        }
      })
    }
  }

  // Globální Questy
  const globalQuests = [
    {
      title: 'Školní excellence 2026',
      description: 'Společně dosáhněte 10 000 jedniček napříč všemi předměty.',
      category: 'Globální',
      difficulty: QuestDifficulty.LEGENDARY,
      questType: QuestType.GLOBAL,
      xpReward: 5000,
      moneyReward: 1000,
      requiredLevel: 0,
      globalTarget: 10000,
      globalUnit: 'jedničky',
      createdBy: creator.id
    },
    {
      title: 'Masová docházka',
      description: 'Akumulujte společně 100 000 školních hodin.',
      category: 'Globální',
      difficulty: QuestDifficulty.HARD,
      questType: QuestType.GLOBAL,
      xpReward: 3000,
      moneyReward: 500,
      requiredLevel: 0,
      globalTarget: 100000,
      globalUnit: 'hodin',
      createdBy: creator.id
    },
    {
      title: 'Výzva světového bosse',
      description: 'Způsobte dohromady 1 000 000 poškození Temného pánovi.',
      category: 'Globální',
      difficulty: QuestDifficulty.LEGENDARY,
      questType: QuestType.GLOBAL,
      xpReward: 10000,
      moneyReward: 2000,
      requiredLevel: 5,
      globalTarget: 1000000,
      globalUnit: 'hp_damage',
      createdBy: creator.id
    }
  ]

  for (const gq of globalQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: gq.title, questType: QuestType.GLOBAL }
    })
    if (!exists) {
      await prisma.quest.create({ data: gq })
    } else {
      await prisma.quest.update({
        where: { id: exists.id },
        data: {
          globalTarget: gq.globalTarget,
          globalUnit: gq.globalUnit
        }
      })
    }
  }

  console.log(`✅ Vytvořeny všechny questy (Denní, Přátelské, Globální)`)
}

// ============================================================================
// SEKCE 6: GUILDS (GUILDY)
// ============================================================================

async function seedGuilds() {
  console.log('🛡️ Seeduji guilds...')

  // Najdi vůdce guildy
  const leader = await prisma.user.findFirst({
    where: { role: { in: [UserRole.TEACHER, UserRole.OPERATOR] } }
  })

  if (!leader) {
    console.log('ℹ️ Nebyl nalezen vůdce pro guildu, přeskakuji...')
    return
  }

  // Vytvoř výchozí guildu
  const guildName = 'Studijní Elita'
  let guild = await prisma.guild.findFirst({
    where: { name: guildName }
  })

  if (!guild) {
    guild = await prisma.guild.create({
      data: {
        name: guildName,
        description: 'Guilda nejlepších studentů školy.',
        motto: 'Společně k úspěchu!',
        leaderId: leader.id,
        isPublic: true,
        maxMembers: 10,
        treasury: 0,
        xp: 0,
        level: 1,
        memberCount: 1,
        members: {
          create: {
            userId: leader.id,
            role: 'LEADER'
          }
        }
      }
    })
    console.log(`✅ Vytvořena guilda: ${guild.name}`)
  } else {
    console.log(`ℹ️ Guilda již existuje: ${guild.name}`)
  }

  // Vytvoř guildovní questy
  const guildQuests = [
    {
      title: 'Guildovní setkání',
      description: 'Všichni členové se sejdou v guildovní síni.',
      category: 'Guilda',
      difficulty: QuestDifficulty.EASY,
      questType: QuestType.GUILD,
      xpReward: 100,
      moneyReward: 50,
      requiredLevel: 1,
      guildId: guild.id,
      createdBy: leader.id
    },
    {
      title: 'Příspěvek do pokladny',
      description: 'Přispěj 100 gold do guildovní pokladny.',
      category: 'Guilda',
      difficulty: QuestDifficulty.MEDIUM,
      questType: QuestType.GUILD,
      xpReward: 200,
      moneyReward: 0,
      requiredLevel: 1,
      guildId: guild.id,
      createdBy: leader.id
    },
    {
      title: 'Týmový úkol',
      description: 'Splň zadaný úkol společně s guildou.',
      category: 'Guilda',
      difficulty: QuestDifficulty.HARD,
      questType: QuestType.GUILD,
      xpReward: 500,
      moneyReward: 200,
      requiredLevel: 3,
      guildId: guild.id,
      createdBy: leader.id
    }
  ]

  for (const gq of guildQuests) {
    const exists = await prisma.quest.findFirst({
      where: { title: gq.title, guildId: guild.id }
    })
    if (!exists) {
      await prisma.quest.create({ data: gq })
    }
  }

  console.log(`✅ Vytvořeny guildovní questy`)
}

// ============================================================================
// MAIN FUNKCE
// ============================================================================

async function main() {
  console.log('🌱 Začínám kompletní seedování databáze...\n')
  
  try {
    // Volitelně vymazat existující data (zakomentováno pro bezpečnost)
    // await clearDatabase()
    
    // Seedování v logickém pořadí
    await seedAchievements()
    await seedSkills()
    await seedJobCategories()
    await seedEconomy()
    await seedQuests()
    await seedGuilds()
    
    console.log('\n✨ Všechna seed data úspěšně vytvořena!')
  } catch (error) {
    console.error('❌ Chyba při seedování:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Spuštění při přímém volání
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

// Export funkcí pro selektivní použití
export {
  seedAchievements,
  seedSkills,
  seedJobCategories,
  seedEconomy,
  seedQuests,
  seedGuilds,
  clearDatabase
}
