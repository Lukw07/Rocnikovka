-- ============================================================================
-- ROLLBACK SCRIPT FOR CONSOLIDATED MIGRATION
-- ============================================================================
-- Description: Removes all changes made by consolidated_migration.sql
-- Date: 2026-01-03
-- WARNING: This will DELETE all data in the affected tables!
-- ============================================================================

-- Always create a backup before running this script!

BEGIN;

-- ============================================================================
-- SECTION 1: DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS quest_completion_validation ON "QuestProgress";

-- ============================================================================
-- SECTION 2: DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS prevent_duplicate_quest_completion() CASCADE;

-- ============================================================================
-- SECTION 3: DROP CONSTRAINTS (if they need to be removed separately)
-- ============================================================================

-- Note: Constraints will be automatically dropped when tables are dropped
-- But if you need to remove only constraints without dropping tables:

-- ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "non_negative_currency";
-- ALTER TABLE "UserInventory" DROP CONSTRAINT IF EXISTS "positive_quantity";
-- ALTER TABLE "BlackMarketOffer" DROP CONSTRAINT IF EXISTS "stock_limit";
-- ALTER TABLE "PersonalGoal" DROP CONSTRAINT IF EXISTS "reasonable_progress";
-- ALTER TABLE "RandomFindCooldown" DROP CONSTRAINT IF EXISTS "daily_finds_limit";
-- ALTER TABLE "TradingReputation" DROP CONSTRAINT IF EXISTS "trust_score_range";
-- ALTER TABLE "MarketplaceListing" DROP CONSTRAINT IF EXISTS "listing_sold_consistency";

-- ============================================================================
-- SECTION 4: DROP TABLES (in reverse dependency order)
-- ============================================================================

-- Personal Space
DROP TABLE IF EXISTS "Furniture" CASCADE;
DROP TABLE IF EXISTS "PersonalSpace" CASCADE;

-- Awards & Goals
DROP TABLE IF EXISTS "VirtualAward" CASCADE;
DROP TABLE IF EXISTS "PersonalGoal" CASCADE;

-- Black Market
DROP TABLE IF EXISTS "ContrabandTrade" CASCADE;
DROP TABLE IF EXISTS "BlackMarketItem" CASCADE;

-- Trading & Marketplace
DROP TABLE IF EXISTS "ItemWatchlist" CASCADE;
DROP TABLE IF EXISTS "TradingReputation" CASCADE;
DROP TABLE IF EXISTS "TradingTransaction" CASCADE;
DROP TABLE IF EXISTS "ItemPriceHistory" CASCADE;

-- Trading System
DROP TABLE IF EXISTS "Trade" CASCADE;
DROP TABLE IF EXISTS "TradeOffer" CASCADE;

-- Random Finds
DROP TABLE IF EXISTS "RandomFind" CASCADE;

-- Dungeons & Bosses
DROP TABLE IF EXISTS "DamageLog" CASCADE;
DROP TABLE IF EXISTS "DungeonRun" CASCADE;
DROP TABLE IF EXISTS "Boss" CASCADE;

-- Guilds
DROP TABLE IF EXISTS "GuildActivity" CASCADE;
DROP TABLE IF EXISTS "GuildMember" CASCADE;
DROP TABLE IF EXISTS "Guild" CASCADE;

-- Quest System
DROP TABLE IF EXISTS "QuestProgress" CASCADE;
DROP TABLE IF EXISTS "Quest" CASCADE;

-- ============================================================================
-- SECTION 5: DROP ENUMS
-- ============================================================================

DROP TYPE IF EXISTS "ListingStatus" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "QuestStatus" CASCADE;
DROP TYPE IF EXISTS "QuestDifficulty" CASCADE;
DROP TYPE IF EXISTS "GoalStatus" CASCADE;
DROP TYPE IF EXISTS "TradeStatus" CASCADE;
DROP TYPE IF EXISTS "DungeonStatus" CASCADE;
DROP TYPE IF EXISTS "GuildMemberRole" CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if all tables were removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'Furniture', 'PersonalSpace', 'VirtualAward', 'PersonalGoal',
    'ContrabandTrade', 'BlackMarketItem', 'ItemWatchlist', 
    'TradingReputation', 'TradingTransaction', 'ItemPriceHistory',
    'Trade', 'TradeOffer', 'RandomFind', 'DamageLog', 'DungeonRun',
    'Boss', 'GuildActivity', 'GuildMember', 'Guild', 'QuestProgress', 'Quest'
  );

-- Check if all enums were removed
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
  AND typname IN (
    'ListingStatus', 'TransactionType', 'QuestStatus', 'QuestDifficulty',
    'GoalStatus', 'TradeStatus', 'DungeonStatus', 'GuildMemberRole'
  );

COMMIT;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================

-- If you see any tables/enums listed above, the rollback was not complete.
-- You may need to manually investigate dependencies.
