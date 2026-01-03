-- ============================================================================
-- CONSOLIDATED DATABASE MIGRATION
-- ============================================================================
-- Description: Complete migration including all gamification systems, 
--              trading features, quest system, and security constraints
-- Date: 2026-01-03
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE ENUMS
-- ============================================================================

CREATE TYPE "GuildMemberRole" AS ENUM ('LEADER', 'OFFICER', 'MEMBER');
CREATE TYPE "DungeonStatus" AS ENUM ('AVAILABLE', 'IN_COMBAT', 'COMPLETED', 'FAILED');
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'EXPIRED');
CREATE TYPE "QuestDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'LEGENDARY');
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- Add TransactionType enum values if not exists
DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM (
        'MARKETPLACE',
        'P2P_TRADE',
        'SHOP_PURCHASE',
        'BLACK_MARKET',
        'QUEST_REWARD',
        'EVENT_REWARD',
        'ADMIN_GRANT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add ListingStatus enum values if not exists  
DO $$ BEGIN
    CREATE TYPE "ListingStatus" AS ENUM (
        'ACTIVE',
        'SOLD',
        'CANCELLED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SECTION 2: QUEST SYSTEM
-- ============================================================================

CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "QuestDifficulty" NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "moneyReward" INTEGER NOT NULL DEFAULT 0,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quest_category_idx" ON "Quest"("category");
CREATE INDEX "Quest_difficulty_idx" ON "Quest"("difficulty");
CREATE INDEX "Quest_requiredLevel_idx" ON "Quest"("requiredLevel");
CREATE INDEX "Quest_status_idx" ON "Quest"("status");

CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "QuestProgress"("userId", "questId");
CREATE INDEX "QuestProgress_userId_idx" ON "QuestProgress"("userId");
CREATE INDEX "QuestProgress_questId_idx" ON "QuestProgress"("questId");
CREATE INDEX "QuestProgress_status_idx" ON "QuestProgress"("status");
CREATE INDEX "QuestProgress_completedAt_idx" ON "QuestProgress"("completedAt");

-- ============================================================================
-- SECTION 3: GUILDS
-- ============================================================================

CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" TEXT NOT NULL,
    "treasury" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Guild_name_key" ON "Guild"("name");
CREATE INDEX "Guild_leaderId_idx" ON "Guild"("leaderId");
CREATE INDEX "Guild_level_idx" ON "Guild"("level");

CREATE TABLE "GuildMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "role" "GuildMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuildMember_userId_guildId_key" ON "GuildMember"("userId", "guildId");
CREATE INDEX "GuildMember_userId_idx" ON "GuildMember"("userId");
CREATE INDEX "GuildMember_guildId_idx" ON "GuildMember"("guildId");
CREATE INDEX "GuildMember_role_idx" ON "GuildMember"("role");

CREATE TABLE "GuildActivity" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuildActivity_guildId_idx" ON "GuildActivity"("guildId");
CREATE INDEX "GuildActivity_createdAt_idx" ON "GuildActivity"("createdAt");

-- ============================================================================
-- SECTION 4: DUNGEONS & BOSSES
-- ============================================================================

CREATE TABLE "Boss" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "moneyReward" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boss_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Boss_level_idx" ON "Boss"("level");
CREATE INDEX "Boss_isActive_idx" ON "Boss"("isActive");

CREATE TABLE "DungeonRun" (
    "id" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "status" "DungeonStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentHp" INTEGER NOT NULL,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "participantIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DungeonRun_bossId_idx" ON "DungeonRun"("bossId");
CREATE INDEX "DungeonRun_leaderId_idx" ON "DungeonRun"("leaderId");
CREATE INDEX "DungeonRun_status_idx" ON "DungeonRun"("status");

CREATE TABLE "DamageLog" (
    "id" TEXT NOT NULL,
    "dungeonRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "damage" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DamageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DamageLog_dungeonRunId_idx" ON "DamageLog"("dungeonRunId");
CREATE INDEX "DamageLog_userId_idx" ON "DamageLog"("userId");

-- ============================================================================
-- SECTION 5: RANDOM FINDS
-- ============================================================================

CREATE TABLE "RandomFind" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "rarity" "ItemRarity" NOT NULL,
    "value" INTEGER NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomFind_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RandomFind_userId_idx" ON "RandomFind"("userId");
CREATE INDEX "RandomFind_rarity_idx" ON "RandomFind"("rarity");

-- ============================================================================
-- SECTION 6: TRADING SYSTEM
-- ============================================================================

CREATE TABLE "TradeOffer" (
    "id" TEXT NOT NULL,
    "offeredItemIds" TEXT[],
    "wantedItemIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TradeOffer_createdAt_idx" ON "TradeOffer"("createdAt");

CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Trade_offerId_key" ON "Trade"("offerId");
CREATE INDEX "Trade_requesterId_idx" ON "Trade"("requesterId");
CREATE INDEX "Trade_recipientId_idx" ON "Trade"("recipientId");
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- ============================================================================
-- SECTION 7: TRADING & MARKETPLACE SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ItemPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "averagePrice" INTEGER NOT NULL,
    "lowestPrice" INTEGER NOT NULL,
    "highestPrice" INTEGER NOT NULL,
    "medianPrice" INTEGER NOT NULL,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ItemPriceHistory_itemId_period_periodStart_unique" UNIQUE ("itemId", "period", "periodStart")
);

CREATE INDEX "ItemPriceHistory_itemId_idx" ON "ItemPriceHistory"("itemId");
CREATE INDEX "ItemPriceHistory_period_idx" ON "ItemPriceHistory"("period");
CREATE INDEX "ItemPriceHistory_periodStart_idx" ON "ItemPriceHistory"("periodStart");

CREATE TABLE IF NOT EXISTS "TradingTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "goldAmount" INTEGER NOT NULL DEFAULT 0,
    "gemAmount" INTEGER NOT NULL DEFAULT 0,
    "transactionType" TEXT NOT NULL DEFAULT 'MARKETPLACE',
    "tradeId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "TradingTransaction_sellerId_idx" ON "TradingTransaction"("sellerId");
CREATE INDEX "TradingTransaction_buyerId_idx" ON "TradingTransaction"("buyerId");
CREATE INDEX "TradingTransaction_itemId_idx" ON "TradingTransaction"("itemId");
CREATE INDEX "TradingTransaction_transactionType_idx" ON "TradingTransaction"("transactionType");
CREATE INDEX "TradingTransaction_createdAt_idx" ON "TradingTransaction"("createdAt");
CREATE INDEX "TradingTransaction_tradeId_idx" ON "TradingTransaction"("tradeId");
CREATE INDEX "TradingTransaction_listingId_idx" ON "TradingTransaction"("listingId");

CREATE TABLE IF NOT EXISTS "TradingReputation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalGoldEarned" INTEGER NOT NULL DEFAULT 0,
    "totalGoldSpent" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "positiveReviews" INTEGER NOT NULL DEFAULT 0,
    "negativeReviews" INTEGER NOT NULL DEFAULT 0,
    "isVerifiedTrader" BOOLEAN NOT NULL DEFAULT false,
    "isTrustedSeller" BOOLEAN NOT NULL DEFAULT false,
    "lastTradeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "TradingReputation_userId_idx" ON "TradingReputation"("userId");
CREATE INDEX "TradingReputation_trustScore_idx" ON "TradingReputation"("trustScore");
CREATE INDEX "TradingReputation_totalSales_idx" ON "TradingReputation"("totalSales");

CREATE TABLE IF NOT EXISTS "ItemWatchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "maxPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ItemWatchlist_userId_itemId_unique" UNIQUE ("userId", "itemId")
);

CREATE INDEX "ItemWatchlist_userId_idx" ON "ItemWatchlist"("userId");
CREATE INDEX "ItemWatchlist_itemId_idx" ON "ItemWatchlist"("itemId");

-- ============================================================================
-- SECTION 8: BLACK MARKET
-- ============================================================================

CREATE TABLE "BlackMarketItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "risk" INTEGER NOT NULL DEFAULT 50,
    "reward" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackMarketItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlackMarketItem_risk_idx" ON "BlackMarketItem"("risk");
CREATE INDEX "BlackMarketItem_isActive_idx" ON "BlackMarketItem"("isActive");

CREATE TABLE "ContrabandTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "discoveredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContrabandTrade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContrabandTrade_userId_idx" ON "ContrabandTrade"("userId");
CREATE INDEX "ContrabandTrade_status_idx" ON "ContrabandTrade"("status");

-- ============================================================================
-- SECTION 9: PERSONAL GOALS
-- ============================================================================

CREATE TABLE "PersonalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "reward" INTEGER NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PersonalGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonalGoal_userId_idx" ON "PersonalGoal"("userId");
CREATE INDEX "PersonalGoal_status_idx" ON "PersonalGoal"("status");

-- ============================================================================
-- SECTION 10: VIRTUAL AWARDS
-- ============================================================================

CREATE TABLE "VirtualAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "ItemRarity" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualAward_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VirtualAward_userId_idx" ON "VirtualAward"("userId");
CREATE INDEX "VirtualAward_rarity_idx" ON "VirtualAward"("rarity");

-- ============================================================================
-- SECTION 11: PERSONAL SPACE
-- ============================================================================

CREATE TABLE "PersonalSpace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "layout" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalSpace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonalSpace_userId_key" ON "PersonalSpace"("userId");
CREATE INDEX "PersonalSpace_userId_idx" ON "PersonalSpace"("userId");

CREATE TABLE "Furniture" (
    "id" TEXT NOT NULL,
    "personalSpaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "positionX" INTEGER NOT NULL,
    "positionY" INTEGER NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Furniture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Furniture_personalSpaceId_idx" ON "Furniture"("personalSpaceId");

-- ============================================================================
-- SECTION 12: FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE "GuildMember" ADD CONSTRAINT "GuildMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuildMember" ADD CONSTRAINT "GuildMember_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuildActivity" ADD CONSTRAINT "GuildActivity_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DungeonRun" ADD CONSTRAINT "DungeonRun_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "Boss"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DamageLog" ADD CONSTRAINT "DamageLog_dungeonRunId_fkey" FOREIGN KEY ("dungeonRunId") REFERENCES "DungeonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RandomFind" ADD CONSTRAINT "RandomFind_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RandomFind" ADD CONSTRAINT "RandomFind_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Trade" ADD CONSTRAINT "Trade_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "TradeOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContrabandTrade" ADD CONSTRAINT "ContrabandTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContrabandTrade" ADD CONSTRAINT "ContrabandTrade_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BlackMarketItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalGoal" ADD CONSTRAINT "PersonalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VirtualAward" ADD CONSTRAINT "VirtualAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalSpace" ADD CONSTRAINT "PersonalSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Furniture" ADD CONSTRAINT "Furniture_personalSpaceId_fkey" FOREIGN KEY ("personalSpaceId") REFERENCES "PersonalSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 13: CRITICAL SECURITY CONSTRAINTS
-- ============================================================================

-- Prevent negative currency (gold, gems)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "non_negative_currency";
ALTER TABLE "User" ADD CONSTRAINT "non_negative_currency" 
CHECK (gold >= 0 AND gems >= 0);

-- Prevent negative inventory quantities
ALTER TABLE "UserInventory" DROP CONSTRAINT IF EXISTS "positive_quantity";
ALTER TABLE "UserInventory" ADD CONSTRAINT "positive_quantity" 
CHECK (quantity >= 0);

-- Prevent overselling on Black Market
ALTER TABLE "BlackMarketOffer" DROP CONSTRAINT IF EXISTS "stock_limit";
ALTER TABLE "BlackMarketOffer" ADD CONSTRAINT "stock_limit" 
CHECK ("soldCount" <= stock);

-- Reasonable progress limit on Personal Goals (allow 2x overflow for flexibility)
ALTER TABLE "PersonalGoal" DROP CONSTRAINT IF EXISTS "reasonable_progress";
ALTER TABLE "PersonalGoal" ADD CONSTRAINT "reasonable_progress" 
CHECK ("currentValue" <= "targetValue" * 2);

-- Daily finds limit for random finds
ALTER TABLE "RandomFindCooldown" DROP CONSTRAINT IF EXISTS "daily_finds_limit";
ALTER TABLE "RandomFindCooldown" ADD CONSTRAINT "daily_finds_limit" 
CHECK ("findsToday" <= "dailyLimit");

-- Trust score range validation (0-100)
ALTER TABLE "TradingReputation" DROP CONSTRAINT IF EXISTS "trust_score_range";
ALTER TABLE "TradingReputation" ADD CONSTRAINT "trust_score_range" 
CHECK ("trustScore" >= 0 AND "trustScore" <= 100);

-- Marketplace listing consistency
ALTER TABLE "MarketplaceListing" DROP CONSTRAINT IF EXISTS "listing_sold_consistency";
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "listing_sold_consistency"
CHECK (
  (status = 'SOLD' AND "soldAt" IS NOT NULL AND "buyerId" IS NOT NULL) OR
  (status != 'SOLD')
);

-- ============================================================================
-- SECTION 14: TRIGGERS FOR COMPLEX VALIDATIONS
-- ============================================================================

-- Function to prevent duplicate quest completions for non-repeatable quests
CREATE OR REPLACE FUNCTION prevent_duplicate_quest_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' THEN
    IF EXISTS (
      SELECT 1 
      FROM "QuestProgress" qp
      JOIN "Quest" q ON q.id = qp."questId"
      WHERE qp."userId" = NEW."userId"
        AND qp."questId" = NEW."questId"
        AND qp.status = 'COMPLETED'
        AND qp.id != NEW.id
        AND q."isRepeatable" = FALSE
    ) THEN
      RAISE EXCEPTION 'Quest already completed and is not repeatable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS quest_completion_validation ON "QuestProgress";
CREATE TRIGGER quest_completion_validation
  BEFORE UPDATE ON "QuestProgress"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_quest_completion();

-- ============================================================================
-- SECTION 15: DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT "non_negative_currency" ON "User" IS 
'Prevents negative gold and gems values to avoid currency exploits';

COMMENT ON CONSTRAINT "positive_quantity" ON "UserInventory" IS 
'Ensures inventory items cannot have negative quantities';

COMMENT ON CONSTRAINT "stock_limit" ON "BlackMarketOffer" IS 
'Prevents overselling - soldCount cannot exceed available stock';

COMMENT ON CONSTRAINT "reasonable_progress" ON "PersonalGoal" IS 
'Allows progress up to 2x target value for flexibility while preventing extreme overflow';

COMMENT ON CONSTRAINT "daily_finds_limit" ON "RandomFindCooldown" IS 
'Enforces daily limit on random item finds to prevent spam';

COMMENT ON CONSTRAINT "trust_score_range" ON "TradingReputation" IS 
'Constrains trust score to valid range (0-100)';

COMMENT ON CONSTRAINT "listing_sold_consistency" ON "MarketplaceListing" IS 
'Ensures sold listings have soldAt timestamp and buyerId set';

COMMENT ON FUNCTION prevent_duplicate_quest_completion() IS 
'Prevents duplicate completions of non-repeatable quests';

COMMENT ON TABLE "ItemPriceHistory" IS 'Historical price data for items for trend analysis';
COMMENT ON TABLE "TradingTransaction" IS 'Complete audit log of all trading transactions';
COMMENT ON TABLE "TradingReputation" IS 'User reputation in trading system';
COMMENT ON TABLE "ItemWatchlist" IS 'User watchlist for item price alerts';

-- ============================================================================
-- END OF CONSOLIDATED MIGRATION
-- ============================================================================
