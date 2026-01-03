/**
 * API route for anomaly detection
 * GET /api/ml/anomaly-check?userId=xxx (teacher only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { mlClient } from '@/app/lib/ml/ml-client';
import { extractUserFeatures } from '@/app/lib/ml/feature-extraction';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Extract features
    const features = await extractUserFeatures(userId);

    // Detect anomalies
    const anomaly = await mlClient.detectAnomalies(userId, features);

    return NextResponse.json(anomaly);
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}
