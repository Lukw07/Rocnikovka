import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify guild exists
    const guild = await prisma.guild.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!guild) {
      return NextResponse.json(
        { error: "Guild not found" },
        { status: 404 }
      )
    }

    // Check if user is leader or officer
    const memberRole = guild.members[0]?.role
    if (memberRole !== "LEADER" && memberRole !== "OFFICER") {
      return NextResponse.json(
        { error: "Only leaders and officers can view join requests" },
        { status: 403 }
      )
    }

    // Fetch all join requests for this guild
    const requests = await prisma.guildJoinRequest.findMany({
      where: { guildId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[GUILD_REQUESTS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
