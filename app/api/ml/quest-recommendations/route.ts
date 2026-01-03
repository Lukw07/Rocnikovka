/**
 * API route to get ML-powered quest recommendations
 * GET /api/ml/quest-recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { mlClient } from '@/app/lib/ml/ml-client';
import { extractUserFeatures } from '@/app/lib/ml/feature-extraction';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's completed quests
    const completedQuests = await prisma.questProgress.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: { questId: true },
    });

    const excludeQuestIds = completedQuests.map((qc) => qc.questId);

    // Get ML recommendations
    try {
      const recommendations = await mlClient.recommendQuests(
        userId,
        5,
        excludeQuestIds
      );

      // Fetch quest details
      const questIds = recommendations.recommendations.map((r) => r.quest_id);
      const quests = await prisma.quest.findMany({
        where: {
          id: { in: questIds },
          status: 'ACTIVE',
        },
      });

      // Combine ML scores with quest data
      const enrichedRecommendations = recommendations.recommendations
        .map((rec) => {
          const quest = quests.find((q) => q.id === rec.quest_id);
          if (!quest) return null;

          return {
            ...quest,
            ml_score: rec.score,
            ml_reason: rec.reason,
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        recommendations: enrichedRecommendations,
        total: enrichedRecommendations.length,
      });
    } catch (mlError) {
      console.error('ML service error:', mlError);
      
      // Fallback to popularity-based recommendations
      const fallbackQuests = await prisma.quest.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: excludeQuestIds },
        },
        include: {
          _count: {
            select: { questProgresses: true },
          },
        },
        orderBy: {
          questProgresses: {
            _count: 'desc',
          },
        },
        take: 5,
      });

      return NextResponse.json({
        recommendations: fallbackQuests,
        total: fallbackQuests.length,
        fallback: true,
        message: 'Using popularity-based recommendations (ML service unavailable)',
      });
    }
  } catch (error) {
    console.error('Quest recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
