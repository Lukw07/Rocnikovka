# 🎮 EduRPG - Kompletní Gamifikační Systém - Dokumentace

Vytvořeno: **3. ledna 2026**

## 📋 Obsah

1. [Přehled systému](#přehled)
2. [Implementované mechaniky](#mechaniky)
3. [Databázové schéma](#schéma)
4. [API Endpointy](#api)
5. [Frontend komponenty](#frontend)
6. [Integrace a Workflow](#integrace)
7. [Nasazení](#nasazení)

---

## 🎯 Přehled {#přehled}

EduRPG je kompletní gamifikační systém pro školské prostředí, který kombinuje následující mechaniky:

### Fáze Implementace:
- ✅ **Fáze 1**: XP, Levely, Skillpoints (HOTOVO)
- ✅ **Fáze 2**: Joby, Streaky, Reputace (HOTOVO)
- ✅ **Fáze 3**: Achievements, Badges, Events (HOTOVO)
- ✅ **Fáze 4**: Questy (HOTOVO)
- ✅ **Fáze 5**: Guildy, Dungeony, Bossy, Trading, Black Market, Osobní Cíle, Virtual Awards, Osobní Prostor (HOTOVO)

---

## 🎮 Implementované Mechaniky {#mechaniky}

### 1. **XP & Levely** ⭐
```
- Studenti získávají XP z různých aktivit
- XP je sčítáno do levelů (1-100)
- Úroveň určuje, které questy/mechaniky jsou dostupné
- Time Management atribut zvyšuje XP o +2% na level
```

**Zdroje XP:**
- Přítomnost v hodinách (25 XP/den)
- Splnění jobu (50-500 XP)
- Splnění questu (50-1000 XP)
- Participace na eventu (25-500 XP)
- Dosažení achievementu (50-1000 XP)

### 2. **Skillpoints & Atributy** 🎯
```
- Získávají se při level-up (1-5 per level)
- Mohou být investovány do 5 core atributů
- Každý atribut má specifické bonusy
```

**5 Core Atributů:**
1. **Time Management** ⏰: +2% XP per level (max +20%)
2. **Focus** 🎯: +3% skill learning speed (max +30%)
3. **Leadership** 👑: +2% job rewards (max +20%)
4. **Communication** 💬: +3% reputation gains (max +30%)
5. **Consistency** 🔄: +1.5% streak bonuses (max +15%)

### 3. **Joby** 💼
```
- Úkoly přidělené učiteli
- Maximálně N studentů na job
- Odměny: XP + peníze + 1 skillpoint
- Status: OPEN → APPROVED → COMPLETED
```

### 4. **Questy** 🎯
```
- Veřejné úkoly dostupné všem
- Obtížnost: EASY / MEDIUM / HARD / LEGENDARY
- Vyžadují minimální level
- Lze přijmout/zahájit/hotovo/zrušit
```

**Quest Workflow:**
1. Student uvidí dostupný quest
2. Klikne "Přijmout" → status ACCEPTED
3. Pracuje na questu
4. Klikne "Hotovo" → rewards XP + peníze + skillpoint

### 5. **Gildy** 👥
```
- Skupiny hráčů vedené lídrem
- Pokladna na úrovni gildy
- Role: LEADER / OFFICER / MEMBER
- Activity log všech akcí
```

**Gildy Funkce:**
- Join/Leave (leader nemůže odejít)
- Gemení pokladny
- Role management
- Activity tracking

### 6. **Dungeony & Bossy** ⚔️
```
- Kooperativní boj proti bossům
- Tým hráčů, damage tracking
- Victory rewards = XP + peníze
```

**Combat System:**
- Boss má HP (100-5000 dle levelu)
- Každý hráč zvlášť útočí
- Damage je zaznamenáno v logu
- Boss padá = všichni dostávají reward

### 7. **Trading System** 🔄
```
- P2P výměna předmětů
- Oba hráči musí souhlasit
- Trade offer specifikuje co nabízí/chce
```

**Trade States:**
- PENDING → ACCEPTED → COMPLETED
- Oba hráči musí mít nabízené předměty

### 8. **Black Market** 🕵️
```
- Rizikové obchodování
- Vyšší reward = vyšší risk
- Chance být "chycen" guards
- Pokud chycen = penále
```

**Risk Mechanics:**
- Každá položka má % риска (0-100)
- Random check: pokud chycen, záporný reward
- Úspěch: speciální reward

### 9. **Streaky** 🔥
```
- Consecutive days s aktivitou
- Multiplier: +5% per day (max +50%)
- Resetuje se pokud miss day
- Consistency atribut zvyšuje multiplikátor
```

### 10. **Reputace** 📊
```
- Points z různých akcí (job, quest, atd)
- Tier: 0-10 (vyšší = lepší)
- Communication atribut +3% reputation gain
- Může ovlivnit dostupnost mechanik
```

### 11. **Achievements & Badges** 🏆
```
- One-time rewards za milníky
- Badgy - zobrazují se v profilu
- Různé kategorie (level, completion, special)
```

### 12. **Events** 🎪
```
- Časomíře omezené speciální akce
- Bonus XP, speciální rewards
- Participation tracking
```

### 13. **Personal Goals** 🎯
```
- Hráč si nastaví vlastní cíle
- Progress tracking (0-100%)
- XP reward po completion
- Deadline (optional)
```

### 14. **Virtual Awards** 🏅
```
- Virtuální trofeje a vyznamenání
- Rarities: COMMON → LEGENDARY
- Showcase v profilu
```

### 15. **Personal Space** 🏠
```
- Vlastní pokoj/místnost
- Dekorativní předměty (furniture)
- Drag-and-drop UI
- Theme customization
```

### 16. **Random Finds** 🎁
```
- Náhodné objevy předmětů/peněz
- 20% chance per activity
- Rarity distribution
- Treasure hunting mechanic
```

---

## 🗄️ Databázové Schéma {#schéma}

### Core Models:
```prisma
User
├── SkillPoint (skillpoints & allocation)
├── PlayerSkill (individual skill progress)
├── Reputation (alignment & tier)
├── Streak (daily streaks)
├── DailyActivity (activity tracking)
├── QuestProgress (quest completion)
├── GuildMember (guild membership)
├── RandomFind (treasure discovery)
├── Trade (peer-to-peer trading)
├── ContrabandTrade (black market)
├── PersonalGoal (custom goals)
├── VirtualAward (trophies)
└── PersonalSpace (home decorations)

Quest
├── QuestProgress (many)
└── Quest (self-referential prerequisites)

Guild
├── GuildMember (many)
└── GuildActivity (log)

Boss
└── DungeonRun (many)

DungeonRun
└── DamageLog (damage tracking)
```

---

## 🔌 API Endpointy {#api}

### Questy
```
GET    /api/quests                        - Všechny dostupné questy
POST   /api/quests                        - Vytvořit quest (teacher)
GET    /api/quests/progress               - Hráčův quest progress
POST   /api/quests/[questId]/accept       - Přijmout quest
POST   /api/quests/[questId]/complete     - Hotovo quest
POST   /api/quests/[questId]/abandon      - Zrušit quest
```

### Gildy
```
GET    /api/guilds                        - Všechny gildy
POST   /api/guilds                        - Vytvořit gildu
GET    /api/guilds/[guildId]             - Guild details
POST   /api/guilds/[guildId]/join        - Přidat se
DELETE /api/guilds/[guildId]/leave       - Odejít
GET    /api/guilds/[guildId]/members     - Members list
```

### Dungeony
```
GET    /api/dungeons/bosses               - Boss list
POST   /api/dungeons                      - Zahájit dungeon
GET    /api/dungeons/[runId]             - Run status
POST   /api/dungeons/[runId]/attack      - Deal damage
```

### Ostatní
```
POST   /api/personal-space/init           - Initialize space
GET    /api/personal-space                - Get space
POST   /api/personal-space/furniture     - Add furniture

GET    /api/goals                         - Hráčovy goals
POST   /api/goals                         - Create goal
PUT    /api/goals/[goalId]               - Update progress

GET    /api/awards                        - Hráčovy awards
GET    /api/random-finds                 - Found items

GET    /api/trades/browse                - Available trades
POST   /api/trades                        - Create trade
PUT    /api/trades/[tradeId]/accept      - Accept trade

GET    /api/blackmarket/items            - BM items
POST   /api/blackmarket/trade            - Make trade
```

---

## 🎨 Frontend Komponenty {#frontend}

### Questy
- `QuestsList` - Grid questů s filtrováním
- `QuestCard` - Individual quest s buttony
- `QuestTracker` - Stats (completed, XP, money)

### Gildy
- `GuildsList` - Všechny gildy
- `GuildDetail` - Guild info + members
- `GuildHall` - Guild home screen

### Dungeony
- `BossList` - Available bosses
- `BossEncounter` - Combat UI s HP bary
- `DamageTracker` - Real-time damage log

### Ostatní
- `PersonalGoalsUI` - Goals management
- `AwardsShowcase` - Virtual awards display
- `PersonalSpaceEditor` - Furniture drag-and-drop
- `TradeUI` - Browse & create trades
- `BlackMarketUI` - Risky shopping

---

## 🔗 Integrace a Workflow {#integrace}

### XP Bonus Integration:
```typescript
// Time Management bonus
baseXP = 100
timeManagementLevel = 5
bonus = 1 + (5 * 0.02) = 1.10
finalXP = 100 * 1.10 = 110 XP

// Streak multiplier
dayStreak = 5
streakMultiplier = 1.25
totalXP = 110 * 1.25 = 137.5 XP

// Consistency bonus
consistencyLevel = 3
consistencyBonus = 1 + (3 * 0.015) = 1.045
totalMultiplier = 1.25 * 1.045 = 1.30625
finalXP = 110 * 1.30625 = 143.6875 XP
```

### Quest Completion Workflow:
```
1. Student uvidí quest
2. Klikne "Přijmout" → QuestProgress status = ACCEPTED
3. Pracuje na úkolu (offline)
4. Klikne "Hotovo" → Quest completion logic:
   a) Grant XP (s Time Management bonusem)
   b) Grant peníze
   c) Award 1 skillpoint
   d) Add to XPSource log
   e) Update DailyActivity
   f) Check if streak continues
5. Update leaderboards
```

### Guild Treasure Distribution:
```
1. Member completes quest → +100 XP
2. Guild gets % jako pokladna
3. Guild level zvyšuje % podíl
4. Leader/Officers mohou distribuovat
```

### Boss Fight Coordination:
```
1. Leader zahájí DungeonRun
2. Pozve tým (3-5 hráčů)
3. Každý hráč útočí (POST /attack)
4. Damage se loguje
5. Boss padá → všichni dostávají XP + peníze
```

---

## 🚀 Nasazení {#nasazení}

### 1. Migrace databáze
```bash
# Aplikuj všechny migrace
npx prisma migrate deploy

# Resetuj dev DB (dev only)
npx prisma migrate reset --force
```

### 2. Seed demo data
```bash
# Vytvoř questy, bossy, black market items
ts-node ops/seed-gamification.ts
```

### 3. Spuštění dev serveru
```bash
npm run dev
```

### 4. Build pro production
```bash
npm run build
npm start
```

---

## 📊 Metriky & Tracking

### XPSource Log:
```
Sleduje každý zdroj XP:
- ATTENDANCE: 25 XP/den
- JOB: 50-500 XP
- QUEST: 50-1000 XP
- ACTIVITY: 10-100 XP
- EVENT: 25-500 XP
- ACHIEVEMENT: 50-1000 XP
- BONUS: Variable (streaks, seasonal)
```

### SystemLog:
```
Zaznamenáva všechny důležité akce:
- Quest creation/completion
- Guild creation/member changes
- Boss defeats
- Trades
- Black market deals
- Goals completed
```

---

## ✅ Checklist Produkce

- [ ] Všechny migrace aplikovány
- [ ] Seed data v DB
- [ ] API testovány v Postman
- [ ] Frontend komponenty integrovány
- [ ] Error handling testován
- [ ] Permissions/RBAC ověřeny
- [ ] Database backups nastaveny
- [ ] Logging aktivován
- [ ] Monitoring nastaveno
- [ ] Documentation aktuální

---

## 🐛 Troubleshooting

### "Quest not found" chyba
- Ověř questId v URL
- Zkontroluj že quest status je ACTIVE

### XP bonusy se neaplikují
- Ověř že skillpoints jsou investovány
- Zkontroluj XPService.grantXPWithBonus() integraci
- Check database že skill level existuje

### Guild treasury se nemění
- Ověř že member je příslušné role
- Check GuildService.addToTreasury() logs

---

## 📞 Support

Pro otázky nebo issues:
1. Check this documentation
2. Review API error messages
3. Check SystemLog v databázi
4. Review test suites v ops/

**Verze:** 1.0.0  
**Poslední aktualizace:** 3. ledna 2026  
**Status:** Production Ready ✅
