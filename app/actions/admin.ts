"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@/app/lib/generated"
import { revalidatePath } from "next/cache"
import { LevelingSystem } from "@/app/lib/leveling"

export async function toggleOperatorRole(targetUserId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  // Only allow toggling between TEACHER and OPERATOR
  if (targetUser.role !== UserRole.TEACHER && targetUser.role !== UserRole.OPERATOR) {
    throw new Error("Can only toggle operator role for teachers")
  }

  const newRole = targetUser.role === UserRole.TEACHER ? UserRole.OPERATOR : UserRole.TEACHER

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  })

  revalidatePath("/dashboard")
  return { success: true, newRole }
}

export async function getTeachersAndOperators() {
    const session = await getServerSession(authOptions)
  
    if (!session?.user || session.user.role !== UserRole.OPERATOR) {
      throw new Error("Unauthorized")
    }

    const users = await prisma.user.findMany({
        where: {
            role: {
                in: [UserRole.TEACHER, UserRole.OPERATOR]
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: {
            name: 'asc'
        }
    })

    return users
}

export async function getUserRoleStats() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const [total, students, teachers, operators] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({ where: { role: UserRole.TEACHER } }),
    prisma.user.count({ where: { role: UserRole.OPERATOR } })
  ])

  return {
    total,
    students,
    teachers,
    operators
  }
}

export async function getAllUsers() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      teacherDailyBudgets: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0,0,0,0))
          }
        },
        select: {
          budget: true,
          used: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch XP from LeaderboardView
  const xpData = await prisma.leaderboardView.findMany({
    select: {
      id: true,
      total_xp: true
    }
  })
  const xpMap = new Map(xpData.map(x => [x.id, x.total_xp]))

  // Fetch Money Balance
  const allTx = await prisma.moneyTx.groupBy({
    by: ['userId', 'type'],
    _sum: { amount: true }
  })
  
  const balanceMap = new Map<string, number>()
  
  allTx.forEach(tx => {
    const current = balanceMap.get(tx.userId) || 0
    if (tx.type === 'EARNED' || tx.type === 'REFUND') {
      balanceMap.set(tx.userId, current + (tx._sum.amount || 0))
    } else {
      balanceMap.set(tx.userId, current - (tx._sum.amount || 0))
    }
  })

  const enrichedUsers = users.map(user => {
    const totalXp = xpMap.get(user.id) || 0
    const level = LevelingSystem.getLevelFromXP(totalXp)
    const balance = balanceMap.get(user.id) || 0
    
    // Calculate remaining budget for today (sum of all subjects)
    const remainingBudget = user.teacherDailyBudgets.reduce((acc, curr) => acc + (curr.budget - curr.used), 0)

    return {
      ...user,
      stats: {
        level,
        totalXp,
        balance,
        remainingBudget
      }
    }
  })

  return enrichedUsers
}

export async function getSystemLogs(limit = 100) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const logs = await prisma.systemLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  return logs
}
