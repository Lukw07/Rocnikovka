# 🚀 Quick Migration Guide

## Před Migrací

```bash
# 1. Backup databáze
pg_dump -U your_user edurpg > backup_before_audit_$(date +%Y%m%d).sql

# 2. Validace Prisma schema
npx prisma validate

# 3. Kontrola existujících dat
psql -U your_user -d edurpg -c "SELECT COUNT(*) FROM \"User\" WHERE gold < 0 OR gems < 0;"
```

## Aplikace Migrace

```bash
# Development
psql -U your_user -d edurpg_dev -f prisma/migrations/add_database_constraints/migration.sql

# Production (použij transakci)
psql -U your_user -d edurpg_prod << 'EOF'
BEGIN;
\i prisma/migrations/add_database_constraints/migration.sql
COMMIT;
EOF
```

## Po Migraci

```bash
# 1. Regenerovat Prisma Client
npx prisma generate

# 2. Restart aplikace
pm2 restart edurpg

# 3. Kontrola constraints
psql -U your_user -d edurpg -c "\d+ \"User\"" | grep CHECK
```

## Rollback (pokud potřeba)

```sql
-- Odstranit všechny constraints
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "non_negative_currency";
ALTER TABLE "UserInventory" DROP CONSTRAINT IF EXISTS "positive_quantity";
ALTER TABLE "BlackMarketOffer" DROP CONSTRAINT IF EXISTS "stock_limit";
ALTER TABLE "PersonalGoal" DROP CONSTRAINT IF EXISTS "reasonable_progress";
ALTER TABLE "RandomFindCooldown" DROP CONSTRAINT IF EXISTS "daily_finds_limit";
ALTER TABLE "TradingReputation" DROP CONSTRAINT IF EXISTS "trust_score_range";
ALTER TABLE "MarketplaceListing" DROP CONSTRAINT IF EXISTS "listing_sold_consistency";

-- Odstranit trigger
DROP TRIGGER IF EXISTS quest_completion_validation ON "QuestProgress";
DROP FUNCTION IF EXISTS prevent_duplicate_quest_completion();
```

## Verifikace

```bash
# Test constraint funkčnosti
npm run test:db-constraints

# Monitor logs
tail -f logs/app.log | grep -i constraint
```
