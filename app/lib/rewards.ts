import prisma from '@/app/lib/prisma';

/**
 * Reward Helper - Integration with existing systems
 * Automaticky rozděluje odměny z různých aktivit
 */

interface RewardConfig {
  userId: string;
  gold?: number;
  gems?: number;
  xp?: number;
  skillpoints?: number;
  reputation?: number;
  itemId?: string;
  itemQuantity?: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
}

/**
 * Udělí odměny uživateli z jakékoliv aktivity
 * Propojuje Money systém s XP, skillpoints, reputation atd.
 */
export async function grantRewards(config: RewardConfig) {
  const {
    userId,
    gold = 0,
    gems = 0,
    xp = 0,
    skillpoints = 0,
    reputation = 0,
    itemId,
    itemQuantity = 1,
    reason,
    sourceType,
    sourceId,
  } = config;

  return await prisma.$transaction(async (tx) => {
    const results: any = {};

    // 1. Gold odměna
    if (gold > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { gold: { increment: gold } },
      });

      await tx.moneyTx.create({
        data: {
          userId,
          amount: gold,
          type: 'EARNED',
          reason,
        },
      });
      results.gold = gold;
    }

    // 2. Gems odměna
    if (gems > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { gems: { increment: gems } },
      });
      results.gems = gems;
    }

    // 3. XP odměna
    if (xp > 0) {
      await tx.xPAudit.create({
        data: {
          userId,
          amount: xp,
          reason,
        },
      });
      results.xp = xp;
    }

    // 4. Skillpoints odměna
    if (skillpoints > 0) {
      await tx.skillPoint.upsert({
        where: { userId },
        create: {
          userId,
          available: skillpoints,
          total: skillpoints,
        },
        update: {
          available: { increment: skillpoints },
          total: { increment: skillpoints },
        },
      });
      results.skillpoints = skillpoints;
    }

    // 5. Reputation odměna
    if (reputation !== 0) {
      await tx.reputationLog.create({
        data: {
          userId,
          change: reputation,
          reason,
          sourceType,
          sourceId,
        },
      });

      const currentRep = await tx.reputation.findUnique({
        where: { userId },
      });

      const newPoints = (currentRep?.points || 0) + reputation;
      const newTier = Math.floor(newPoints / 100); // Každých 100 bodů = nový tier

      await tx.reputation.upsert({
        where: { userId },
        create: {
          userId,
          points: newPoints,
          tier: newTier,
        },
        update: {
          points: newPoints,
          tier: newTier,
        },
      });
      results.reputation = reputation;
    }

    // 6. Item odměna
    if (itemId) {
      await tx.userInventory.upsert({
        where: {
          userId_itemId: { userId, itemId },
        },
        create: {
          userId,
          itemId,
          quantity: itemQuantity,
        },
        update: {
          quantity: { increment: itemQuantity },
        },
      });
      results.item = { itemId, quantity: itemQuantity };
    }

    // 7. Notifikace
    if (Object.keys(results).length > 0) {
      const rewardMessages = [];
      if (results.gold) rewardMessages.push(`${results.gold} gold`);
      if (results.gems) rewardMessages.push(`${results.gems} gems`);
      if (results.xp) rewardMessages.push(`${results.xp} XP`);
      if (results.skillpoints) rewardMessages.push(`${results.skillpoints} skillpoints`);
      if (results.reputation) rewardMessages.push(`${results.reputation > 0 ? '+' : ''}${results.reputation} reputace`);
      if (results.item) rewardMessages.push(`${results.item.quantity}x item`);

      await tx.notification.create({
        data: {
          userId,
          type: 'REWARD_RECEIVED',
          title: '🎁 Odměny obdrženy!',
          message: `Získal jsi: ${rewardMessages.join(', ')}`,
          data: {
            reason,
            rewards: results,
          },
        },
      });
    }

    return results;
  });
}

/**
 * Odměny za dokončení jobu
 */
export async function grantJobRewards(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new Error('Job not found');

  return await grantRewards({
    userId,
    gold: job.moneyReward,
    xp: job.xpReward,
    skillpoints: job.skillpointsReward,
    reputation: job.reputationReward,
    reason: `Job dokončen: ${job.title}`,
    sourceType: 'job',
    sourceId: jobId,
  });
}

/**
 * Odměny za dokončení questu
 */
export async function grantQuestRewards(userId: string, questId: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
  });

  if (!quest) throw new Error('Quest not found');

  return await grantRewards({
    userId,
    gold: quest.moneyReward,
    xp: quest.xpReward,
    skillpoints: quest.skillpointsReward,
    reputation: quest.reputationReward,
    reason: `Quest dokončen: ${quest.title}`,
    sourceType: 'quest',
    sourceId: questId,
  });
}

/**
 * Odměny za achievement
 */
export async function grantAchievementRewards(userId: string, achievementId: string) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });

  if (!achievement) throw new Error('Achievement not found');

  return await grantRewards({
    userId,
    gold: achievement.moneyReward,
    xp: achievement.xpReward,
    skillpoints: achievement.skillpointsReward,
    reputation: achievement.reputationReward,
    reason: `Achievement odemčen: ${achievement.name}`,
    sourceType: 'achievement',
    sourceId: achievementId,
  });
}

/**
 * Odměny za guild aktivitu
 */
export async function grantGuildRewards(userId: string, guildId: string, activityType: string) {
  // Guild rewards - menší množství, ale přispívá do guild treasury
  const rewards = {
    'quest_completed': { gold: 50, xp: 100, guildGold: 25 },
    'member_joined': { gold: 20, xp: 50, guildGold: 10 },
    'daily_login': { gold: 10, xp: 25, guildGold: 5 },
  };

  const rewardConfig = rewards[activityType as keyof typeof rewards] || { gold: 0, xp: 0, guildGold: 0 };

  // Udělit odměny hráči
  const playerRewards = await grantRewards({
    userId,
    gold: rewardConfig.gold,
    xp: rewardConfig.xp,
    reason: `Guild aktivita: ${activityType}`,
    sourceType: 'guild',
    sourceId: guildId,
  });

  // Přidat do guild treasury
  if (rewardConfig.guildGold > 0) {
    await prisma.guild.update({
      where: { id: guildId },
      data: {
        treasury: { increment: rewardConfig.guildGold },
        xp: { increment: rewardConfig.xp / 2 }, // Polovina XP do guild XP
      },
    });
  }

  return { playerRewards, guildContribution: rewardConfig.guildGold };
}

/**
 * Denní odměny za streak
 */
export async function grantStreakReward(userId: string, streakDays: number) {
  // Progresivní odměny podle délky streaku
  const goldReward = Math.min(50 + (streakDays * 5), 500);
  const gemsReward = streakDays % 7 === 0 ? Math.floor(streakDays / 7) : 0; // Každý týden 1 gem

  return await grantRewards({
    userId,
    gold: goldReward,
    gems: gemsReward,
    xp: streakDays * 10,
    reason: `Streak ${streakDays} dní`,
    sourceType: 'streak',
  });
}
