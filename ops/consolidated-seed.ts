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

import { PrismaClient, AchievementType, AchievementCategory, ItemType, ItemRarity, QuestDifficulty } from '../app/lib/generated'

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
    },
    {
      name: 'Quest Legend',
      description: 'Dokončit 100 questů',
      type: 'NORMAL',
      category: 'QUEST',
      icon: '🏆',
      color: '#f59e0b',
      rarity: 'EPIC',
      target: 100,
      xpReward: 1000,
      skillpointsReward: 10,
      reputationReward: 100,
      moneyReward: 500,
      sortOrder: 13
    }
  ]

  const xpAchievements = [
    {
      name: 'XP Collector',
      description: 'Získej 1000 XP',
      type: 'NORMAL',
      category: 'XP',
      icon: '💎',
      color: '#06b6d4',
      rarity: 'COMMON',
      target: 1000,
      xpReward: 100,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 30
    },
    {
      name: 'XP Hoarder',
      description: 'Získej 10000 XP',
      type: 'NORMAL',
      category: 'XP',
      icon: '💰',
      color: '#14b8a6',
      rarity: 'UNCOMMON',
      target: 10000,
      xpReward: 500,
      skillpointsReward: 3,
      reputationReward: 25,
      moneyReward: 150,
      sortOrder: 31
    },
    {
      name: 'XP Tycoon',
      description: 'Získej 50000 XP',
      type: 'NORMAL',
      category: 'XP',
      icon: '👑',
      color: '#f59e0b',
      rarity: 'EPIC',
      target: 50000,
      xpReward: 2000,
      skillpointsReward: 10,
      reputationReward: 100,
      moneyReward: 500,
      sortOrder: 32
    }
  ]

  const skillAchievements = [
    {
      name: 'Skill Novice',
      description: 'Odemkni 5 skillů',
      type: 'NORMAL',
      category: 'SKILL',
      icon: '🎯',
      color: '#8b5cf6',
      rarity: 'COMMON',
      target: 5,
      xpReward: 100,
      skillpointsReward: 2,
      reputationReward: 10,
      moneyReward: 50,
      sortOrder: 40
    },
    {
      name: 'Polymath',
      description: 'Odemkni 10 skillů',
      type: 'NORMAL',
      category: 'SKILL',
      icon: '🧠',
      color: '#ec4899',
      rarity: 'RARE',
      target: 10,
      xpReward: 300,
      skillpointsReward: 5,
      reputationReward: 30,
      moneyReward: 150,
      sortOrder: 41
    }
  ]

  const socialAchievements = [
    {
      name: 'Social Butterfly',
      description: 'Přidej si 5 přátel',
      type: 'NORMAL',
      category: 'SOCIAL',
      icon: '👥',
      color: '#06b6d4',
      rarity: 'COMMON',
      target: 5,
      xpReward: 50,
      skillpointsReward: 1,
      reputationReward: 10,
      moneyReward: 25,
      sortOrder: 50
    },
    {
      name: 'Team Player',
      description: 'Dokončit 5 týmových questů',
      type: 'NORMAL',
      category: 'SOCIAL',
      icon: '🤝',
      color: '#14b8a6',
      rarity: 'UNCOMMON',
      target: 5,
      xpReward: 150,
      skillpointsReward: 2,
      reputationReward: 20,
      moneyReward: 100,
      sortOrder: 51
    }
  ]

  const jobAchievements = [
    {
      name: 'First Job',
      description: 'Dokončit první job',
      type: 'NORMAL',
      category: 'JOB',
      icon: '💼',
      color: '#3b82f6',
      rarity: 'COMMON',
      target: 1,
      xpReward: 50,
      skillpointsReward: 1,
      reputationReward: 5,
      moneyReward: 50,
      sortOrder: 60
    },
    {
      name: 'Hard Worker',
      description: 'Dokončit 25 jobů',
      type: 'NORMAL',
      category: 'JOB',
      icon: '⚡',
      color: '#f59e0b',
      rarity: 'UNCOMMON',
      target: 25,
      xpReward: 200,
      skillpointsReward: 3,
      reputationReward: 25,
      moneyReward: 150,
      sortOrder: 61
    }
  ]

  const streakAchievements = [
    {
      name: 'Consistency Rookie',
      description: 'Udrž 7denní streak',
      type: 'NORMAL',
      category: 'ACTIVITY',
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
      category: 'ACTIVITY',
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
    data: [...levelAchievements, ...questAchievements, ...xpAchievements, ...skillAchievements, ...socialAchievements, ...jobAchievements, ...streakAchievements] as any,
    skipDuplicates: true
  })

  console.log(`✅ Created ${levelAchievements.length + questAchievements.length + xpAchievements.length + skillAchievements.length + socialAchievements.length + jobAchievements.length + streakAchievements.length} achievements`)
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
      unlockLevel: 0
    },
    {
      name: "Focus",
      description: "Sharpen your focus. Each level increases skill learning speed by 3%.",
      category: "Core",
      icon: "🎯",
      maxLevel: 10,
      unlockLevel: 0
    },
    {
      name: "Leadership",
      description: "Become a leader. Each level increases job rewards by 2%.",
      category: "Core",
      icon: "👑",
      maxLevel: 10,
      unlockLevel: 0
    },
    {
      name: "Communication",
      description: "Master communication. Each level increases reputation gains by 2%.",
      category: "Core",
      icon: "💬",
      maxLevel: 10,
      unlockLevel: 0
    },
    {
      name: "Consistency",
      description: "Build consistency. Each level increases streak bonuses by 5%.",
      category: "Core",
      icon: "🔄",
      maxLevel: 10,
      unlockLevel: 0
    }
  ]

  await prisma.skill.createMany({
    data: coreAttributes,
    skipDuplicates: true
  })

  console.log(`✅ Created ${coreAttributes.length} core attributes`)
}

