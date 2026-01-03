-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('TIMED', 'STORY', 'BOSS_BATTLE', 'SEASONAL', 'COMPETITION');

-- CreateEnum
CREATE TYPE "public"."EventCategory" AS ENUM ('ACADEMIC', 'SOCIAL', 'COMPETITION', 'SPECIAL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "public"."EventRewardType" AS ENUM ('XP', 'COINS', 'ITEM', 'BADGE', 'TITLE', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ACHIEVEMENT_UNLOCKED', 'ACHIEVEMENT_PROGRESS', 'STREAK_MILESTONE', 'LEVEL_UP', 'QUEST_COMPLETED', 'REWARD_RECEIVED', 'GUILD_INVITE', 'EVENT_STARTED', 'EVENT_ENDING_SOON', 'BOSS_SPAWNED', 'BOSS_DEFEATED', 'EVENT_PHASE_UNLOCKED', 'FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_EVENT_JOIN', 'FRIEND_ACHIEVEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."JobTier" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."AchievementType" AS ENUM ('NORMAL', 'HIDDEN', 'TEMPORARY', 'PROGRESSIVE', 'STREAK');

-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('LEVEL', 'XP', 'ACTIVITY', 'QUEST', 'JOB', 'SKILL', 'REPUTATION', 'SOCIAL', 'COLLECTION', 'SPECIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."QuestDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."QuestStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."QuestType" AS ENUM ('STANDARD', 'MINI_GAME', 'GUILD', 'DAILY', 'WEEKLY', 'EVENT');

-- CreateEnum
CREATE TYPE "public"."GuildMemberRole" AS ENUM ('LEADER', 'OFFICER', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."DungeonStatus" AS ENUM ('AVAILABLE', 'IN_COMBAT', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."RewardCategory" AS ENUM ('FOOD', 'ENTERTAINMENT', 'SCHOOL_PERKS', 'MERCHANDISE', 'GIFT_CARD', 'EVENT_TICKET', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TeacherBadgeType" AS ENUM ('JOB_MASTER', 'QUEST_ARCHITECT', 'EVENT_ORGANIZER', 'STUDENT_FAVORITE', 'FAST_RESPONDER', 'ENGAGEMENT_CHAMPION', 'INNOVATION_AWARD', 'CONSISTENCY_MASTER', 'TOP_MOTIVATOR', 'LEGENDARY_EDUCATOR');

-- CreateEnum
CREATE TYPE "public"."BadgeRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('MARKETPLACE', 'P2P_TRADE', 'SHOP_PURCHASE', 'BLACK_MARKET', 'QUEST_REWARD', 'EVENT_REWARD', 'ADMIN_GRANT');

-- CreateEnum
CREATE TYPE "public"."FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FriendQuestType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'LIMITED');

-- CreateEnum
CREATE TYPE "public"."FriendQuestStatus" AS ENUM ('AVAILABLE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."FriendQuestRewardType" AS ENUM ('XP', 'MONEY', 'ITEM', 'REPUTATION', 'SKILLPOINTS');

-- AlterTable
ALTER TABLE "public"."Achievement" ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "category" "public"."AchievementCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "color" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moneyReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rarity" "public"."ItemRarity" NOT NULL DEFAULT 'COMMON',
ADD COLUMN     "reputationReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skillpointsReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "public"."AchievementType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "xpReward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "category" "public"."EventCategory" NOT NULL DEFAULT 'SPECIAL',
ADD COLUMN     "coinReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dungeonBossId" TEXT,
ADD COLUMN     "itemRewards" JSONB,
ADD COLUMN     "storyContent" TEXT,
ADD COLUMN     "type" "public"."EventType" NOT NULL DEFAULT 'TIMED',
ADD COLUMN     "unlockCondition" JSONB;

-- AlterTable
ALTER TABLE "public"."EventParticipation" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currentPhaseId" TEXT,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "category" TEXT,
ADD COLUMN     "effects" JSONB,
ADD COLUMN     "isTradeable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "estimatedHours" INTEGER,
ADD COLUMN     "isTeamJob" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reputationReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredSkillId" TEXT,
ADD COLUMN     "requiredSkillLevel" INTEGER,
ADD COLUMN     "skillpointsReward" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tier" "public"."JobTier" NOT NULL DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "public"."Streak" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastRewardedAt" TIMESTAMP(3),
ADD COLUMN     "milestonesReached" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "gems" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gold" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."JobCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AchievementProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventPhase" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "storyContent" TEXT,
    "unlockCondition" JSONB,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventReward" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rewardType" "public"."EventRewardType" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "itemId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "EventReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StreakReward" (
    "id" TEXT NOT NULL,
    "streakId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "moneyReward" INTEGER NOT NULL DEFAULT 0,
    "itemReward" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "public"."QuestDifficulty" NOT NULL,
    "questType" "public"."QuestType" NOT NULL DEFAULT 'STANDARD',
    "requiredLevel" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "moneyReward" INTEGER NOT NULL DEFAULT 0,
    "skillpointsReward" INTEGER NOT NULL DEFAULT 0,
    "reputationReward" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "guildId" TEXT,
    "miniGameType" TEXT,
    "miniGameData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "miniGameScore" INTEGER,
    "miniGameData" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" TEXT NOT NULL,
    "treasury" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "motto" TEXT,
    "logoUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuildMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "role" "public"."GuildMemberRole" NOT NULL DEFAULT 'MEMBER',
    "contributedXP" INTEGER NOT NULL DEFAULT 0,
    "contributedMoney" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuildActivity" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuildBenefit" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuildChatMessage" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Boss" (
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

-- CreateTable
CREATE TABLE "public"."DungeonRun" (
    "id" TEXT NOT NULL,
    "bossId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "status" "public"."DungeonStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentHp" INTEGER NOT NULL,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "participantIds" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DamageLog" (
    "id" TEXT NOT NULL,
    "dungeonRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "damage" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DamageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RandomFind" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "rarity" "public"."ItemRarity" NOT NULL,
    "value" INTEGER NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomFind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trade" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "public"."TradeStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TradeOffer" (
    "id" TEXT NOT NULL,
    "offeredItemIds" TEXT[],
    "wantedItemIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlackMarketItem" (
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

-- CreateTable
CREATE TABLE "public"."ContrabandTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "discoveredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContrabandTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "reward" INTEGER NOT NULL,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "deadline" TIMESTAMP(3),
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VirtualAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "public"."ItemRarity" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalSpace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "layout" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Furniture" (
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

-- CreateTable
CREATE TABLE "public"."UserInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TradeItem" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isOffered" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RandomFindCooldown" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastFindAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAvailableAt" TIMESTAMP(3) NOT NULL,
    "findsToday" INTEGER NOT NULL DEFAULT 1,
    "dailyLimit" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "RandomFindCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlackMarketOffer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "gemPrice" INTEGER NOT NULL DEFAULT 0,
    "rarity" "public"."ItemRarity" NOT NULL DEFAULT 'RARE',
    "stock" INTEGER NOT NULL DEFAULT 1,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableTo" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlackMarketOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlackMarketPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "gemsPaid" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackMarketPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RealLifeReward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."RewardCategory" NOT NULL DEFAULT 'FOOD',
    "imageUrl" TEXT,
    "goldPrice" INTEGER NOT NULL DEFAULT 0,
    "gemsPrice" INTEGER NOT NULL DEFAULT 0,
    "levelRequired" INTEGER NOT NULL DEFAULT 0,
    "totalStock" INTEGER NOT NULL DEFAULT 1,
    "availableStock" INTEGER NOT NULL DEFAULT 1,
    "isLimited" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RealLifeReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "status" "public"."ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "goldPaid" INTEGER NOT NULL DEFAULT 0,
    "gemsPaid" INTEGER NOT NULL DEFAULT 0,
    "studentNote" TEXT,
    "adminNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherStatistics" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "totalJobsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalJobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalXPAwarded" INTEGER NOT NULL DEFAULT 0,
    "totalMoneyAwarded" INTEGER NOT NULL DEFAULT 0,
    "averageJobRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalQuestsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalQuestsCompleted" INTEGER NOT NULL DEFAULT 0,
    "questCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalEventsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalEventParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalStudentsHelped" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "activeDaysCount" INTEGER NOT NULL DEFAULT 0,
    "totalBadgesEarned" INTEGER NOT NULL DEFAULT 0,
    "totalAwardsReceived" INTEGER NOT NULL DEFAULT 0,
    "motivationPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyJobsCreated" INTEGER NOT NULL DEFAULT 0,
    "weeklyJobsCreated" INTEGER NOT NULL DEFAULT 0,
    "monthlyXPAwarded" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherBadge" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "badgeType" "public"."TeacherBadgeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "public"."BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherAchievement" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "achievementKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "maxProgress" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerUnit" INTEGER NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "gemPrice" INTEGER NOT NULL DEFAULT 0,
    "demandMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rarityBonus" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "description" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketTransaction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerUnit" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "gemPrice" INTEGER NOT NULL DEFAULT 0,
    "demandLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "supplyLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketDemand" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "totalSales24h" INTEGER NOT NULL DEFAULT 0,
    "totalSales7d" INTEGER NOT NULL DEFAULT 0,
    "totalViews24h" INTEGER NOT NULL DEFAULT 0,
    "totalSearches24h" INTEGER NOT NULL DEFAULT 0,
    "watchlistCount" INTEGER NOT NULL DEFAULT 0,
    "currentAvgPrice" INTEGER NOT NULL DEFAULT 0,
    "recommendedPrice" INTEGER NOT NULL DEFAULT 0,
    "lowestPrice" INTEGER NOT NULL DEFAULT 0,
    "highestPrice" INTEGER NOT NULL DEFAULT 0,
    "priceChange24h" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "priceChange7d" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "demandTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "popularityScore" INTEGER NOT NULL DEFAULT 50,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSaleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemPriceHistory" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "ItemPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TradingTransaction" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "goldAmount" INTEGER NOT NULL DEFAULT 0,
    "gemAmount" INTEGER NOT NULL DEFAULT 0,
    "transactionType" "public"."TransactionType" NOT NULL DEFAULT 'MARKETPLACE',
    "tradeId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TradingReputation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingReputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemWatchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "maxPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Friendship" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "public"."FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendQuest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "public"."QuestDifficulty" NOT NULL,
    "questType" "public"."FriendQuestType" NOT NULL DEFAULT 'ONE_TIME',
    "maxCompletions" INTEGER,
    "cooldownHours" INTEGER,
    "requiredLevel" INTEGER NOT NULL DEFAULT 0,
    "requiredReputation" INTEGER NOT NULL DEFAULT 0,
    "friendshipMinDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "FriendQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendQuestReward" (
    "id" TEXT NOT NULL,
    "friendQuestId" TEXT NOT NULL,
    "rewardType" "public"."FriendQuestRewardType" NOT NULL,
    "amount" INTEGER,
    "itemId" TEXT,
    "description" TEXT,

    CONSTRAINT "FriendQuestReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendQuestProgress" (
    "id" TEXT NOT NULL,
    "friendQuestId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "status" "public"."FriendQuestStatus" NOT NULL DEFAULT 'AVAILABLE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "user1Progress" INTEGER NOT NULL DEFAULT 0,
    "user2Progress" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FriendQuestCompletion" (
    "id" TEXT NOT NULL,
    "friendQuestId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "moneyReward" INTEGER NOT NULL DEFAULT 0,
    "reputationReward" INTEGER NOT NULL DEFAULT 0,
    "skillpointsReward" INTEGER NOT NULL DEFAULT 0,
    "itemsReceived" JSONB,

    CONSTRAINT "FriendQuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_QuestPrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestPrerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_name_key" ON "public"."JobCategory"("name");

-- CreateIndex
CREATE INDEX "JobCategory_isActive_idx" ON "public"."JobCategory"("isActive");

-- CreateIndex
CREATE INDEX "AchievementProgress_userId_idx" ON "public"."AchievementProgress"("userId");

-- CreateIndex
CREATE INDEX "AchievementProgress_achievementId_idx" ON "public"."AchievementProgress"("achievementId");

-- CreateIndex
CREATE INDEX "AchievementProgress_currentValue_idx" ON "public"."AchievementProgress"("currentValue");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementProgress_userId_achievementId_key" ON "public"."AchievementProgress"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "EventPhase_eventId_idx" ON "public"."EventPhase"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPhase_eventId_phaseNumber_key" ON "public"."EventPhase"("eventId", "phaseNumber");

-- CreateIndex
CREATE INDEX "EventReward_eventId_idx" ON "public"."EventReward"("eventId");

-- CreateIndex
CREATE INDEX "EventReward_rewardType_idx" ON "public"."EventReward"("rewardType");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "notification_unread" ON "public"."Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "StreakReward_streakId_idx" ON "public"."StreakReward"("streakId");

-- CreateIndex
CREATE INDEX "StreakReward_milestone_idx" ON "public"."StreakReward"("milestone");

-- CreateIndex
CREATE INDEX "Quest_category_idx" ON "public"."Quest"("category");

-- CreateIndex
CREATE INDEX "Quest_difficulty_idx" ON "public"."Quest"("difficulty");

-- CreateIndex
CREATE INDEX "Quest_questType_idx" ON "public"."Quest"("questType");

-- CreateIndex
CREATE INDEX "Quest_requiredLevel_idx" ON "public"."Quest"("requiredLevel");

-- CreateIndex
CREATE INDEX "Quest_status_idx" ON "public"."Quest"("status");

-- CreateIndex
CREATE INDEX "Quest_guildId_idx" ON "public"."Quest"("guildId");

-- CreateIndex
CREATE INDEX "Quest_isRepeatable_idx" ON "public"."Quest"("isRepeatable");

-- CreateIndex
CREATE INDEX "quest_search" ON "public"."Quest"("status", "requiredLevel", "category");

-- CreateIndex
CREATE INDEX "QuestProgress_userId_idx" ON "public"."QuestProgress"("userId");

-- CreateIndex
CREATE INDEX "QuestProgress_questId_idx" ON "public"."QuestProgress"("questId");

-- CreateIndex
CREATE INDEX "QuestProgress_status_idx" ON "public"."QuestProgress"("status");

-- CreateIndex
CREATE INDEX "QuestProgress_completedAt_idx" ON "public"."QuestProgress"("completedAt");

-- CreateIndex
CREATE INDEX "user_quest_active" ON "public"."QuestProgress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "public"."QuestProgress"("userId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_name_key" ON "public"."Guild"("name");

-- CreateIndex
CREATE INDEX "Guild_leaderId_idx" ON "public"."Guild"("leaderId");

-- CreateIndex
CREATE INDEX "Guild_level_idx" ON "public"."Guild"("level");

-- CreateIndex
CREATE INDEX "Guild_isPublic_idx" ON "public"."Guild"("isPublic");

-- CreateIndex
CREATE INDEX "GuildMember_userId_idx" ON "public"."GuildMember"("userId");

-- CreateIndex
CREATE INDEX "GuildMember_guildId_idx" ON "public"."GuildMember"("guildId");

-- CreateIndex
CREATE INDEX "GuildMember_role_idx" ON "public"."GuildMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMember_userId_guildId_key" ON "public"."GuildMember"("userId", "guildId");

-- CreateIndex
CREATE INDEX "GuildActivity_guildId_idx" ON "public"."GuildActivity"("guildId");

-- CreateIndex
CREATE INDEX "GuildActivity_createdAt_idx" ON "public"."GuildActivity"("createdAt");

-- CreateIndex
CREATE INDEX "guild_recent_activity" ON "public"."GuildActivity"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "GuildBenefit_guildId_idx" ON "public"."GuildBenefit"("guildId");

-- CreateIndex
CREATE INDEX "GuildBenefit_isActive_idx" ON "public"."GuildBenefit"("isActive");

-- CreateIndex
CREATE INDEX "GuildChatMessage_guildId_idx" ON "public"."GuildChatMessage"("guildId");

-- CreateIndex
CREATE INDEX "GuildChatMessage_createdAt_idx" ON "public"."GuildChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Boss_level_idx" ON "public"."Boss"("level");

-- CreateIndex
CREATE INDEX "Boss_isActive_idx" ON "public"."Boss"("isActive");

-- CreateIndex
CREATE INDEX "DungeonRun_bossId_idx" ON "public"."DungeonRun"("bossId");

-- CreateIndex
CREATE INDEX "DungeonRun_leaderId_idx" ON "public"."DungeonRun"("leaderId");

-- CreateIndex
CREATE INDEX "DungeonRun_status_idx" ON "public"."DungeonRun"("status");

-- CreateIndex
CREATE INDEX "DamageLog_dungeonRunId_idx" ON "public"."DamageLog"("dungeonRunId");

-- CreateIndex
CREATE INDEX "DamageLog_userId_idx" ON "public"."DamageLog"("userId");

-- CreateIndex
CREATE INDEX "RandomFind_userId_idx" ON "public"."RandomFind"("userId");

-- CreateIndex
CREATE INDEX "RandomFind_rarity_idx" ON "public"."RandomFind"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_offerId_key" ON "public"."Trade"("offerId");

-- CreateIndex
CREATE INDEX "Trade_requesterId_idx" ON "public"."Trade"("requesterId");

-- CreateIndex
CREATE INDEX "Trade_recipientId_idx" ON "public"."Trade"("recipientId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "public"."Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "public"."Trade"("createdAt");

-- CreateIndex
CREATE INDEX "trade_user_status" ON "public"."Trade"("requesterId", "status");

-- CreateIndex
CREATE INDEX "trade_recipient_status" ON "public"."Trade"("recipientId", "status");

-- CreateIndex
CREATE INDEX "TradeOffer_createdAt_idx" ON "public"."TradeOffer"("createdAt");

-- CreateIndex
CREATE INDEX "BlackMarketItem_risk_idx" ON "public"."BlackMarketItem"("risk");

-- CreateIndex
CREATE INDEX "BlackMarketItem_isActive_idx" ON "public"."BlackMarketItem"("isActive");

-- CreateIndex
CREATE INDEX "ContrabandTrade_userId_idx" ON "public"."ContrabandTrade"("userId");

-- CreateIndex
CREATE INDEX "ContrabandTrade_status_idx" ON "public"."ContrabandTrade"("status");

-- CreateIndex
CREATE INDEX "PersonalGoal_userId_idx" ON "public"."PersonalGoal"("userId");

-- CreateIndex
CREATE INDEX "PersonalGoal_status_idx" ON "public"."PersonalGoal"("status");

-- CreateIndex
CREATE INDEX "VirtualAward_userId_idx" ON "public"."VirtualAward"("userId");

-- CreateIndex
CREATE INDEX "VirtualAward_rarity_idx" ON "public"."VirtualAward"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalSpace_userId_key" ON "public"."PersonalSpace"("userId");

-- CreateIndex
CREATE INDEX "PersonalSpace_userId_idx" ON "public"."PersonalSpace"("userId");

-- CreateIndex
CREATE INDEX "Furniture_personalSpaceId_idx" ON "public"."Furniture"("personalSpaceId");

-- CreateIndex
CREATE INDEX "UserInventory_userId_idx" ON "public"."UserInventory"("userId");

-- CreateIndex
CREATE INDEX "UserInventory_itemId_idx" ON "public"."UserInventory"("itemId");

-- CreateIndex
CREATE INDEX "UserInventory_isEquipped_idx" ON "public"."UserInventory"("isEquipped");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_itemId_key" ON "public"."UserInventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "TradeItem_tradeId_idx" ON "public"."TradeItem"("tradeId");

-- CreateIndex
CREATE INDEX "TradeItem_itemId_idx" ON "public"."TradeItem"("itemId");

-- CreateIndex
CREATE INDEX "RandomFindCooldown_userId_idx" ON "public"."RandomFindCooldown"("userId");

-- CreateIndex
CREATE INDEX "RandomFindCooldown_nextAvailableAt_idx" ON "public"."RandomFindCooldown"("nextAvailableAt");

-- CreateIndex
CREATE UNIQUE INDEX "RandomFindCooldown_userId_key" ON "public"."RandomFindCooldown"("userId");

-- CreateIndex
CREATE INDEX "BlackMarketOffer_isActive_idx" ON "public"."BlackMarketOffer"("isActive");

-- CreateIndex
CREATE INDEX "BlackMarketOffer_availableFrom_idx" ON "public"."BlackMarketOffer"("availableFrom");

-- CreateIndex
CREATE INDEX "BlackMarketOffer_availableTo_idx" ON "public"."BlackMarketOffer"("availableTo");

-- CreateIndex
CREATE INDEX "BlackMarketOffer_isFeatured_idx" ON "public"."BlackMarketOffer"("isFeatured");

-- CreateIndex
CREATE INDEX "BlackMarketOffer_rarity_idx" ON "public"."BlackMarketOffer"("rarity");

-- CreateIndex
CREATE INDEX "BlackMarketPurchase_userId_idx" ON "public"."BlackMarketPurchase"("userId");

-- CreateIndex
CREATE INDEX "BlackMarketPurchase_offerId_idx" ON "public"."BlackMarketPurchase"("offerId");

-- CreateIndex
CREATE INDEX "BlackMarketPurchase_createdAt_idx" ON "public"."BlackMarketPurchase"("createdAt");

-- CreateIndex
CREATE INDEX "RealLifeReward_isActive_idx" ON "public"."RealLifeReward"("isActive");

-- CreateIndex
CREATE INDEX "RealLifeReward_category_idx" ON "public"."RealLifeReward"("category");

-- CreateIndex
CREATE INDEX "RealLifeReward_availableFrom_idx" ON "public"."RealLifeReward"("availableFrom");

-- CreateIndex
CREATE INDEX "RealLifeReward_availableTo_idx" ON "public"."RealLifeReward"("availableTo");

-- CreateIndex
CREATE INDEX "RealLifeReward_isFeatured_idx" ON "public"."RealLifeReward"("isFeatured");

-- CreateIndex
CREATE INDEX "RealLifeReward_priority_idx" ON "public"."RealLifeReward"("priority");

-- CreateIndex
CREATE INDEX "RewardClaim_userId_idx" ON "public"."RewardClaim"("userId");

-- CreateIndex
CREATE INDEX "RewardClaim_rewardId_idx" ON "public"."RewardClaim"("rewardId");

-- CreateIndex
CREATE INDEX "RewardClaim_status_idx" ON "public"."RewardClaim"("status");

-- CreateIndex
CREATE INDEX "RewardClaim_createdAt_idx" ON "public"."RewardClaim"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStatistics_teacherId_key" ON "public"."TeacherStatistics"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherStatistics_teacherId_idx" ON "public"."TeacherStatistics"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherStatistics_motivationPoints_idx" ON "public"."TeacherStatistics"("motivationPoints");

-- CreateIndex
CREATE INDEX "TeacherStatistics_totalJobsCreated_idx" ON "public"."TeacherStatistics"("totalJobsCreated");

-- CreateIndex
CREATE INDEX "TeacherStatistics_lastActivityAt_idx" ON "public"."TeacherStatistics"("lastActivityAt");

-- CreateIndex
CREATE INDEX "TeacherBadge_teacherId_idx" ON "public"."TeacherBadge"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherBadge_badgeType_idx" ON "public"."TeacherBadge"("badgeType");

-- CreateIndex
CREATE INDEX "TeacherBadge_rarity_idx" ON "public"."TeacherBadge"("rarity");

-- CreateIndex
CREATE INDEX "TeacherAchievement_teacherId_idx" ON "public"."TeacherAchievement"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAchievement_isCompleted_idx" ON "public"."TeacherAchievement"("isCompleted");

-- CreateIndex
CREATE INDEX "TeacherAchievement_achievementKey_idx" ON "public"."TeacherAchievement"("achievementKey");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAchievement_teacherId_achievementKey_key" ON "public"."TeacherAchievement"("teacherId", "achievementKey");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_idx" ON "public"."MarketplaceListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_itemId_idx" ON "public"."MarketplaceListing"("itemId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "public"."MarketplaceListing"("status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_createdAt_idx" ON "public"."MarketplaceListing"("createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_expiresAt_idx" ON "public"."MarketplaceListing"("expiresAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_pricePerUnit_idx" ON "public"."MarketplaceListing"("pricePerUnit");

-- CreateIndex
CREATE INDEX "MarketplaceListing_trendingScore_idx" ON "public"."MarketplaceListing"("trendingScore");

-- CreateIndex
CREATE INDEX "MarketplaceListing_featured_idx" ON "public"."MarketplaceListing"("featured");

-- CreateIndex
CREATE INDEX "market_search" ON "public"."MarketplaceListing"("status", "itemId", "pricePerUnit");

-- CreateIndex
CREATE INDEX "MarketTransaction_listingId_idx" ON "public"."MarketTransaction"("listingId");

-- CreateIndex
CREATE INDEX "MarketTransaction_sellerId_idx" ON "public"."MarketTransaction"("sellerId");

-- CreateIndex
CREATE INDEX "MarketTransaction_buyerId_idx" ON "public"."MarketTransaction"("buyerId");

-- CreateIndex
CREATE INDEX "MarketTransaction_itemId_idx" ON "public"."MarketTransaction"("itemId");

-- CreateIndex
CREATE INDEX "MarketTransaction_createdAt_idx" ON "public"."MarketTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDemand_itemId_key" ON "public"."MarketDemand"("itemId");

-- CreateIndex
CREATE INDEX "MarketDemand_itemId_idx" ON "public"."MarketDemand"("itemId");

-- CreateIndex
CREATE INDEX "MarketDemand_popularityScore_idx" ON "public"."MarketDemand"("popularityScore");

-- CreateIndex
CREATE INDEX "MarketDemand_demandTrend_idx" ON "public"."MarketDemand"("demandTrend");

-- CreateIndex
CREATE INDEX "MarketDemand_lastUpdated_idx" ON "public"."MarketDemand"("lastUpdated");

-- CreateIndex
CREATE INDEX "ItemPriceHistory_itemId_idx" ON "public"."ItemPriceHistory"("itemId");

-- CreateIndex
CREATE INDEX "ItemPriceHistory_period_idx" ON "public"."ItemPriceHistory"("period");

-- CreateIndex
CREATE INDEX "ItemPriceHistory_periodStart_idx" ON "public"."ItemPriceHistory"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPriceHistory_itemId_period_periodStart_key" ON "public"."ItemPriceHistory"("itemId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "TradingTransaction_sellerId_idx" ON "public"."TradingTransaction"("sellerId");

-- CreateIndex
CREATE INDEX "TradingTransaction_buyerId_idx" ON "public"."TradingTransaction"("buyerId");

-- CreateIndex
CREATE INDEX "TradingTransaction_itemId_idx" ON "public"."TradingTransaction"("itemId");

-- CreateIndex
CREATE INDEX "TradingTransaction_transactionType_idx" ON "public"."TradingTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "TradingTransaction_createdAt_idx" ON "public"."TradingTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "TradingTransaction_tradeId_idx" ON "public"."TradingTransaction"("tradeId");

-- CreateIndex
CREATE INDEX "TradingTransaction_listingId_idx" ON "public"."TradingTransaction"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "TradingReputation_userId_key" ON "public"."TradingReputation"("userId");

-- CreateIndex
CREATE INDEX "TradingReputation_userId_idx" ON "public"."TradingReputation"("userId");

-- CreateIndex
CREATE INDEX "TradingReputation_trustScore_idx" ON "public"."TradingReputation"("trustScore");

-- CreateIndex
CREATE INDEX "TradingReputation_totalSales_idx" ON "public"."TradingReputation"("totalSales");

-- CreateIndex
CREATE INDEX "ItemWatchlist_userId_idx" ON "public"."ItemWatchlist"("userId");

-- CreateIndex
CREATE INDEX "ItemWatchlist_itemId_idx" ON "public"."ItemWatchlist"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemWatchlist_userId_itemId_key" ON "public"."ItemWatchlist"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Friendship_userId1_idx" ON "public"."Friendship"("userId1");

-- CreateIndex
CREATE INDEX "Friendship_userId2_idx" ON "public"."Friendship"("userId2");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId1_userId2_key" ON "public"."Friendship"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "FriendRequest_senderId_idx" ON "public"."FriendRequest"("senderId");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverId_idx" ON "public"."FriendRequest"("receiverId");

-- CreateIndex
CREATE INDEX "FriendRequest_status_idx" ON "public"."FriendRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "public"."FriendRequest"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "FriendQuest_questType_idx" ON "public"."FriendQuest"("questType");

-- CreateIndex
CREATE INDEX "FriendQuest_difficulty_idx" ON "public"."FriendQuest"("difficulty");

-- CreateIndex
CREATE INDEX "FriendQuest_isActive_idx" ON "public"."FriendQuest"("isActive");

-- CreateIndex
CREATE INDEX "FriendQuest_category_idx" ON "public"."FriendQuest"("category");

-- CreateIndex
CREATE INDEX "FriendQuestReward_friendQuestId_idx" ON "public"."FriendQuestReward"("friendQuestId");

-- CreateIndex
CREATE INDEX "FriendQuestReward_rewardType_idx" ON "public"."FriendQuestReward"("rewardType");

-- CreateIndex
CREATE INDEX "FriendQuestProgress_friendQuestId_idx" ON "public"."FriendQuestProgress"("friendQuestId");

-- CreateIndex
CREATE INDEX "FriendQuestProgress_user1Id_idx" ON "public"."FriendQuestProgress"("user1Id");

-- CreateIndex
CREATE INDEX "FriendQuestProgress_user2Id_idx" ON "public"."FriendQuestProgress"("user2Id");

-- CreateIndex
CREATE INDEX "FriendQuestProgress_status_idx" ON "public"."FriendQuestProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendQuestProgress_friendQuestId_user1Id_user2Id_key" ON "public"."FriendQuestProgress"("friendQuestId", "user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "FriendQuestCompletion_friendQuestId_idx" ON "public"."FriendQuestCompletion"("friendQuestId");

-- CreateIndex
CREATE INDEX "FriendQuestCompletion_user1Id_idx" ON "public"."FriendQuestCompletion"("user1Id");

-- CreateIndex
CREATE INDEX "FriendQuestCompletion_user2Id_idx" ON "public"."FriendQuestCompletion"("user2Id");

-- CreateIndex
CREATE INDEX "FriendQuestCompletion_completedAt_idx" ON "public"."FriendQuestCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "friend_quest_cooldown" ON "public"."FriendQuestCompletion"("friendQuestId", "user1Id", "user2Id", "completedAt");

-- CreateIndex
CREATE INDEX "_QuestPrerequisites_B_index" ON "public"."_QuestPrerequisites"("B");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "public"."Achievement"("type");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "public"."Achievement"("category");

-- CreateIndex
CREATE INDEX "Achievement_availableFrom_idx" ON "public"."Achievement"("availableFrom");

-- CreateIndex
CREATE INDEX "Achievement_availableTo_idx" ON "public"."Achievement"("availableTo");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "public"."Event"("type");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "public"."Event"("category");

-- CreateIndex
CREATE INDEX "EventParticipation_isCompleted_idx" ON "public"."EventParticipation"("isCompleted");

-- CreateIndex
CREATE INDEX "event_user_status" ON "public"."EventParticipation"("eventId", "userId", "isCompleted");

-- CreateIndex
CREATE INDEX "Item_isPurchasable_idx" ON "public"."Item"("isPurchasable");

-- CreateIndex
CREATE INDEX "Item_isTradeable_idx" ON "public"."Item"("isTradeable");

-- CreateIndex
CREATE INDEX "Job_categoryId_idx" ON "public"."Job"("categoryId");

-- CreateIndex
CREATE INDEX "Job_tier_idx" ON "public"."Job"("tier");

-- CreateIndex
CREATE INDEX "Job_isTeamJob_idx" ON "public"."Job"("isTeamJob");

-- CreateIndex
CREATE INDEX "Streak_maxStreak_idx" ON "public"."Streak"("maxStreak");

-- CreateIndex
CREATE INDEX "User_gold_idx" ON "public"."User"("gold");

-- CreateIndex
CREATE INDEX "User_gems_idx" ON "public"."User"("gems");

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_requiredSkillId_fkey" FOREIGN KEY ("requiredSkillId") REFERENCES "public"."Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AchievementProgress" ADD CONSTRAINT "AchievementProgress_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AchievementProgress" ADD CONSTRAINT "AchievementProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventParticipation" ADD CONSTRAINT "EventParticipation_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "public"."EventPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventPhase" ADD CONSTRAINT "EventPhase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventReward" ADD CONSTRAINT "EventReward_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StreakReward" ADD CONSTRAINT "StreakReward_streakId_fkey" FOREIGN KEY ("streakId") REFERENCES "public"."Streak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quest" ADD CONSTRAINT "Quest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "public"."Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildMember" ADD CONSTRAINT "GuildMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildMember" ADD CONSTRAINT "GuildMember_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildActivity" ADD CONSTRAINT "GuildActivity_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildBenefit" ADD CONSTRAINT "GuildBenefit_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildChatMessage" ADD CONSTRAINT "GuildChatMessage_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuildChatMessage" ADD CONSTRAINT "GuildChatMessage_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."GuildMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DungeonRun" ADD CONSTRAINT "DungeonRun_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "public"."Boss"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DamageLog" ADD CONSTRAINT "DamageLog_dungeonRunId_fkey" FOREIGN KEY ("dungeonRunId") REFERENCES "public"."DungeonRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RandomFind" ADD CONSTRAINT "RandomFind_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RandomFind" ADD CONSTRAINT "RandomFind_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."TradeOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContrabandTrade" ADD CONSTRAINT "ContrabandTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContrabandTrade" ADD CONSTRAINT "ContrabandTrade_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."BlackMarketItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalGoal" ADD CONSTRAINT "PersonalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VirtualAward" ADD CONSTRAINT "VirtualAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalSpace" ADD CONSTRAINT "PersonalSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Furniture" ADD CONSTRAINT "Furniture_personalSpaceId_fkey" FOREIGN KEY ("personalSpaceId") REFERENCES "public"."PersonalSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInventory" ADD CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserInventory" ADD CONSTRAINT "UserInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TradeItem" ADD CONSTRAINT "TradeItem_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "public"."Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TradeItem" ADD CONSTRAINT "TradeItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RandomFindCooldown" ADD CONSTRAINT "RandomFindCooldown_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlackMarketPurchase" ADD CONSTRAINT "BlackMarketPurchase_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."BlackMarketOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardClaim" ADD CONSTRAINT "RewardClaim_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."RealLifeReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherBadge" ADD CONSTRAINT "TeacherBadge_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."TeacherStatistics"("teacherId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAchievement" ADD CONSTRAINT "TeacherAchievement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."TeacherStatistics"("teacherId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketTransaction" ADD CONSTRAINT "MarketTransaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestReward" ADD CONSTRAINT "FriendQuestReward_friendQuestId_fkey" FOREIGN KEY ("friendQuestId") REFERENCES "public"."FriendQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestReward" ADD CONSTRAINT "FriendQuestReward_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestProgress" ADD CONSTRAINT "FriendQuestProgress_friendQuestId_fkey" FOREIGN KEY ("friendQuestId") REFERENCES "public"."FriendQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestProgress" ADD CONSTRAINT "FriendQuestProgress_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestProgress" ADD CONSTRAINT "FriendQuestProgress_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FriendQuestCompletion" ADD CONSTRAINT "FriendQuestCompletion_friendQuestId_fkey" FOREIGN KEY ("friendQuestId") REFERENCES "public"."FriendQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_QuestPrerequisites" ADD CONSTRAINT "_QuestPrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_QuestPrerequisites" ADD CONSTRAINT "_QuestPrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
