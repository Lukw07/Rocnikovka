import { Metadata } from "next";
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ArrowRightLeft } from "lucide-react";
import { TradingList } from "@/app/components/friends/trading-list";
import { CreateTradeDialog } from "@/app/components/friends/create-trade-dialog";
import prisma from "@/app/lib/prisma";

export const metadata: Metadata = {
  title: "Obchody | EduRPG",
  description: "Obchodujte s ostatními hráči"
};

export default async function TradingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch user's friends for CreateTradeDialog
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: session.user.id },
        { user2Id: session.user.id }
      ],
      status: 'ACCEPTED'
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      user2: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  const friends = friendships.map(f => 
    f.user1Id === session.user.id ? f.user2 : f.user1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Obchody</h1>
            <p className="text-muted-foreground">
              Vyměňujte předměty s ostatními hráči
            </p>
          </div>
        </div>
        <CreateTradeDialog friends={friends} />
      </div>

      {/* Trading List */}
      <TradingList />
    </div>
  );
}
