# Skillpoints System Integration Guide

Tato příručka vysvětluje, jak integrovat nový skillpoints a core attributes systém do Vašeho existujícího EduRPG dashboardu.

---

## 📋 Co bylo implementováno

✅ **Backend**
- 5 core attributes (Time Management, Focus, Leadership, Communication, Consistency)
- Attribute effects system s bonus kalkulacemi
- API endpointy pro čtení a alokaci skillpointů
- Integrace s XP systémem (Time Management bonus)
- Integrace s Job systémem (Leadership bonus + skillpoint grant)

✅ **Frontend**
- `SkillsDisplay` - zobrazení všech atributů s efekty
- `SkillPointAllocator` - UI pro alokaci skillpointů
- `AttributeProgressBar` - progress bar pro jeden atribut

✅ **Databáze**
- Existující `Skill` model (se category "Core")
- Existující `PlayerSkill` model (vazba hráč-skill)
- Existující `SkillPoint` model (tracking skillpointů)

---

## 🚀 Instalace a Setup

### 1. Inicializace Core Attributes v databázi

```bash
# Spusťte seed skript pro vytvoření 5 základních atributů
npx ts-node ops/seed-core-attributes.ts
```

Výstup:
```
🌱 Seeding Core Attributes...

✅ Created Core Attribute: Time Management
   Description: Master the art of time management...
   Effect: XP_MULTIPLIER (+2% per level)

✅ Created Core Attribute: Focus
   ...
```

### 2. Spustit test skript (volitelné)

```bash
# Ověřit že systém funguje správně
npx ts-node ops/test-skillpoints.ts
```

---

## 📱 Integrace do Dashboard

### Option 1: Nová Attributes Stránka

Vytvořit nový soubor: `app/dashboard/attributes/page.tsx`

```tsx
"use client"

import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"

export default function AttributesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold">Core Attributes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attributes visualization */}
        <div className="lg:col-span-2">
          <SkillsDisplay />
        </div>
        
        {/* Skillpoint allocation panel */}
        <div className="lg:col-span-1">
          <SkillPointAllocator 
            onSkillPurchased={(skillId, skillName, newLevel) => {
              console.log(`${skillName} leveled up to ${newLevel}`)
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

### Option 2: Přidání do existujícího Dashboard

Přidat do `app/dashboard/page.tsx`:

```tsx
"use client"

