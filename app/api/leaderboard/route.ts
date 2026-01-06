// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const filterType = url.searchParams.get("filterType") || "class"
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Získáme aktuálního uživatele
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        class: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Vytvoříme filtr pro view
    const whereClause: any = {
      role: "STUDENT"
    }

    if (filterType === "class" && currentUser.classId) {
      whereClause.classId = currentUser.classId
    } else if (filterType === "grade" && currentUser.grade) {
      whereClause.grade = currentUser.grade
    }

    // Získáme data z view
    const leaderboardData = await prisma.leaderboardView.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        total_xp: 'desc'
      }
    })

    // Fetch avatars and pinned badges for these users
    const userIds = leaderboardData.map(u => u.id)
    const usersWithData = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { 
        id: true, 
        avatarUrl: true,
        badges: {
          where: { isPinned: true },
          include: { badge: true },
          take: 1
        }
      }
    })

    // Fetch guild memberships for these users
    const guildMemberships = await prisma.guildMember.findMany({
      where: { userId: { in: userIds } },
      include: {
        guild: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    })

    const guildMap = new Map(guildMemberships.map(gm => [gm.userId, gm.guild]))
    
    const userMap = new Map(usersWithData.map(u => [u.id, u]))

    // Připravíme userData
    const currentUserInLeaderboard = leaderboardData.find(user => user.id === currentUser.id)
    const userData = {
      id: currentUser.id,
      name: currentUser.name || "Unknown",
      classId: currentUser.classId || "",
      className: currentUser.class?.name || "Bez třídy",
      grade: currentUser.grade || 0,
      totalXP: currentUserInLeaderboard?.total_xp || 0,
    }

    // Najdeme pozici uživatele
    const currentUserPosition = leaderboardData.findIndex(user => user.id === currentUser.id) + 1

    // Transformujeme data pro frontend
    const leaderboard = leaderboardData.map(row => {
      const user = userMap.get(row.id)
      const pinnedBadge = user?.badges[0]?.badge
      const guild = guildMap.get(row.id)
      
      return {
        id: row.id,
        name: row.name,
        totalXP: row.total_xp,
        class: row.class_name || "Bez třídy",
        grade: row.grade || 0,
        classId: row.classId || "",
        avatarUrl: user?.avatarUrl || null,
        badgeRarity: pinnedBadge?.rarity || null,
        guildId: guild?.id || null,
        guildName: guild?.name || null,
        guildLogoUrl: guild?.logoUrl || null
      }
    })

    return NextResponse.json({ 
      leaderboard,
      userData,
      currentUserPosition: currentUserPosition > 0 ? currentUserPosition : null
    })

  } catch (error) {
   
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}