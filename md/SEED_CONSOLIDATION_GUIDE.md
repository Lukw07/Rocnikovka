# 🌱 Seed Consolidation Guide

## Přehled

Všechny seed scripty byly sloučeny do jednoho konsolidovaného souboru pro jednodušší správu a konzistentní seeding.

## 📋 Co bylo konsolidováno

### Původní seed soubory (SMAZÁNY)

| Soubor | Účel |
|--------|------|
| `seed-achievements.ts` | Achievementy a jejich kategorie |
| `seed-core-attributes.ts` | Core attribute skills (Time Management, Focus, atd.) |
| `seed-economy.ts` | Items, starter currency |
| `seed-friend-quests.ts` | Friend quest systém |
| `seed-friends.ts` | Friends systém |
| `seed-gamification-complete.ts` | Kompletní gamification data |
| `seed-guilds.ts` | Guilds a guild members |
| `seed-job-categories.ts` | Job kategorie |
| `seed-marketplace.ts` | Marketplace listings |
| `seed-skills.ts` | Skills a skill categories |
| `seed-trading.ts` | Trading systém |
| `seed-gamification.js` | Legacy gamification seed |

**Celkem:** 12 souborů

### Nový konsolidovaný soubor

📄 **`ops/consolidated-seed.ts`** - Obsahuje vše v jednom souboru

## 🎯 Struktura konsolidovaného seed souboru

```typescript
consolidated-seed.ts
├─ Helper Functions
│  └─ clearDatabase() - Vyčištění existujících dat
│
├─ Section 1: Achievements
│  └─ seedAchievements() - Level, Quest, Streak achievementy
│
├─ Section 2: Core Attributes
│  └─ seedCoreAttributes() - 5 core attribute skills
│
├─ Section 3: Skills
│  └─ seedSkills() - Programming, Math, Science, Languages
│
├─ Section 4: Job Categories
│  └─ seedJobCategories() - Frontend, Backend, Data Science, atd.
│
├─ Section 5: Economy
│  └─ seedEconomy() - Items, starter currency
│
├─ Section 6: Quests
│  └─ seedQuests() - Základní questy
│
├─ Section 7: Guilds
│  └─ seedGuilds() - Demo guilds
│
└─ Main Function
   └─ main() - Spustí všechny seed funkce v pořadí
```

## 🚀 Použití

### Spuštění celého seedu

```powershell
# Spustit všechny seed funkce
npx tsx ops/consolidated-seed.ts
```

### Selektivní použití

```typescript
import { 
  seedAchievements, 
  seedSkills, 
  seedEconomy 
} from './ops/consolidated-seed'

// Seed pouze achievementy
await seedAchievements()

// Seed pouze skills
await seedSkills()

// Seed pouze economy
await seedEconomy()
```

### Vyčištění před seedem

```typescript
import { clearDatabase } from './ops/consolidated-seed'

// Vyčistit existující data před seedem
await clearDatabase()
```

## 📊 Obsah seedu

### Achievementy
- **5 Level achievementů** (First Steps → Master of Knowledge)
- **3 Quest achievementy** (Quest Beginner → Quest Master)
- **2 Streak achievementy** (Consistency Rookie → Consistency Pro)

**Celkem:** 10 achievementů

### Core Attributes
- Time Management (⏰) - +2% XP gain per level
- Focus (🎯) - +3% skill learning speed per level
- Leadership (👑) - +2% job rewards per level
- Communication (💬) - +2% reputation gains per level
- Consistency (🔄) - +5% streak bonuses per level

**Celkem:** 5 core attributes

### Skills
- **5 Programming skills** (JavaScript, TypeScript, Python, Java, React)
- **4 Math skills** (Algebra, Geometry, Calculus, Statistics)
- **3 Science skills** (Physics, Chemistry, Biology)
- **3 Language skills** (English, Czech, German)

**Celkem:** 15 skills

### Job Categories
- Frontend Development (🎨)
- Backend Development (⚙️)
- Data Science (📊)
- Teaching Assistant (👨‍🏫)
- Research (🔬)

**Celkem:** 5 job categories

### Items
- **3 Cosmetic items** (Golden/Silver Frame, Dragon Avatar)
- **2 Consumable items** (XP Potion, Lucky Charm)
- **2 Material items** (Leather, Gold Ore)
- **1 Special item** (Mystery Box)

**Celkem:** 8 items + starter currency (500 gold, 10 gems)

