
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/app/lib/prisma"
import { QuestServiceEnhanced } from "@/app/lib/services/quests-enhanced"
import { QuestType } from "@/app/lib/generated"

const gradeSchema = z.object({
  userId: z.string(),
  gradeValue: z.number().min(1).max(5),
  subjectId: z.string().optional(),
  weight: z.number().default(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gradeValue, subjectId, weight } = gradeSchema.parse(body)

    // 1. Verify User
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Process Rewards (Simplified)
    // Grade 1 = 100xp * weight
    // Grade 2 = 50xp * weight
    // ...
    let xpReward = 0
    if (gradeValue === 1) xpReward = 100 * weight
    else if (gradeValue === 2) xpReward = 50 * weight
    else if (gradeValue === 3) xpReward = 10 * weight

    if (xpReward > 0) {
      // Add XP (assuming XPAudit triggers user update via triggers or we do it manually)
      // For now, simple log + update
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { 
                    reputation: { // Just dummy update to touch user or add rep
                        update: { points: { increment: gradeValue === 1 ? 5 : 0 } }
                    }
                } 
            }),
            prisma.xPAudit.create({
                data: {
                    userId,
                    amount: xpReward,
                    reason: `School Grade: ${gradeValue}`,
                    type: "ACTIVITY" // Using closest Enum
                }
            })
        ])
    }

    // 3. Update Global Quests
    // Find all active global quests that track grades
    const globalQuests = await prisma.quest.findMany({
      where: {
        questType: QuestType.GLOBAL,
        status: "ACTIVE",
        globalUnit: { in: ["grades", "grades_1"] } // Match our units
      }
    })

    for (const q of globalQuests) {
      // Check condition
      if (q.globalUnit === "grades_1" && gradeValue !== 1) continue;
      
      // Contribute
      await QuestServiceEnhanced.contributeToGlobalQuest(q.id, userId, 1) // Increment by 1 grade count
    }

    return NextResponse.json({ success: true, message: "Grade processed", xp: xpReward })
  } catch (error) {
    console.error("Grade Integration Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
