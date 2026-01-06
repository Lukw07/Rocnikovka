import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: guildId } = await params;
    const { newLeaderId } = await request.json();

    if (!newLeaderId) {
      return NextResponse.json(
        { error: "New leader ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ověř, že guild existuje a že current user je LEADER
    const currentMember = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId: user.id,
        },
      },
    });

    if (!currentMember || currentMember.role !== "LEADER") {
      return NextResponse.json(
        { error: "Only guild leader can transfer leadership" },
        { status: 403 }
      );
    }

    // Ověř, že nový leader je členem guildy
    const newLeaderMember = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId: newLeaderId,
        },
      },
    });

    if (!newLeaderMember) {
      return NextResponse.json(
        { error: "New leader must be a guild member" },
        { status: 400 }
      );
    }

    // Proveď transfer leadership v transakci
    await prisma.$transaction([
      // Změň current leadera na OFFICER
      prisma.guildMember.update({
        where: {
          guildId_userId: {
            guildId,
            userId: user.id,
          },
        },
        data: {
          role: "OFFICER",
        },
      }),
      // Změň nového člena na LEADER
      prisma.guildMember.update({
        where: {
          guildId_userId: {
            guildId,
            userId: newLeaderId,
          },
        },
        data: {
          role: "LEADER",
        },
      }),
      // Zaznamenej aktivitu
      prisma.guildActivity.create({
        data: {
          guildId,
          userId: user.id,
          action: "leadership_transferred",
          metadata: {
            newLeaderId,
            oldLeaderId: user.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Leadership transferred successfully",
      newLeaderId,
    });
  } catch (error) {
    console.error("Error transferring leadership:", error);
    return NextResponse.json(
      { error: "Failed to transfer leadership" },
      { status: 500 }
    );
  }
}
