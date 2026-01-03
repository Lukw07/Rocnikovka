/**
 * API route to get student cluster/segment
 * GET /api/ml/student-cluster
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { mlClient } from '@/app/lib/ml/ml-client';
import { extractUserFeatures } from '@/app/lib/ml/feature-extraction';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Extract features
    const features = await extractUserFeatures(userId);

    // Get cluster prediction
    const cluster = await mlClient.clusterStudent(features);

    return NextResponse.json({
      user_id: userId,
      cluster: cluster.cluster_name,
      cluster_id: cluster.cluster_id,
      confidence: cluster.confidence,
      characteristics: cluster.characteristics,
    });
  } catch (error) {
    console.error('Student cluster error:', error);
    return NextResponse.json(
      { error: 'Failed to get student cluster' },
      { status: 500 }
    );
  }
}
