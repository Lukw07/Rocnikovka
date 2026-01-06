
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/app/lib/prisma"
import { QuestServiceEnhanced } from "@/app/lib/services/quests-enhanced"
import { QuestType } from "@/app/lib/generated"

const attendanceSchema = z.object({
  userId: z.string(),
  hours: z.number().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, hours } = attendanceSchema.parse(body)

    // 1. Verify User
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Global Quest Update
    const globalQuests = await prisma.quest.findMany({
      where: {
        questType: QuestType.GLOBAL,
        status: "ACTIVE",
        globalUnit: "hours"
      }
    })

    for (const q of globalQuests) {
      await QuestServiceEnhanced.contributeToGlobalQuest(q.id, userId, hours)
    }

    return NextResponse.json({ success: true, message: "Attendance processed" })

  } catch (error) {
    console.error("Attendance Integration Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
