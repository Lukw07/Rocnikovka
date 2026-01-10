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
      banned: true,
      bannedAt: true,
      banReason: true,
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

export async function getAllGuilds() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const guilds = await prisma.guild.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        where: {
          role: "LEADER"
        }
      },
      _count: {
        select: {
          members: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform the data to include leader info
  const guildsWithLeaders = guilds.map(guild => ({
    ...guild,
    leader: guild.members[0]?.user || { id: guild.leaderId, name: "Neznámý" }
  }))

  return guildsWithLeaders
}

export async function getGuildStats() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const [total, publicCount, privateCount] = await Promise.all([
    prisma.guild.count(),
    prisma.guild.count({ where: { isPublic: true } }),
    prisma.guild.count({ where: { isPublic: false } })
  ])

  return {
    total,
    public: publicCount,
    private: privateCount
  }
}

export async function deleteGuild(guildId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  // First remove all guild members
  await prisma.guildMember.deleteMany({
    where: { guildId }
  })

  // Then delete the guild
  await prisma.guild.delete({
    where: { id: guildId }
  })

  revalidatePath("/dashboard/admin/guilds")
}

export async function updateGuild(guildId: string, data: { isPublic?: boolean; name?: string; description?: string }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  await prisma.guild.update({
    where: { id: guildId },
    data
  })

  revalidatePath("/dashboard/admin/guilds")
}

export async function banUser(targetUserId: string, reason: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, banned: true }
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  if (targetUser.role === UserRole.OPERATOR) {
    throw new Error("Cannot ban another operator")
  }

  if (targetUser.banned) {
    throw new Error("User is already banned")
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      banned: true,
      bannedAt: new Date(),
      bannedBy: session.user.id,
      banReason: reason
    }
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function unbanUser(targetUserId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { banned: true }
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  if (!targetUser.banned) {
    throw new Error("User is not banned")
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      banned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null
    }
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function resetUserState(targetUserId: string) {
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

  if (targetUser.role === UserRole.OPERATOR) {
    throw new Error("Cannot reset operator state")
  }

  // Reset user's progress - this is a destructive operation
  await prisma.$transaction([
    // Reset currencies
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        gold: 0,
        gems: 0
      }
    }),
    // Delete XP sources
    prisma.xPSource.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset achievement progress
    prisma.achievementProgress.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset skill points
    prisma.skillPoint.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset player skills
    prisma.playerSkill.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset reputation
    prisma.reputation.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset quest progress
    prisma.questProgress.deleteMany({
      where: { userId: targetUserId }
    }),
    // Remove from guild
    prisma.guildMember.deleteMany({
      where: { userId: targetUserId }
    }),
    // Reset inventory
    prisma.userInventory.deleteMany({
      where: { userId: targetUserId }
    })
  ])

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function getGuildDetails(guildId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          joinedAt: 'asc'
        }
      },
      quests: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          members: true,
          quests: true
        }
      }
    }
  })

  if (!guild) {
    throw new Error("Guild not found")
  }

  // Find the leader
  const leaderMember = guild.members.find(member => member.role === "LEADER")
  const leader = leaderMember ? {
    id: leaderMember.user.id,
    name: leaderMember.user.name,
    avatar: null // Avatar not available in User model
  } : null

  // Transform members data
  const members = guild.members.map(member => ({
    id: member.user.id,
    username: member.user.name,
    avatar: null, // Avatar not available in User model
    role: member.role,
    joinedAt: member.joinedAt
  }))

  return {
    ...guild,
    members,
    leader
  }
}
