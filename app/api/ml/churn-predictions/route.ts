/**
 * API route for teacher to get churn predictions for all students
 * GET /api/ml/churn-predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { mlClient } from '@/app/lib/ml/ml-client';
import { extractAllStudentFeatures } from '@/app/lib/ml/feature-extraction';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract features for all students
    const allFeatures = await extractAllStudentFeatures();

    // Get churn predictions for each student
    const predictions = await Promise.all(
      allFeatures.map(async (features) => {
        try {
          const prediction = await mlClient.predictChurn(
            features.user_id,
            features
          );
          return prediction;
        } catch (error) {
          console.error(`Churn prediction failed for ${features.user_id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed predictions
    const validPredictions = predictions.filter(Boolean);

    // Sort by risk level (HIGH -> MEDIUM -> LOW)
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    validPredictions.sort((a, b) => {
      return riskOrder[a!.risk_level] - riskOrder[b!.risk_level];
    });

    // Get count by risk level
    const riskCounts = {
      HIGH: validPredictions.filter((p) => p!.risk_level === 'HIGH').length,
      MEDIUM: validPredictions.filter((p) => p!.risk_level === 'MEDIUM').length,
      LOW: validPredictions.filter((p) => p!.risk_level === 'LOW').length,
    };

    return NextResponse.json({
      total_students: validPredictions.length,
      risk_counts: riskCounts,
      predictions: validPredictions,
    });
  } catch (error) {
    console.error('Churn predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to get churn predictions' },
      { status: 500 }
    );
  }
}
