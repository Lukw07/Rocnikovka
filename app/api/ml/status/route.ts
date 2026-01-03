/**
 * API route to get ML service health and models status
 * GET /api/ml/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { mlClient } from '@/app/lib/ml/ml-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check health
    const health = await mlClient.healthCheck();
    
    // Get models status
    const status = await mlClient.getModelsStatus();

    return NextResponse.json({
      service: {
        available: true,
        status: health.status,
      },
      models: status,
    });
  } catch (error) {
    console.error('ML service status error:', error);
    return NextResponse.json({
      service: {
        available: false,
        error: 'ML service unavailable',
      },
      models: null,
    });
  }
}