// ============================================================================
// SECTION 3: REGULAR SKILLS
// ============================================================================

async function seedSkills() {
  console.log('🎓 Seeding skills...')

  const skills = [
    // Programming Skills
    { name: "JavaScript", category: "Programming", icon: "🟨", maxLevel: 100, unlockLevel: 0, description: "Master vanilla JavaScript programming" },
    { name: "TypeScript", category: "Programming", icon: "🔷", maxLevel: 100, unlockLevel: 5, description: "Learn typed JavaScript superset" },
    { name: "Python", category: "Programming", icon: "🐍", maxLevel: 100, unlockLevel: 0, description: "Learn Python programming language" },
    { name: "Java", category: "Programming", icon: "☕", maxLevel: 100, unlockLevel: 3, description: "Master object-oriented Java" },
    { name: "React", category: "Programming", icon: "⚛️", maxLevel: 100, unlockLevel: 10, description: "Build modern web interfaces" },
    { name: "Node.js", category: "Programming", icon: "🟩", maxLevel: 100, unlockLevel: 8, description: "Backend JavaScript development" },
    { name: "SQL", category: "Programming", icon: "🗄️", maxLevel: 100, unlockLevel: 5, description: "Database query language" },
    { name: "Git", category: "Programming", icon: "📦", maxLevel: 100, unlockLevel: 0, description: "Version control mastery" },
    { name: "Docker", category: "Programming", icon: "🐳", maxLevel: 100, unlockLevel: 15, description: "Containerization skills" },
    { name: "C++", category: "Programming", icon: "⚙️", maxLevel: 100, unlockLevel: 10, description: "Systems programming language" },
    
    // Math Skills
    { name: "Algebra", category: "Math", icon: "🔢", maxLevel: 100, unlockLevel: 0, description: "Basic algebraic operations" },
    { name: "Geometry", category: "Math", icon: "📐", maxLevel: 100, unlockLevel: 0, description: "Spatial reasoning and shapes" },
    { name: "Calculus", category: "Math", icon: "∫", maxLevel: 100, unlockLevel: 15, description: "Advanced mathematical analysis" },
    { name: "Statistics", category: "Math", icon: "📊", maxLevel: 100, unlockLevel: 10, description: "Data analysis and probability" },
    { name: "Linear Algebra", category: "Math", icon: "🔺", maxLevel: 100, unlockLevel: 20, description: "Vectors and matrices" },
    { name: "Trigonometry", category: "Math", icon: "📏", maxLevel: 100, unlockLevel: 8, description: "Angles and triangles" },
    
    // Science Skills
    { name: "Physics", category: "Science", icon: "⚛️", maxLevel: 100, unlockLevel: 5, description: "Understanding natural phenomena" },
    { name: "Chemistry", category: "Science", icon: "🧪", maxLevel: 100, unlockLevel: 5, description: "Study of matter and reactions" },
    { name: "Biology", category: "Science", icon: "🧬", maxLevel: 100, unlockLevel: 0, description: "Life sciences fundamentals" },
    
    // Language Skills
    { name: "English", category: "Language", icon: "🇬🇧", maxLevel: 100, unlockLevel: 0, description: "English language proficiency" },
    { name: "Czech", category: "Language", icon: "🇨🇿", maxLevel: 100, unlockLevel: 0, description: "Czech language mastery" },
    { name: "German", category: "Language", icon: "🇩🇪", maxLevel: 100, unlockLevel: 5, description: "German language skills" },
    { name: "Ukrainian", category: "Language", icon: "🇺🇦", maxLevel: 100, unlockLevel: 5, description: "Ukrainian language skills" },
    // Design Skills
    { name: "UI/UX Design", category: "Design", icon: "🎨", maxLevel: 100, unlockLevel: 8, description: "User interface design" },
    { name: "Graphic Design", category: "Design", icon: "🖼️", maxLevel: 100, unlockLevel: 5, description: "Visual communication design" },
    { name: "3D Modeling", category: "Design", icon: "🎮", maxLevel: 100, unlockLevel: 15, description: "3D graphics creation" },
    
    // Business Skills
    { name: "Marketing", category: "Business", icon: "📢", maxLevel: 100, unlockLevel: 10, description: "Business promotion skills" },
    { name: "Project Management", category: "Business", icon: "📋", maxLevel: 100, unlockLevel: 12, description: "Managing projects effectively" },
    { name: "Finance", category: "Business", icon: "💰", maxLevel: 100, unlockLevel: 10, description: "Financial literacy" }
  ]

  await prisma.skill.createMany({
    data: skills,
    skipDuplicates: true
  })

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
      color: "#3b82f6"
    },
    {
      name: "Backend Development",
      description: "Build server-side logic and databases",
      icon: "⚙️",
      color: "#8b5cf6"
    },
    {
      name: "Data Science",
      description: "Analyze data and build ML models",
      icon: "📊",
      color: "#10b981"
    },
    {
      name: "Teaching Assistant",
      description: "Help other students learn",
      icon: "👨‍🏫",
      color: "#f59e0b"
    },
    {
      name: "Research",
      description: "Conduct research projects",
      icon: "🔬",
      color: "#ec4899"
    },
    {
      name: "Mobile Development",
      description: "Create mobile applications",
      icon: "📱",
      color: "#06b6d4"
    },
    {
      name: "DevOps",
      description: "Manage infrastructure and deployment",
      icon: "🚀",
      color: "#14b8a6"
    },
    {
      name: "UI/UX Design",
      description: "Design user experiences and interfaces",
      icon: "✨",
      color: "#a855f7"
    },
    {
      name: "Content Writing",
      description: "Write articles and documentation",
      icon: "✍️",
      color: "#f97316"
    },
    {
      name: "Quality Assurance",
      description: "Test software and find bugs",
      icon: "🐛",
      color: "#ef4444"
    }
  ]

  await prisma.jobCategory.createMany({
    data: jobCategories,
    skipDuplicates: true
  })

  console.log(`✅ Created ${jobCategories.length} job categories`)
}

