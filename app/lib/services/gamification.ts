import { prisma } from "../prisma"
import { generateRequestId, sanitizeForLog } from "../utils"

/**
 * Dungeons & Bosses Service
 */
export class DungeonService {
  static async getBosses(filters?: { level?: number; isActive?: boolean }) {
    return await prisma.boss.findMany({
      where: filters,
      orderBy: { level: "asc" }
    })
  }

  static async createDungeonRun(
    bossId: string,
    leaderId: string,
    participantIds: string[]
  ) {
    const boss = await prisma.boss.findUnique({ where: { id: bossId } })
    if (!boss) throw new Error("Boss not found")

    return await prisma.dungeonRun.create({
      data: {
        bossId,
        leaderId,
        currentHp: boss.maxHp,
        participantIds: [leaderId, ...participantIds],
        status: "IN_COMBAT"
      }
    })
  }

  static async dealDamage(dungeonRunId: string, userId: string, damage: number) {
    return await prisma.$transaction(async (tx) => {
      const run = await tx.dungeonRun.findUnique({
        where: { id: dungeonRunId },
        include: { boss: true }
      })

      if (!run) throw new Error("Dungeon run not found")
      if (run.status !== "IN_COMBAT") throw new Error("Combat not active")

      // Record damage
      await tx.damageLog.create({
        data: {
          dungeonRunId,
          userId,
          damage
        }
      })

      // Update run
      const newHp = Math.max(0, run.currentHp - damage)
      const status = newHp <= 0 ? "COMPLETED" : "IN_COMBAT"

      return await tx.dungeonRun.update({
        where: { id: dungeonRunId },
        data: {
          currentHp: newHp,
          totalDamage: { increment: damage },
          status,
          completedAt: newHp <= 0 ? new Date() : null
        }
      })
    })
  }

  static async getDungeonProgress(dungeonRunId: string) {
    return await prisma.dungeonRun.findUnique({
      where: { id: dungeonRunId },
      include: {
        boss: true,
        damageLog: {
          orderBy: { timestamp: "desc" },
          take: 20
        }
      }
    })
  }
}

/**
 * Random Finds Service - Chance-based treasure discovery
 */
export class RandomFindService {
  static async discoverItem(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    // Chance calculation (20% to find something)
    if (Math.random() > 0.2) {
      return null // No discovery
    }

    // Rarity distribution
    const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const
    const weights = [0.5, 0.25, 0.15, 0.07, 0.03]
    let rand = Math.random()
    let rarity: typeof rarities[number] = "COMMON"
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i]
      if (!weight) continue
      rand -= weight
      if (rand <= 0) {
        rarity = rarities[i]!
        break
      }
    }

    // Create find
    const names = [
      "Kouzelný měnec",
      "Stříbrný náramek",
      "Zlatý medailon",
      "Mystický krystal",
      "Drahocenný klenot"
    ]

    return await prisma.randomFind.create({
      data: {
        userId,
        name: names[Math.floor(Math.random() * names.length)]!,
        rarity,
        value: rarity === "LEGENDARY" ? 1000 : rarity === "EPIC" ? 500 : rarity === "RARE" ? 200 : 50
      }
    })
  }

  static async getUserFinds(userId: string) {
    return await prisma.randomFind.findMany({
      where: { userId },
      orderBy: { foundAt: "desc" }
    })
  }
}

/**
 * Trading Service
 */
export class TradeService {
  static async createOffer(
    requesterId: string,
    recipientId: string,
    offeredItems: string[],
    wantedItems: string[],
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      // Create trade offer
      const offer = await tx.tradeOffer.create({
        data: {
          offeredItemIds: offeredItems,
          wantedItemIds: wantedItems
        }
      })

      // Create trade
      const trade = await tx.trade.create({
        data: {
          offerId: offer.id,
          requesterId,
          recipientId,
          status: "PENDING"
        }
      })

      return trade
    })
  }

  static async acceptTrade(tradeId: string, userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        include: { offer: true }
      })

      if (!trade) throw new Error("Trade not found")
      if (trade.recipientId !== userId) throw new Error("Unauthorized")
      if (trade.status !== "PENDING") throw new Error("Trade not pending")

      // Update trade
      return await tx.trade.update({
        where: { id: tradeId },
        data: {
          status: "COMPLETED",
          acceptedAt: new Date(),
          completedAt: new Date()
        }
      })
    })
  }

  static async getBrowsingTrades(userId: string) {
    return await prisma.trade.findMany({
      where: {
        recipientId: userId,
        status: "PENDING"
      },
      include: {
        offer: true,
        requester: { select: { id: true, name: true } }
      }
    })
  }
}

