/**
 * Friend Quest Progress API - PATCH
 * Aktualizace progressu na Friend Questu
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { FriendQuestService } from "@/app/lib/services/friend-quest.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { progressDelta } = body;

    if (typeof progressDelta !== 'number' || progressDelta < 0 || progressDelta > 100) {
      return NextResponse.json(
        { success: false, error: "progressDelta must be a number between 0-100" },
        { status: 400 }
      );
    }

    const result = await FriendQuestService.updateProgress({
      progressId: id,
      userId: session.user.id,
      progressDelta
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error("Friend Quest progress update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