// ============================================================================
// SECTION 5: ECONOMY (ITEMS)
// ============================================================================

async function seedEconomy() {
  console.log('💰 Seeding economy...')

  // Note: Starter currency is set in User model defaults (gold: 500, gems: 10)

  const items = [
    // COSMETIC Items - Frames
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
      name: "Bronze Frame",
      description: "Základní bronzový rámeček",
      price: 50,
      rarity: 'COMMON',
      type: 'COSMETIC',
      category: "frame",
      isTradeable: true,
    },
    {
      name: "Platinum Frame",
      description: "Exkluzivní platinový rámeček",
      price: 1000,
      rarity: 'EPIC',
      type: 'COSMETIC',
      category: "frame",
      isTradeable: true,
    },
    {
      name: "Diamond Frame",
      description: "Legendární diamantový rámeček",
      price: 5000,
      rarity: 'LEGENDARY',
      type: 'COSMETIC',
      category: "frame",
      isTradeable: false,
    },
    
    // COSMETIC Items - Avatars
    {
      name: "Dragon Avatar",
      description: "Epický dračí avatar",
      price: 1500,
      rarity: 'EPIC',
      type: 'COSMETIC',
      category: "avatar",
      isTradeable: true,
    },
    {
      name: "Knight Avatar",
      description: "Rytířský avatar",
      price: 500,
      rarity: 'RARE',
      type: 'COSMETIC',
      category: "avatar",
      isTradeable: true,
    },
    {
      name: "Wizard Avatar",
      description: "Kouzelný avatar čaroděje",
      price: 800,
      rarity: 'RARE',
      type: 'COSMETIC',
      category: "avatar",
      isTradeable: true,
    },
    {
      name: "Phoenix Avatar",
      description: "Legendární fénix",
      price: 3000,
      rarity: 'LEGENDARY',
      type: 'COSMETIC',
      category: "avatar",
      isTradeable: false,
    },
    
    // COSMETIC Items - Badges
    {
      name: "Gold Star Badge",
      description: "Zlatá hvězda pro nejlepší studenty",
      price: 750,
      rarity: 'RARE',
      type: 'COSMETIC',
      category: "badge",
      isTradeable: true,
    },
    {
      name: "Achievement Hunter Badge",
      description: "Badge pro sběratele achievementů",
      price: 1200,
      rarity: 'EPIC',
      type: 'COSMETIC',
      category: "badge",
      isTradeable: true,
    },
    
    // BOOST Items (Consumables)
    {
      name: "XP Potion",
      description: "Zvyšuje XP gain o 50% na 1 hodinu",
      price: 100,
      rarity: 'COMMON',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Lucky Charm",
      description: "Zvyšuje šanci na rare items o 25%",
      price: 250,
      rarity: 'UNCOMMON',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Mega XP Potion",
      description: "Zdvojnásobí XP gain na 2 hodiny",
      price: 300,
      rarity: 'RARE',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Skill Boost",
      description: "Zrychlí skill learning o 30% na 1 hodinu",
      price: 200,
      rarity: 'UNCOMMON',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Money Multiplier",
      description: "Zvýší gold rewards o 50% na 2 hodiny",
      price: 350,
      rarity: 'RARE',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    {
      name: "Focus Elixir",
      description: "Maximální koncentrace na 30 minut",
      price: 150,
      rarity: 'COMMON',
      type: 'BOOST',
      category: "buff",
      isTradeable: true,
    },
    
    // COLLECTIBLE Items (Materials)
    {
      name: "Leather",
      description: "Základní crafting materiál",
      price: 10,
      rarity: 'COMMON',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Gold Ore",
      description: "Cenný crafting materiál",
      price: 50,
      rarity: 'RARE',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Iron Ore",
      description: "Běžný kov pro crafting",
      price: 20,
      rarity: 'COMMON',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Mithril",
      description: "Vzácný magický kov",
      price: 200,
      rarity: 'EPIC',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Dragon Scale",
      description: "Legendární crafting materiál",
      price: 500,
      rarity: 'LEGENDARY',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    {
      name: "Enchanted Crystal",
      description: "Krystal plný magické energie",
      price: 150,
      rarity: 'RARE',
      type: 'COLLECTIBLE',
      category: "resource",
      isTradeable: true,
    },
    
    // COLLECTIBLE Items (Special)
    {
      name: "Mystery Box",
      description: "Obsahuje náhodný item",
      price: 300,
      rarity: 'RARE',
      type: 'COLLECTIBLE',
      category: "lootbox",
      isTradeable: false,
    },
    {
      name: "Epic Loot Chest",
      description: "Obsahuje epic nebo legendární item",
      price: 1000,
      rarity: 'EPIC',
      type: 'COLLECTIBLE',
      category: "lootbox",
      isTradeable: false,
    },
    {
      name: "Starter Pack",
      description: "Balíček pro nové hráče",
      price: 150,
      rarity: 'COMMON',
      type: 'COLLECTIBLE',
      category: "lootbox",
      isTradeable: false,
    },
    {
      name: "Legendary Treasure",
      description: "Nejlepší lootbox v celém systému",
      price: 5000,
      rarity: 'LEGENDARY',
      type: 'COLLECTIBLE',
      category: "lootbox",
      isTradeable: false,
    }
  ]

  await prisma.item.createMany({
    data: items as any,
    skipDuplicates: true
  })

  console.log(`✅ Created ${items.length} items`)
}

// ============================================================================
// SECTION 6: QUESTS
// ============================================================================

async function seedQuests() {
  console.log('📋 Seeding quests...')

  const quests = [
    // Easy Quests
    {
      title: "Matematický Maraton",
      description: "Vyřešte 10 matematických příkladů z algebry",
      category: "Math",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 100,
      moneyReward: 50,
      createdBy: "system",
      questType: 'DAILY'
    },
    {
      title: "První Krok",
      description: "Dokončit první úkol v systému",
      category: "Tutorial",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 50,
      moneyReward: 25,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Angličtina pro Začátečníky",
      description: "Přeložte 5 jednoduchých vět do angličtiny",
      category: "Language",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 80,
      moneyReward: 40,
      createdBy: "system",
      questType: 'DAILY'
    },
    {
      title: "Git Basics",
      description: "Proveďte první commit a push do repozitáře",
      category: "Programming",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 120,
      moneyReward: 60,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Čtení s Porozuměním",
      description: "Přečtěte si krátký text a odpovězte na 5 otázek",
      category: "Literature",
      difficulty: 'EASY',
      requiredLevel: 0,
      xpReward: 90,
      moneyReward: 45,
      createdBy: "system",
      questType: 'DAILY'
    },
    
    // Medium Quests
    {
      title: "Vědecký Experiment",
      description: "Proveďte experiment o fotosyntéze a napište report",
      category: "Science",
      difficulty: 'MEDIUM',
      requiredLevel: 5,
      xpReward: 250,
      moneyReward: 100,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Programovací Výzva",
      description: "Vytvořte React komponentu s TypeScriptem",
      category: "Programming",
      difficulty: 'MEDIUM',
      requiredLevel: 8,
      xpReward: 300,
      moneyReward: 150,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Historická Prezentace",
      description: "Vytvoř prezentaci o druhé světové válce",
      category: "History",
      difficulty: 'MEDIUM',
      requiredLevel: 3,
      xpReward: 200,
      moneyReward: 75,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Geometrické Důkazy",
      description: "Dokažte 3 geometrické věty",
      category: "Math",
      difficulty: 'MEDIUM',
      requiredLevel: 6,
      xpReward: 280,
      moneyReward: 120,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Web Development Project",
      description: "Vytvoř responzivní landing page",
      category: "Programming",
      difficulty: 'MEDIUM',
      requiredLevel: 10,
      xpReward: 350,
      moneyReward: 175,
      createdBy: "system",
      questType: 'WEEKLY'
    },
    {
      title: "Chemická Rovnice",
      description: "Vyvažte 10 chemických rovnic",
      category: "Science",
      difficulty: 'MEDIUM',
      requiredLevel: 7,
      xpReward: 220,
      moneyReward: 90,
      createdBy: "system",
      questType: 'DAILY'
    },
    {
      title: "SQL Databáze",
      description: "Vytvoř databázové schéma pro e-shop",
      category: "Programming",
      difficulty: 'MEDIUM',
      requiredLevel: 12,
      xpReward: 320,
      moneyReward: 160,
      createdBy: "system",
      questType: 'STANDARD'
    },
    
    // Hard Quests
    {
      title: "Literární Analýza",
      description: "Napište rozbor 3 klasických děl",
      category: "Literature",
      difficulty: 'HARD',
      requiredLevel: 10,
      xpReward: 500,
      moneyReward: 200,
      createdBy: "system",
      questType: 'STANDARD'
    },
    {
      title: "Pokročilý Kalkulus",
      description: "Řešte integrály a derivace složitých funkcí",
      category: "Math",
      difficulty: 'HARD',
      requiredLevel: 15,
      xpReward: 600,
      moneyReward: 250,
      createdBy: "system",
      questType: 'WEEKLY'
    },
    {
      title: "Full Stack Application",
      description: "Vytvořte kompletní aplikaci s backendem a frontendem",
      category: "Programming",
      difficulty: 'HARD',
      requiredLevel: 20,
      xpReward: 800,
      moneyReward: 400,
      createdBy: "system",
      questType: 'WEEKLY'
    },
    {
      title: "Výzkumný Paper",
      description: "Napište vědecký článek s výzkumem a experimenty",
      category: "Science",
      difficulty: 'HARD',
      requiredLevel: 18,
      xpReward: 750,
      moneyReward: 350,
      createdBy: "system",
      questType: 'WEEKLY'
    },
    {
      title: "Machine Learning Model",
      description: "Natrénujte ML model na real-world datech",
      category: "Programming",
      difficulty: 'HARD',
      requiredLevel: 25,
      xpReward: 1000,
      moneyReward: 500,
      createdBy: "system",
      questType: 'WEEKLY'
    },
    {
      title: "Literární Dílo",
      description: "Napište vlastní povídku (min. 5000 slov)",
      category: "Literature",
      difficulty: 'HARD',
      requiredLevel: 12,
      xpReward: 650,
      moneyReward: 300,
      createdBy: "system",
      questType: 'WEEKLY'
    }
  ]

  await prisma.quest.createMany({
    data: quests as any,
    skipDuplicates: true
  })

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

  try {
    await prisma.guild.createMany({
      data: guilds,
      skipDuplicates: true
    })
    console.log(`✅ Created ${guilds.length} guilds`)
  } catch (error) {
    console.log(`⚠️  Could not create guilds (might need existing users as leaders)`)
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
