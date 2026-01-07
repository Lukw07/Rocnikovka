# Consolidated Migration Guide

## Přehled

Tento dokument popisuje konsolidovanou databázovou migraci, která sjednocuje všechny dílčí migrace do jednoho souboru pro jednodušší správu a nasazení.

## 📋 Co obsahuje konsolidovaná migrace

Soubor `prisma/migrations/consolidated_migration.sql` zahrnuje:

### 1. **Quest System**
- Tabulky `Quest` a `QuestProgress`
- Enums: `QuestDifficulty`, `QuestStatus`
- Indexy pro rychlé vyhledávání questů

### 2. **Guild System**
- Tabulky `Guild`, `GuildMember`, `GuildActivity`
- Enum `GuildMemberRole`
- Správa členství a aktivit v guildách

### 3. **Dungeons & Bosses**
- Tabulky `Boss`, `DungeonRun`, `DamageLog`
- Enum `DungeonStatus`
- Systém pro boje s bossy

### 4. **Trading System**
- Tabulky `TradeOffer`, `Trade`, `TradingTransaction`, `TradingReputation`, `ItemWatchlist`, `ItemPriceHistory`
- Enums: `TradeStatus`, `TransactionType`, `ListingStatus`
- Kompletní trading a marketplace funkcionalita

### 5. **Black Market**
- Tabulky `BlackMarketItem`, `ContrabandTrade`
- Systém pro černý trh s rizikovými obchody

### 6. **Personal Goals & Awards**
- Tabulky `PersonalGoal`, `VirtualAward`
- Enum `GoalStatus`
- Osobní cíle a virtuální odměny

### 7. **Personal Space**
- Tabulky `PersonalSpace`, `Furniture`
- Systém pro personalizaci uživatelského prostoru

### 8. **Random Finds**
- Tabulka `RandomFind`
- Systém náhodných nálezů předmětů

### 9. **Security Constraints**
- 7 kritických check constraints:
  - `non_negative_currency` - Zabránění záporným hodnotám měny
  - `positive_quantity` - Zabránění záporným množstvím v inventáři
  - `stock_limit` - Zabránění přeprodání na Black Market
  - `reasonable_progress` - Limit na progress osobních cílů
  - `daily_finds_limit` - Denní limit náhodných nálezů
  - `trust_score_range` - Validace trust score (0-100)
  - `listing_sold_consistency` - Konzistence prodaných nabídek

### 10. **Database Triggers**
- `prevent_duplicate_quest_completion()` - Zabránění duplicitním dokončením questů

## 🚀 Jak aplikovat konsolidovanou migraci

### Příprava

1. **Záloha databáze** (KRITICKÉ!)
```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -h localhost -U postgres -d edurpg > "backup_before_consolidated_$timestamp.sql"
```

2. **Kontrola Prisma připojení**
```powershell
npx prisma db pull
```

### Aplikace migrace

**Metoda 1: Pomocí psql (doporučeno)**
```powershell
# Z kořenového adresáře projektu
psql -h localhost -U postgres -d edurpg -f "prisma\migrations\consolidated_migration.sql"
```

**Metoda 2: Pomocí Prisma**
```powershell
npx prisma db execute --file prisma/migrations/consolidated_migration.sql --schema prisma/schema.prisma
```

### Verifikace

```powershell
# Kontrola schématu
npx prisma db pull

# Kontrola constraints
psql -h localhost -U postgres -d edurpg -c "
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
ORDER BY conrelid::regclass::text;
"

# Kontrola triggerů
psql -h localhost -U postgres -d edurpg -c "
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
"
```

## ⚠️ Důležité poznámky

### Nedestruktivní změny
- Všechny změny jsou **additivní** - nepřidávají se žádné DROP statements
- Existující data zůstávají zachována
- Nové tabulky se vytvoří pouze pokud neexistují (`CREATE TABLE IF NOT EXISTS` pro některé tabulky)

