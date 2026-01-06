import { prisma } from "@/app/lib/prisma"
import { MoneyTxType, TradeStatus } from "@/app/lib/generated"
import { generateRequestId } from "@/app/lib/utils"

export type ActivityEntry = {
  id: string
  type: "money" | "xp" | "purchase" | "trade" | "job" | "badge"
  title: string
  description?: string
  amount?: number
  currency?: "money" | "xp"
  direction?: "in" | "out"
  createdAt: Date
  meta?: Record<string, unknown>
}

const typeAllowList = new Set(["money", "xp", "purchase", "trade", "job", "badge"])

export class ActivityService {
  static async getPlayerActivity(
    params: { userId: string; limit?: number; since?: Date; types?: string[] },
    requestId?: string
  ): Promise<ActivityEntry[]> {
    const reqId = requestId || generateRequestId()
    const limit = Math.min(Math.max(params.limit || 50, 1), 200)
    const since = params.since
    const filters = params.types?.filter((t) => typeAllowList.has(t as any)) as ActivityEntry["type"][] | undefined

    const [money, xp, purchases, trades] = await Promise.all([
      prisma.moneyTx.findMany({
        where: {
          userId: params.userId,
          ...(since ? { createdAt: { gte: since } } : {})
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      prisma.xPAudit.findMany({
        where: {
          userId: params.userId,
          ...(since ? { createdAt: { gte: since } } : {})
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      prisma.purchase.findMany({
        where: {
          userId: params.userId,
          ...(since ? { createdAt: { gte: since } } : {})
        },
        include: { item: true },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      prisma.trade.findMany({
        where: {
          OR: [{ requesterId: params.userId }, { recipientId: params.userId }],
          ...(since ? { createdAt: { gte: since } } : {})
        },
        include: {
          requester: { select: { name: true, id: true } },
          recipient: { select: { name: true, id: true } }
        },
        orderBy: { createdAt: "desc" },
        take: limit
      })
    ])

    const moneyEntries: ActivityEntry[] = money.map((tx) => ({
      id: tx.id,
      type: "money",
      title: tx.type === MoneyTxType.EARNED ? "Příjem" : tx.type === MoneyTxType.REFUND ? "Vrácení" : "Útrata",
      description: tx.reason,
      amount: tx.amount,
      currency: "money",
      direction: tx.type === MoneyTxType.EARNED || tx.type === MoneyTxType.REFUND ? "in" : "out",
      createdAt: tx.createdAt
    }))

    const xpEntries: ActivityEntry[] = xp.map((row) => ({
      id: row.id,
      type: "xp",
      title: row.amount >= 0 ? "Získané XP" : "Ztracené XP",
      description: row.reason,
      amount: row.amount,
      currency: "xp",
      direction: row.amount >= 0 ? "in" : "out",
      createdAt: row.createdAt
    }))

    const purchaseEntries: ActivityEntry[] = purchases.map((p) => ({
      id: p.id,
      type: "purchase",
      title: `Nákup: ${p.item.name}`,
      description: p.item.description || undefined,
      amount: p.price,
      currency: "money",
      direction: "out",
      createdAt: p.createdAt,
      meta: { itemId: p.itemId }
    }))

    const tradeEntries: ActivityEntry[] = trades.map((t) => {
      const isRequester = t.requesterId === params.userId
      const counterpart = isRequester ? t.recipient : t.requester
      return {
        id: t.id,
        type: "trade",
        title: `Trade ${t.status.toLowerCase()}`,
        description: counterpart?.name ? `S ${counterpart.name}` : undefined,
        createdAt: t.createdAt,
        meta: {
          status: t.status,
          role: isRequester ? "requester" : "recipient",
          counterpartId: counterpart?.id,
          counterpartName: counterpart?.name
        }
      }
    })

    let entries = [...moneyEntries, ...xpEntries, ...purchaseEntries, ...tradeEntries]

    if (filters && filters.length > 0) {
      entries = entries.filter((e) => filters.includes(e.type))
    }

    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return entries.slice(0, limit)
  }
}