import { SkillsDisplay } from "@/app/components/dashboard/attributes/skills-display"
import { SkillPointAllocator } from "@/app/components/dashboard/attributes/skillpoint-allocator"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Existing dashboard content */}
      {/* ... */}
      
      {/* Add attributes section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Core Attributes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SkillsDisplay />
          </div>
          <div className="lg:col-span-1">
            <SkillPointAllocator />
          </div>
        </div>
      </section>
    </div>
  )
}
```

### Option 3: Mini Widget v Sidebar

```tsx
"use client"

import { useApi } from "@/app/hooks/use-api"
import { useEffect, useState } from "react"

export function AttributesMiniWidget() {
  const [skillpoints, setSkillpoints] = useState({ available: 0, total: 0 })
  const { request } = useApi()
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request("GET", "/api/progression/attributes/player")
        setSkillpoints({
          available: res.data.effects.timeManagementBonus, // Will show effects
          total: res.data.attributeCount
        })
      } catch (err) {
        console.error("Failed to fetch attributes:", err)
      }
    }
    
    fetchData()
  }, [request])
  
  return (
    <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-4">
      <h3 className="font-bold text-sm text-purple-100 mb-2">Core Attributes</h3>
      <div className="text-2xl font-bold text-yellow-400">{skillpoints.total}</div>
      <p className="text-xs text-purple-200">attributes developed</p>
    </div>
  )
}
```

---

## 🔗 API Reference

Všechny API endpointy jsou na `/api/progression/attributes`:

### GET `/api/progression/attributes`
Seznam všech core attributes

```bash
curl -X GET http://localhost:3000/api/progression/attributes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "attributes": [
    {
      "id": "skill-123",
      "name": "Time Management",
      "description": "Master the art of time management...",
      "icon": "⏰",
      "maxLevel": 10,
      "unlockLevel": 0,
      "isActive": true
    }
  ],
  "total": 5
}
```

### GET `/api/progression/attributes/player`
Hráčovy atributy s aktuálními levely a efekty

```bash
curl -X GET http://localhost:3000/api/progression/attributes/player \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "attributes": [
    {
      "id": "player-skill-123",
      "skillId": "skill-123",
      "name": "Time Management",
      "currentLevel": 3,
      "maxLevel": 10,
      "bonus": "+6% XP gain"
    }
  ],
  "effects": {
    "timeManagementBonus": 1.06,
    "focusBonus": 1.00,
    "leadershipBonus": 1.02,
    "communicationBonus": 1.00,
    "consistencyBonus": 1.00,
    "totalEffectPower": 8
  },
  "attributeCount": 5,
  "totalPower": 8
}
```

### POST `/api/progression/skillpoints/spend`
Alokace 1 skillpointu na zvýšení atributu

```bash
curl -X POST http://localhost:3000/api/progression/skillpoints/spend \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "skill-123",
    "points": 1
  }'
```

---

## 🎮 Gameplay Loop

```
┌─────────────────────────────────────────┐
│   Player aktivity (job, achievement)    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Earn XP + Bonuses   │
        │  (Time Mgmt bonus)   │
        └──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Reach Level Up      │
        └──────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Grant Skillpoints:          │
        │  - From level-up             │
        │  - From job completion       │
        │  - From achievements         │
        └──────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Spend Skillpoints on:       │
        │  - Attributes (UI)           │
        │  - Next cycle has bonuses    │
        └──────────────────────────────┘
```

---

## ⚙️ Konfigurace

### Upravit atribut bonusy

Edit `app/lib/attribute-effects.ts`:

```typescript
const CORE_ATTRIBUTES = {
  TIME_MANAGEMENT: {
    name: "Time Management",
    effectType: "XP_MULTIPLIER",
    baseEffectValue: 0.02,  // ← Change this (was +2% per level)
    maxBonus: 0.20          // ← Change this (max +20%)
  },
  // ... ostatní atributy
}
```

### Upravit skillpoint granty

Edit `app/lib/services/progression.ts`:

```typescript
static async awardSkillpointsForLevel(userId: string, newLevel: number) {
  let skillpointsToAward = 1
  
  if (newLevel <= 10) skillpointsToAward = 1
  else if (newLevel <= 25) skillpointsToAward = 1
  else if (newLevel <= 50) skillpointsToAward = 2  // ← Change this
  // ... atd
}
```

### Upravit job skillpoint grant

Edit `app/lib/services/jobs.ts` (řádek ~268):

```typescript
// Award skillpoint (1 skillpoint per job completion)
await tx.skillPoint.upsert({
  where: { userId: assignment.studentId },
  update: {
    available: { increment: 1 },  // ← Change this (byla 1)
    total: { increment: 1 }
  },
  // ...
})
```

---

## 🧪 Testování

### Manuální test v aplikaci

1. Navštiv dashboard
2. Otevři Attributes sekci
3. Měj si 3+ skillpointy
4. Klikni na "Allocate Point" u Time Management
5. Potvrď dialog
6. Zkontroluj že level se zvýšil a XP bonus se zvýšil

### Automatický test

```bash
npx ts-node ops/test-skillpoints.ts
```

---

## 🔍 Troubleshooting

### Problem: "Core attributes not found"
**Řešení**: Spusťte seed skript
```bash
npx ts-node ops/seed-core-attributes.ts
```

### Problem: "Skillpoints don't apply bonus"
**Řešení**: Zkontrolujte že:
- Core attributes jsou v databázi (`category: "Core"`)
- PlayerSkill záznamy existují pro hráče
- XPService importuje attribute-effects

### Problem: "Can't spend skillpoints"
**Řešení**: Zkontrolujte:
- Hráč má `available > 0` v SkillPoint tabulce
- Skill se nejedná o maxed-out (level < maxLevel)
- POST request je správně autentizován

---

## 📚 Další dokumentace

- [SKILLPOINTS_SYSTEM.md](../SKILLPOINTS_SYSTEM.md) - Detailní dokumentace systému
- [Progression Service](../app/lib/services/progression.ts) - Backend implementace
- [Attribute Effects](../app/lib/attribute-effects.ts) - Bonus kalkulace

---

## ✅ Checklist pro nasazení

- [ ] Seed script spuštěn (5 core attributes v DB)
- [ ] Komponenty importovány do dashboardu
- [ ] API endpointy testovány
- [ ] Frontend komponenty se zobrazují
- [ ] Skillpoint alokace funguje
- [ ] XP bonusy se aplikují
- [ ] Job skillpoints se udělují
- [ ] Všechny efekty se zobrazují správně

---

## 🎯 Příštích kroků

1. **Další atributy**: Přidat další personalizované atributy dle potřeby
2. **Synergy bonusy**: Přidat zvláštní bonus když jsou všechny atributy na určité úrovni
3. **Atribut queesty**: Přidat speciální questy pro zlepšení atributů
4. **Leaderboard**: Přidat leaderboard s "highest attribute score"
5. **Badges**: Přidat specia badges pro maximální atributy