### Kompatibilita s existujícími migracemi
Pokud již máte aplikovány některé z následujících migrací:
- `add_quests_system/`
- `add_all_gamification_systems/`
- `add_trading_system.sql`
- `add_database_constraints/`

**Budete muset upravit konsolidovanou migraci** a vykomentovat části, které již byly aplikovány.

### Doporučený postup pro existující databáze

1. **Nový projekt** - použijte `consolidated_migration.sql` přímo
2. **Existující projekt** - doporučujeme:
   - Ponechat existující migrace
   - Použít `consolidated_migration.sql` pouze jako referenci
   - Nebo vytvořit novou databázi a migrovat data

## 🔄 Rollback

V případě problémů:

```powershell
# Obnovení ze zálohy
psql -h localhost -U postgres -d edurpg < "backup_before_consolidated_TIMESTAMP.sql"

# Nebo manuální odstranění
psql -h localhost -U postgres -d edurpg -f "prisma\migrations\rollback_consolidated.sql"
```

Soubor `rollback_consolidated.sql` by měl obsahovat:
```sql
-- DROP všech vytvořených tabulek
DROP TABLE IF EXISTS "Furniture" CASCADE;
DROP TABLE IF EXISTS "PersonalSpace" CASCADE;
DROP TABLE IF EXISTS "VirtualAward" CASCADE;
DROP TABLE IF EXISTS "PersonalGoal" CASCADE;
-- ... atd pro všechny tabulky

-- DROP všech enumů
DROP TYPE IF EXISTS "GoalStatus" CASCADE;
DROP TYPE IF EXISTS "TradeStatus" CASCADE;
-- ... atd

-- DROP všech funkcí
DROP FUNCTION IF EXISTS prevent_duplicate_quest_completion() CASCADE;
```

## 📊 Struktura migrace

Konsolidovaná migrace je rozdělena do 15 sekcí:

1. **CREATE ENUMS** - Definice všech enum typů
2. **QUEST SYSTEM** - Quest tabulky a indexy
3. **GUILDS** - Guild systém
4. **DUNGEONS & BOSSES** - Dungeon mechanika
5. **RANDOM FINDS** - Náhodné nálezy
6. **TRADING SYSTEM** - P2P trading
7. **TRADING & MARKETPLACE SYSTEM** - Marketplace
8. **BLACK MARKET** - Černý trh
9. **PERSONAL GOALS** - Osobní cíle
10. **VIRTUAL AWARDS** - Virtuální odměny
11. **PERSONAL SPACE** - Uživatelský prostor
12. **FOREIGN KEY CONSTRAINTS** - Referenční integrita
13. **CRITICAL SECURITY CONSTRAINTS** - Bezpečnostní omezení
14. **TRIGGERS** - Databázové triggery
15. **DOCUMENTATION COMMENTS** - Komentáře pro dokumentaci

## 🎯 Výhody konsolidace

✅ **Jednodušší správa** - Jeden soubor místo čtyř  
✅ **Lepší přehlednost** - Logické sekce s komentáři  
✅ **Konzistentní pořadí** - Enums → Tabulky → Constraints → Triggers  
✅ **Snadnější deployment** - Jedna transakce  
✅ **Lepší dokumentace** - Kompletní přehled všech změn  

## 🔗 Související dokumenty

- [DATABASE_AUDIT_CHANGES.md](./DATABASE_AUDIT_CHANGES.md) - Detailní popis všech změn z auditu
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Původní průvodce migrací
- [prisma/schema.prisma](./prisma/schema.prisma) - Aktuální Prisma schéma

## 📝 Poznámky pro budoucí migrace

Pokud budete přidávat nové funkce:

1. **Přidejte novou sekci** do konsolidované migrace
2. **Aktualizujte dokumentaci** v tomto souboru
3. **Otestujte na dev databázi** před aplikací na produkci
4. **Vytvořte zálohu** před každou změnou

---

**Datum vytvoření:** 2026-01-03  
**Verze:** 1.0  
**Autor:** AI Database Agent
