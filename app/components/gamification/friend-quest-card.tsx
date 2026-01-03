/**
 * Friend Quest Card Component
 * Zobrazení karty Friend Questu s detaily a akcemi
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { 
  Users, 
  Trophy, 
  Coins, 
  Star, 
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface FriendQuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    questType: string;
    rewards: Array<{
      rewardType: string;
      amount?: number;
      description?: string;
      item?: {
        name: string;
        imageUrl?: string;
      };
    }>;
    completionInfo?: {
      canComplete: boolean;
      reason?: string;
      completedCount?: number;
      nextAvailableAt?: Date;
    };
  };
  progress?: {
    id: string;
    status: string;
    progress: number;
    user1Progress: number;
    user2Progress: number;
    user1: { id: string; name: string; avatarUrl?: string };
    user2: { id: string; name: string; avatarUrl?: string };
  };
  mode: "available" | "active" | "completed";
  currentUserId?: string;
  onAccept?: (questId: string) => void;
  onUpdateProgress?: (progressId: string, delta: number) => void;
  onComplete?: (progressId: string) => void;
}

const difficultyColors = {
  EASY: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-orange-500",
  EXPERT: "bg-red-500"
};

const questTypeIcons = {
  ONE_TIME: "🎯",
  DAILY: "📅",
  WEEKLY: "📆",
  LIMITED: "⏳"
};

const rewardIcons = {
  XP: Trophy,
  MONEY: Coins,
  REPUTATION: Star,
  ITEM: Gift,
  SKILLPOINTS: Star
};

export function FriendQuestCard({
  quest,
  progress,
  mode,
  currentUserId,
  onAccept,
  onUpdateProgress,
  onComplete
}: FriendQuestCardProps) {
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsAccepting(true);
    try {
      await onAccept(quest.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleUpdateProgress = async (delta: number) => {
    if (!onUpdateProgress || !progress) return;
    setIsUpdating(true);
    try {
      await onUpdateProgress(progress.id, delta);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete || !progress) return;
    setIsUpdating(true);
    try {
      await onComplete(progress.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const canComplete = progress && 
    progress.user1Progress === 100 && 
    progress.user2Progress === 100;

  const isCurrentUserProgress1 = currentUserId && progress?.user1.id === currentUserId;
  const currentProgress = isCurrentUserProgress1 
    ? progress?.user1Progress 
    : progress?.user2Progress;
  const partnerProgress = isCurrentUserProgress1 
    ? progress?.user2Progress 
    : progress?.user1Progress;
  const partner = isCurrentUserProgress1 
    ? progress?.user2 
    : progress?.user1;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{questTypeIcons[quest.questType as keyof typeof questTypeIcons] || "🎮"}</span>
              <CardTitle className="text-xl">{quest.title}</CardTitle>
            </div>
            <CardDescription>{quest.description}</CardDescription>
          </div>
          <Badge className={difficultyColors[quest.difficulty as keyof typeof difficultyColors]}>
            {quest.difficulty}
          </Badge>
        </div>

        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{quest.category}</Badge>
          <Badge variant="secondary">{quest.questType}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rewards */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Odměny
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quest.rewards.map((reward, idx) => {
              const Icon = rewardIcons[reward.rewardType as keyof typeof rewardIcons];
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  {Icon && <Icon className="w-4 h-4 text-primary" />}
                  <span className="text-sm">
                    {reward.amount && `${reward.amount} `}
                    {reward.item?.name || reward.rewardType}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress (pro active questy) */}
        {mode === "active" && progress && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Progress týmu
                </h4>
                <span className="text-sm text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Current User Progress */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {currentUserId && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                      TY
                    </div>
                  )}
                  <span className="text-xs font-medium">Tvůj progress</span>
                </div>
                <Progress value={currentProgress || 0} className="h-2" />
                <span className="text-xs text-muted-foreground">{currentProgress || 0}%</span>
              </div>

              {/* Partner Progress */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {partner?.avatarUrl ? (
                    <img 
                      src={partner.avatarUrl} 
                      alt={partner.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {partner?.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium">{partner?.name}</span>
                </div>
                <Progress value={partnerProgress || 0} className="h-2" />
                <span className="text-xs text-muted-foreground">{partnerProgress || 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Completion Info (pro available questy) */}
        {mode === "available" && quest.completionInfo && (
          <div className="text-sm space-y-1">
            {quest.completionInfo.completedCount !== undefined && quest.completionInfo.completedCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                <span>Dokončeno {quest.completionInfo.completedCount}x</span>
              </div>
            )}
            {quest.completionInfo.nextAvailableAt && (
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                <span>{quest.completionInfo.reason}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Available Quest - Accept Button */}
        {mode === "available" && onAccept && (
          <Button 
            onClick={handleAccept} 
            disabled={isAccepting || !quest.completionInfo?.canComplete}
            className="w-full"
          >
            {isAccepting ? "Přijímám..." : "Přijmout quest"}
          </Button>
        )}

        {/* Active Quest - Update Progress */}
        {mode === "active" && progress && (
          <>
            {!canComplete ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateProgress(10)}
                  disabled={isUpdating || (currentProgress || 0) >= 100}
                  className="flex-1"
                >
                  +10%
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleUpdateProgress(25)}
                  disabled={isUpdating || (currentProgress || 0) >= 100}
                  className="flex-1"
                >
                  +25%
                </Button>
                <Button 
                  onClick={() => handleUpdateProgress(100 - (currentProgress || 0))}
                  disabled={isUpdating || (currentProgress || 0) >= 100}
                  className="flex-1"
                >
                  Dokončit můj část
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Sbrat odměny!
              </Button>
            )}
          </>
        )}

        {/* Completed Quest - Status */}
        {mode === "completed" && (
          <div className="w-full flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Dokončeno!</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