/**
 * Personal Goals Service
 */
export class GoalService {
  static async createGoal(data: {
    userId: string
    title: string
    description?: string
    targetValue: number
    reward: number
    deadline?: Date
  }) {
    return await prisma.personalGoal.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        currentValue: 0,
        reward: data.reward,
        deadline: data.deadline,
        status: "ACTIVE"
      }
    })
  }

  static async updateGoalProgress(goalId: string, progress: number) {
    const goal = await prisma.personalGoal.findUnique({
      where: { id: goalId }
    })

    if (!goal) throw new Error("Goal not found")

    const newValue = Math.min(goal.targetValue, goal.currentValue + progress)
    const completed = newValue >= goal.targetValue

    return await prisma.personalGoal.update({
      where: { id: goalId },
      data: {
        currentValue: newValue,
        status: completed ? "COMPLETED" : "ACTIVE",
        completedAt: completed ? new Date() : null
      }
    })
  }

  static async getUserGoals(userId: string) {
    return await prisma.personalGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
  }
}

/**
 * Virtual Awards Service
 */
export class AwardService {
  static async grantAward(userId: string, name: string, icon: string, rarity: string = "COMMON") {
    return await prisma.virtualAward.create({
      data: {
        userId,
        name,
        icon,
        rarity: rarity as any
      }
    })
  }

  static async getUserAwards(userId: string) {
    return await prisma.virtualAward.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" }
    })
  }
}

/**
 * Personal Space Service
 */
export class PersonalSpaceService {
  static async initializeSpace(userId: string) {
    return await prisma.personalSpace.create({
      data: {
        userId,
        theme: "default",
        layout: JSON.stringify({})
      },
      include: { furniture: true }
    })
  }

  static async getSpace(userId: string) {
    let space = await prisma.personalSpace.findUnique({
      where: { userId },
      include: { furniture: true }
    })

    if (!space) {
      space = await this.initializeSpace(userId)
    }

    return space
  }

  static async addFurniture(
    personalSpaceId: string,
    name: string,
    type: string,
    posX: number,
    posY: number
  ) {
    return await prisma.furniture.create({
      data: {
        personalSpaceId,
        name,
        type,
        positionX: posX,
        positionY: posY
      }
    })
  }

  static async removeFurniture(furnitureId: string) {
    return await prisma.furniture.delete({
      where: { id: furnitureId }
    })
  }

  static async updateLayout(personalSpaceId: string, layout: any) {
    return await prisma.personalSpace.update({
      where: { id: personalSpaceId },
      data: { layout: JSON.stringify(layout) }
    })
  }
}

/**
 * Black Market Service - Risky trading with consequences
 */
export class BlackMarketService {
  static async getItems() {
    return await prisma.blackMarketItem.findMany({
      where: { isActive: true }
    })
  }

  static async makeTrade(userId: string, itemId: string, quantity: number = 1) {
    const item = await prisma.blackMarketItem.findUnique({
      where: { id: itemId }
    })

    if (!item) throw new Error("Item not found")

    // Risk check
    const caught = Math.random() * 100 < item.risk
    const status = caught ? "CAUGHT" : "COMPLETED"

    return await prisma.$transaction(async (tx) => {
      const trade = await tx.contrabandTrade.create({
        data: {
          userId,
          itemId,
          quantity,
          status,
          discoveredBy: caught ? "GUARD" : undefined
        }
      })

      // If caught, grant penalty (reduce money)
      if (caught) {
        await tx.moneyTx.create({
          data: {
            userId,
            amount: -item.price * quantity,
            type: "SPENT",
            reason: "Caught by guards on black market!"
          }
        })
      } else {
        // If successful, grant reward
        await tx.moneyTx.create({
          data: {
            userId,
            amount: item.reward * quantity,
            type: "EARNED",
            reason: "Black market trade successful"
          }
        })
      }

      return trade
    })
  }

  static async getUserTrades(userId: string) {
    return await prisma.contrabandTrade.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { createdAt: "desc" }
    })
  }
}
