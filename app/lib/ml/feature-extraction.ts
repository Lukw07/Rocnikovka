/**
 * Helper functions to extract ML features from database records
 */

import prisma from '@/app/lib/prisma';

export interface MLFeatures {
  user_id: string;
  total_xp: number;
  level: number;
  money: number;
  reputation: number;
  quests_completed: number;
  achievements_unlocked: number;
  recent_xp_gained: number;
  active_days: number;
  items_owned: number;
  trades_made: number;
  events_participated: number;
  days_inactive: number;
  account_age_days: number;
}

/**
 * Extract ML features for a single user
 */
export async function extractUserFeatures(userId: string): Promise<MLFeatures> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      questProgresses: true,
      achievementAwards: {
        include: { achievement: true },
      },
      userInventory: true,
      tradesRequested: { where: { status: 'COMPLETED' } },
      tradesReceived: { where: { status: 'COMPLETED' } },
      eventParticipations: {
        include: { event: true },
      },
      xpAudits: {
        orderBy: { createdAt: 'desc' },
        take: 1000,
      },
      reputation: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const xpAudits = user.xpAudits ?? [];

  // Calculate recent XP (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentXP = xpAudits
    .filter((audit) => audit.createdAt >= thirtyDaysAgo)
    .reduce((sum, audit) => sum + audit.amount, 0);

  // Calculate active days
  const uniqueActiveDays = new Set(
    xpAudits.map((audit) => audit.createdAt.toISOString().split('T')[0])
  );

  // Calculate days inactive
  const firstAudit = xpAudits[0];
  const lastActivity = firstAudit?.createdAt ?? user.createdAt;
  const daysInactive = Math.floor(
    (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate account age
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count completed quests
  const questsCompleted = user.questProgresses.filter(
    (qc) => qc.status === 'COMPLETED'
  ).length;

  // Count total trades
  const tradesCount = user.tradesRequested.length + user.tradesReceived.length;

  // Count active event participations
  const activeEvents = user.eventParticipations.filter(
    (ep) => ep.event?.isActive
  ).length;

  const totalXP = xpAudits.reduce((sum, audit) => sum + audit.amount, 0);
  const level = Math.max(1, Math.floor(totalXP / 100) + 1);

  return {
    user_id: user.id,
    total_xp: totalXP,
    level,
    money: user.gold,
    reputation: user.reputation?.points ?? 0,
    quests_completed: questsCompleted,
    achievements_unlocked: user.achievementAwards.length,
    recent_xp_gained: recentXP,
    active_days: uniqueActiveDays.size,
    items_owned: user.userInventory.length,
    trades_made: tradesCount,
    events_participated: activeEvents,
    days_inactive: daysInactive,
    account_age_days: Math.max(accountAgeDays, 1),
  };
}

/**
 * Extract ML features for multiple users
 */
export async function extractBatchFeatures(userIds: string[]): Promise<MLFeatures[]> {
  const features = await Promise.all(
    userIds.map((userId) => extractUserFeatures(userId))
  );
  return features;
}

/**
 * Extract ML features for all students
 */
export async function extractAllStudentFeatures(): Promise<MLFeatures[]> {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true },
  });

  return extractBatchFeatures(students.map((s) => s.id));
}
