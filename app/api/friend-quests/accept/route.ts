/**
 * Friend Quests API - POST
 * Přijetí Friend Questu
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { FriendQuestService } from "@/app/lib/services/friend-quest.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { friendQuestId, friendId } = body;

    if (!friendQuestId || !friendId) {
      return NextResponse.json(
        { success: false, error: "friendQuestId and friendId are required" },
        { status: 400 }
      );
    }

    const result = await FriendQuestService.acceptFriendQuest({
      friendQuestId,
      user1Id: session.user.id,
      user2Id: friendId
    });

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    });

  } catch (error) {
    console.error("Friend Quest accept error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
