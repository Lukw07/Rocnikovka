/**
 * Friend Quest Service
 * Služba pro správu questů mezi přáteli s omezeným opakováním
 * 
 * Features:
 * - Omezené opakování (ONE_TIME, DAILY, WEEKLY, LIMITED)
 * - Automatická validace friendship
 * - Progress tracking pro oba hráče
 * - Reward distribution (XP, money, items, reputation)
 * - Cooldown management
 */

import { prisma } from "@/app/lib/prisma";
import { 
  FriendQuestType, 
  FriendQuestStatus, 
  FriendQuestRewardType,
  QuestDifficulty 
} from "@/app/lib/generated";

export interface CreateFriendQuestInput {
  title: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  questType: FriendQuestType;
  maxCompletions?: number | null;
  cooldownHours?: number | null;
  requiredLevel?: number;
  requiredReputation?: number;
  friendshipMinDays?: number;
  expiresAt?: Date | null;
  rewards: {
    rewardType: FriendQuestRewardType;
    amount?: number;
    itemId?: string;
    description?: string;
  }[];
}

export interface AcceptFriendQuestInput {
  friendQuestId: string;
  user1Id: string;
  user2Id: string;
}

export interface UpdateProgressInput {
  progressId: string;
  userId: string;
  progressDelta: number; // Kolik % přidat
}