### Quests
- Matematický Maraton (Math, EASY)
- Vědecký Experiment (Science, MEDIUM)
- Literární Analýza (Literature, HARD)
- Programovací Výzva (Programming, MEDIUM)
- Historická Prezentace (History, MEDIUM)

**Celkem:** 5 quests

### Guilds
- Code Warriors (Programming)
- Math Wizards (Mathematics)
- Science Squad (Science)

**Celkem:** 3 guilds (vyžaduje existující uživatele)

## ⚙️ Konfigurace

### Starter Currency
```typescript
{
  gold: 500,
  gems: 10
}
```

### Safety Features
- `skipDuplicates: true` - Zabraňuje chybám při opakovaném seedu
- `upsert` operations - Update pokud existuje, create pokud ne
- Error handling pro každou sekci
- Transaction safety přes Prisma

## 🔧 Přizpůsobení

### Přidání nových achievementů

```typescript
const newAchievements = [
  {
    name: 'Custom Achievement',
    description: 'Popis achievementu',
    type: 'NORMAL',
    category: 'CUSTOM',
    icon: '🏆',
    color: '#ff0000',
    rarity: 'RARE',
    target: 100,
    xpReward: 500,
    skillpointsReward: 5,
    reputationReward: 50,
    moneyReward: 250,
    sortOrder: 100
  }
]

await prisma.achievement.createMany({
  data: newAchievements,
  skipDuplicates: true
})
```

### Přidání nových itemů

```typescript
const newItems = [
  {
    name: "New Item",
    description: "Item description",
    price: 100,
    rarity: 'UNCOMMON',
    type: 'CONSUMABLE',
    category: "buff",
    isTradeable: true,
  }
]

for (const item of newItems) {
  await prisma.item.upsert({
    where: { name: item.name },
    update: item,
    create: item
  })
}
```

## 📈 Statistiky

```
┌─────────────────────────────────────────┐
│  SEED CONSOLIDATION COMPLETE ✅         │
├─────────────────────────────────────────┤
│  Sloučených souborů:        12          │
│  Achievements:              10          │
│  Core Attributes:            5          │
│  Skills:                    15          │
│  Job Categories:             5          │
│  Items:                      8          │
│  Quests:                     5          │
│  Guilds:                     3          │
│                                         │
│  Celkový počet záznamů:    51+          │
│  Export funkcí:             8           │
└─────────────────────────────────────────┘
```

## ⚠️ Důležité poznámky

### 1. Závislosti
Seed funkce musí běžet v tomto pořadí kvůli závislostm:
1. Achievements (nezávislé)
2. Core Attributes (nezávislé)
3. Skills (nezávislé)
4. Job Categories (nezávislé)
5. Economy (nezávislé)
6. Quests (nezávislé)
7. Guilds (vyžaduje existující Users)

### 2. Bezpečnost
- `clearDatabase()` je ve výchozím stavu zakomentována
- Nikdy nespouštějte `clearDatabase()` na produkci bez zálohy
- Používejte `upsert` místo `create` pro idempotentní seeding

### 3. Produkce vs Development
```typescript
// Development - clear and reseed
await clearDatabase()
await main()

// Production - pouze přidat nová data
await main()  // skipDuplicates zabrání problémům
```

## 🔗 Související soubory

- [consolidated_migration.sql](../prisma/migrations/consolidated_migration.sql) - Databázová migrace
- [schema.prisma](../prisma/schema.prisma) - Prisma schéma
- [CONSOLIDATED_MIGRATION_GUIDE.md](../CONSOLIDATED_MIGRATION_GUIDE.md) - Migration guide

## 🎬 Quick Start

```powershell
# 1. Ujistěte se, že máte správné schéma
npx prisma db push

# 2. Spusťte seed
npx tsx ops/consolidated-seed.ts

# 3. Ověřte data
npx prisma studio
```

## 💡 Best Practices

1. **Vždy testujte na dev prostředí** před použitím na produkci
2. **Používejte `upsert`** místo `create` pro opakovatelné seedy
3. **Dokumentujte změny** v tomto souboru
4. **Verzujte seed data** pokud se mění často
5. **Exportujte jednotlivé funkce** pro flexibilní použití

---

**Datum vytvoření:** 2026-01-03  
**Verze:** 1.0  
**Autor:** AI Database Agent  
**Status:** ✅ Kompletní a připraveno k použití
