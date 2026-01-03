/**
 * Friend Quests Admin API
 * Pro učitele/adminy - vytváření Friend Questů
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { FriendQuestService, CreateFriendQuestInput } from "@/app/lib/services/friend-quest.service";
import { FriendQuestType, QuestDifficulty, UserRole } from "@/app/lib/generated";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Pouze učitelé a admini mohou vytvářet Friend Questy
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.OPERATOR) {
      return NextResponse.json(
        { success: false, error: "Only teachers and admins can create Friend Quests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validace vstupních dat
    const input: CreateFriendQuestInput = {
      title: body.title,
      description: body.description,
      category: body.category || "Challenge",
      difficulty: body.difficulty || QuestDifficulty.MEDIUM,
      questType: body.questType || FriendQuestType.ONE_TIME,
      maxCompletions: body.maxCompletions,
      cooldownHours: body.cooldownHours,
      requiredLevel: body.requiredLevel,
      requiredReputation: body.requiredReputation,
      friendshipMinDays: body.friendshipMinDays,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      rewards: body.rewards || []
    };

    if (!input.title || !input.description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (!input.rewards || input.rewards.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one reward is required" },
        { status: 400 }
      );
    }

    const result = await FriendQuestService.createFriendQuest(
      input,
      session.user.id
    );

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    });

  } catch (error) {
    console.error("Friend Quest create error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