export class FriendQuestService {
  /**
   * Vytvoří nový Friend Quest (pouze učitel/admin)
   */
  static async createFriendQuest(
    input: CreateFriendQuestInput, 
    createdBy: string
  ) {
    const friendQuest = await prisma.friendQuest.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        questType: input.questType,
        maxCompletions: input.maxCompletions,
        cooldownHours: input.cooldownHours,
        requiredLevel: input.requiredLevel || 0,
        requiredReputation: input.requiredReputation || 0,
        friendshipMinDays: input.friendshipMinDays || 0,
        expiresAt: input.expiresAt,
        createdBy,
        rewards: {
          create: input.rewards.map(reward => ({
            rewardType: reward.rewardType,
            amount: reward.amount,
            itemId: reward.itemId,
            description: reward.description
          }))
        }
      },
      include: {
        rewards: {
          include: {
            item: true
          }
        }
      }
    });

    return { success: true, friendQuest };
  }

  /**
   * Získá dostupné Friend Questy pro dvojici přátel
   */
  static async getAvailableQuestsForFriends(user1Id: string, user2Id: string) {
    // Validace přátelství
    const friendship = await this.validateFriendship(user1Id, user2Id);
    if (!friendship) {
      return { success: false, error: "Uživatelé nejsou přátelé" };
    }

    // Získání informací o uživatelích
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user1Id },
        include: { 
          reputation: true,
          enrollments: { include: { subject: true } }
        }
      }),
      prisma.user.findUnique({
        where: { id: user2Id },
        include: { 
          reputation: true 
        }
      })
    ]);

    if (!user1 || !user2) {
      return { success: false, error: "Uživatel nenalezen" };
    }

    // Derive level from gold (since xp and level not in schema, use placeholder logic)
    const user1Level = Math.floor(user1.gold / 100) + 1;

    // Výpočet stáří přátelství
    const friendshipAgeDays = Math.floor(
      (Date.now() - friendship.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Načtení všech aktivních questů
    const allQuests = await prisma.friendQuest.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        rewards: {
          include: {
            item: true
          }
        }
      }
    });

    // Filtrování podle požadavků
    const availableQuests = [];
    for (const quest of allQuests) {
      // Kontrola levelu
      if (quest.requiredLevel > user1Level) continue;

      // Kontrola reputation
      const user1Rep = user1.reputation?.points || 0;
      const user2Rep = user2.reputation?.points || 0;
      if (quest.requiredReputation > Math.min(user1Rep, user2Rep)) continue;

      // Kontrola stáří přátelství
      if (quest.friendshipMinDays > friendshipAgeDays) continue;

      // Kontrola počtu dokončení
      const canComplete = await this.canCompleteQuest(
        quest.id,
        user1Id,
        user2Id,
        quest.questType,
        quest.maxCompletions,
        quest.cooldownHours
      );

      if (!canComplete.canComplete) continue;

      // Kontrola existujícího progressu
      const existingProgress = await prisma.friendQuestProgress.findFirst({
        where: {
          friendQuestId: quest.id,
          OR: [
            { user1Id, user2Id },
            { user1Id: user2Id, user2Id: user1Id }
          ],
          status: {
            in: ['ACCEPTED', 'IN_PROGRESS']
          }
        }
      });

      if (existingProgress) continue;

      availableQuests.push({
        ...quest,
        completionInfo: canComplete
      });
    }

    return { success: true, quests: availableQuests };
  }

  /**
   * Přijme Friend Quest (musí přijmout oba hráči)
   */
  static async acceptFriendQuest(input: AcceptFriendQuestInput) {
    const { friendQuestId, user1Id, user2Id } = input;

    // Validace přátelství
    const friendship = await this.validateFriendship(user1Id, user2Id);
    if (!friendship) {
      return { success: false, error: "Uživatelé nejsou přátelé" };
    }

    // Kontrola, zda mohou quest přijmout
    const quest = await prisma.friendQuest.findUnique({
      where: { id: friendQuestId },
      include: { rewards: true }
    });

    if (!quest || !quest.isActive) {
      return { success: false, error: "Quest není dostupný" };
    }

    const canComplete = await this.canCompleteQuest(
      friendQuestId,
      user1Id,
      user2Id,
      quest.questType,
      quest.maxCompletions,
      quest.cooldownHours
    );

    if (!canComplete.canComplete) {
      return { success: false, error: canComplete.reason };
    }

    // Vytvoření progress záznamu
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort() as [string, string];

    const progress = await prisma.friendQuestProgress.create({
      data: {
        friendQuestId,
        user1Id: sortedUser1,
        user2Id: sortedUser2,
        status: FriendQuestStatus.ACCEPTED,
        acceptedAt: new Date()
      },
      include: {
        friendQuest: {
          include: {
            rewards: {
              include: {
                item: true
              }
            }
          }
        }
      }
    });

    return { success: true, progress };
  }

  /**
   * Aktualizuje progress pro jednoho z hráčů
   */
  static async updateProgress(input: UpdateProgressInput) {
    const { progressId, userId, progressDelta } = input;

    const progress = await prisma.friendQuestProgress.findUnique({
      where: { id: progressId },
      include: {
        friendQuest: true
      }
    });

    if (!progress) {
      return { success: false, error: "Progress nenalezen" };
    }

    if (progress.user1Id !== userId && progress.user2Id !== userId) {
      return { success: false, error: "Nemáte oprávnění aktualizovat tento quest" };
    }

    // Aktualizace individuálního progressu
    const isUser1 = progress.user1Id === userId;
    const newUserProgress = Math.min(
      100, 
      (isUser1 ? progress.user1Progress : progress.user2Progress) + progressDelta
    );

    // Aktualizace celkového progressu (průměr obou hráčů)
    const otherUserProgress = isUser1 ? progress.user2Progress : progress.user1Progress;
    const newTotalProgress = Math.floor((newUserProgress + otherUserProgress) / 2);

    const updatedProgress = await prisma.friendQuestProgress.update({
      where: { id: progressId },
      data: {
        ...(isUser1 ? { user1Progress: newUserProgress } : { user2Progress: newUserProgress }),
        progress: newTotalProgress,
        status: progress.status === FriendQuestStatus.ACCEPTED 
          ? FriendQuestStatus.IN_PROGRESS 
          : progress.status,
        startedAt: progress.startedAt || new Date()
      },
      include: {
        friendQuest: {
          include: {
            rewards: true
          }
        }
      }
    });

    // Automatické dokončení, pokud oba hráči dosáhli 100%
    if (newUserProgress === 100 && otherUserProgress === 100) {
      return await this.completeQuest(progressId);
    }

    return { success: true, progress: updatedProgress };
  }

  /**
   * Dokončí Friend Quest a rozdělí odměny
   */
  static async completeQuest(progressId: string) {
    const progress = await prisma.friendQuestProgress.findUnique({
      where: { id: progressId },
      include: {
        friendQuest: {
          include: {
            rewards: {
              include: {
                item: true
              }
            }
          }
        }
      }
    });

    if (!progress) {
      return { success: false, error: "Progress nenalezen" };
    }

    if (progress.status === FriendQuestStatus.COMPLETED) {
      return { success: false, error: "Quest již byl dokončen" };
    }

    // Kontrola, zda oba hráči dosáhli 100%
    if (progress.user1Progress < 100 || progress.user2Progress < 100) {
      return { success: false, error: "Oba hráči musí dosáhnout 100% progressu" };
    }

    // Transakce pro rozdělení odměn
    const result = await prisma.$transaction(async (tx) => {
      // Aktualizace progressu na COMPLETED
      const completedProgress = await tx.friendQuestProgress.update({
        where: { id: progressId },
        data: {
          status: FriendQuestStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      let totalXp = 0;
      let totalMoney = 0;
      let totalReputation = 0;
      let totalSkillpoints = 0;
      const itemsReceived: string[] = [];

      // Rozdělení odměn oběma hráčům
      for (const reward of progress.friendQuest.rewards) {
        if (reward.rewardType === FriendQuestRewardType.XP && reward.amount) {
          totalXp += reward.amount;
          // Přidání XP oběma hráčům
          await tx.xPAudit.createMany({
            data: [
              {
                userId: progress.user1Id,
                amount: reward.amount,
                reason: `Friend Quest: ${progress.friendQuest.title}`
              },
              {
                userId: progress.user2Id,
                amount: reward.amount,
                reason: `Friend Quest: ${progress.friendQuest.title}`
              }
            ]
          });
        }

        if (reward.rewardType === FriendQuestRewardType.MONEY && reward.amount) {
          totalMoney += reward.amount;
          // Přidání peněz
          await tx.user.update({
            where: { id: progress.user1Id },
            data: { gold: { increment: reward.amount } }
          });
          await tx.user.update({
            where: { id: progress.user2Id },
            data: { gold: { increment: reward.amount } }
          });
          
          await tx.moneyTx.createMany({
            data: [
              {
                userId: progress.user1Id,
                amount: reward.amount,
                type: 'EARNED',
                reason: `Friend Quest: ${progress.friendQuest.title}`
              },
              {
                userId: progress.user2Id,
                amount: reward.amount,
                type: 'EARNED',
                reason: `Friend Quest: ${progress.friendQuest.title}`
              }
            ]
          });
        }

        if (reward.rewardType === FriendQuestRewardType.REPUTATION && reward.amount) {
          totalReputation += reward.amount;
          // Přidání reputation
          for (const userId of [progress.user1Id, progress.user2Id]) {
            const rep = await tx.reputation.findUnique({
              where: { userId }
            });

            if (rep) {
              await tx.reputation.update({
                where: { userId },
                data: { points: { increment: reward.amount } }
              });
            } else {
              await tx.reputation.create({
                data: {
                  userId,
                  points: reward.amount,
                  tier: Math.floor(reward.amount / 100)
                }
              });
            }

            await tx.reputationLog.create({
              data: {
                userId,
                change: reward.amount,
                reason: `Friend Quest: ${progress.friendQuest.title}`,
                sourceType: 'FRIEND_QUEST',
                sourceId: progress.friendQuestId
              }
            });
          }
        }

        if (reward.rewardType === FriendQuestRewardType.SKILLPOINTS && reward.amount) {
          totalSkillpoints += reward.amount;
          // Přidání skillpointů
          for (const userId of [progress.user1Id, progress.user2Id]) {
            const skillPoint = await tx.skillPoint.findUnique({
              where: { userId }
            });

            if (skillPoint) {
              await tx.skillPoint.update({
                where: { userId },
                data: { available: { increment: reward.amount } }
              });
            } else {
              await tx.skillPoint.create({
                data: {
                  userId,
                  available: reward.amount,
                  spent: 0
                }
              });
            }
          }
        }

        if (reward.rewardType === FriendQuestRewardType.ITEM && reward.itemId) {
          itemsReceived.push(reward.itemId);
          // Přidání itemu do inventáře
          await tx.userInventory.createMany({
            data: [
              {
                userId: progress.user1Id,
                itemId: reward.itemId,
                quantity: 1
              },
              {
                userId: progress.user2Id,
                itemId: reward.itemId,
                quantity: 1
              }
            ]
          });
        }
      }

      // Vytvoření completion záznamu
      const completion = await tx.friendQuestCompletion.create({
        data: {
          friendQuestId: progress.friendQuestId,
          user1Id: progress.user1Id,
          user2Id: progress.user2Id,
          xpReward: totalXp,
          moneyReward: totalMoney,
          reputationReward: totalReputation,
          skillpointsReward: totalSkillpoints,
          itemsReceived: itemsReceived.length > 0 ? (itemsReceived as any) : null
        }
      });

      return {
        progress: completedProgress,
        completion,
        rewards: {
          xp: totalXp,
          money: totalMoney,
          reputation: totalReputation,
          skillpoints: totalSkillpoints,
          items: itemsReceived
        }
      };
    });

    return { success: true, ...result };
  }

  /**
   * Získá aktivní Friend Questy pro uživatele
   */
  static async getActiveQuestsForUser(userId: string) {
    const progresses = await prisma.friendQuestProgress.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: {
          in: [FriendQuestStatus.ACCEPTED, FriendQuestStatus.IN_PROGRESS]
        }
      },
      include: {
        friendQuest: {
          include: {
            rewards: {
              include: {
                item: true
              }
            }
          }
        },
        user1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, progresses };
  }

  /**
   * Získá historii dokončených Friend Questů
   */
  static async getCompletedQuests(userId: string, limit: number = 20) {
    const completions = await prisma.friendQuestCompletion.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        friendQuest: {
          include: {
            rewards: {
              include: {
                item: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: limit
    });

    return { success: true, completions };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validuje, zda jsou dva uživatelé přátelé
   */
  private static async validateFriendship(user1Id: string, user2Id: string) {
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort();

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: sortedUser1, userId2: sortedUser2 },
          { userId1: sortedUser2, userId2: sortedUser1 }
        ]
      }
    });

    return friendship;
  }

  /**
   * Kontroluje, zda mohou uživatelé quest dokončit (dle omezení)
   */
  private static async canCompleteQuest(
    questId: string,
    user1Id: string,
    user2Id: string,
    questType: FriendQuestType,
    maxCompletions: number | null,
    cooldownHours: number | null
  ): Promise<{ canComplete: boolean; reason?: string; completedCount?: number; nextAvailableAt?: Date }> {
    const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort();

    const completions = await prisma.friendQuestCompletion.findMany({
      where: {
        friendQuestId: questId,
        OR: [
          { user1Id: sortedUser1, user2Id: sortedUser2 },
          { user1Id: sortedUser2, user2Id: sortedUser1 }
        ]
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // ONE_TIME quest - nelze opakovat
    if (questType === FriendQuestType.ONE_TIME && completions.length > 0) {
      return {
        canComplete: false,
        reason: "Tento quest lze splnit pouze jednou",
        completedCount: completions.length
      };
    }

    // LIMITED quest - kontrola maxCompletions
    if (questType === FriendQuestType.LIMITED && maxCompletions) {
      if (completions.length >= maxCompletions) {
        return {
          canComplete: false,
          reason: `Tento quest lze splnit pouze ${maxCompletions}x`,
          completedCount: completions.length
        };
      }
    }

    // DAILY / WEEKLY quest - kontrola cooldownu
    if (cooldownHours && completions.length > 0) {
      const lastCompletion = completions[0];
      if (lastCompletion) {
        const nextAvailable = new Date(
          lastCompletion.completedAt.getTime() + cooldownHours * 60 * 60 * 1000
        );

        if (nextAvailable > new Date()) {
          return {
            canComplete: false,
            reason: `Quest bude dostupný za ${this.formatCooldown(nextAvailable)}`,
            nextAvailableAt: nextAvailable,
            completedCount: completions.length
          };
        }
      }
    }

    return {
      canComplete: true,
      completedCount: completions.length
    };
  }

  /**
   * Vypočítá level z XP
   */
  private static calculateLevel(totalXp: number): number {
    // Jednoduchý výpočet: každých 1000 XP = 1 level
    return Math.floor(totalXp / 1000) + 1;
  }

  /**
   * Formátuje cooldown do čitelného formátu
   */
  private static formatCooldown(nextAvailable: Date): string {
    const now = new Date();
    const diff = nextAvailable.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
