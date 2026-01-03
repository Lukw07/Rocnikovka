/**
 * Friend Quests API - GET
 * Získání dostupných Friend Questů pro dvojici přátel
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { FriendQuestService } from "@/app/lib/services/friend-quest.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get("friendId");
    const mode = searchParams.get("mode") || "available"; // available, active, completed

    // Mode: available - dostupné questy pro dvojici
    if (mode === "available") {
      if (!friendId) {
        return NextResponse.json(
          { success: false, error: "friendId is required" },
          { status: 400 }
        );
      }

      const result = await FriendQuestService.getAvailableQuestsForFriends(
        session.user.id,
        friendId
      );

      return NextResponse.json(result, {
        status: result.success ? 200 : 400
      });
    }

    // Mode: active - aktivní questy uživatele
    if (mode === "active") {
      const result = await FriendQuestService.getActiveQuestsForUser(
        session.user.id
      );

      return NextResponse.json(result, {
        status: result.success ? 200 : 400
      });
    }

    // Mode: completed - dokončené questy
    if (mode === "completed") {
      const limit = parseInt(searchParams.get("limit") || "20");
      const result = await FriendQuestService.getCompletedQuests(
        session.user.id,
        limit
      );

      return NextResponse.json(result, {
        status: result.success ? 200 : 400
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid mode" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Friend Quests GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
