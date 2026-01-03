/**
 * ML Dashboard Page (Teacher only)
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import MLDashboard from '@/app/components/ml/ml-dashboard';

export const metadata = {
  title: 'ML Dashboard | EduRPG',
  description: 'Machine Learning insights and predictions',
};

export default async function MLDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🧠 ML Dashboard</h1>
        <p className="text-muted-foreground">
          Machine Learning insights, predictions, and student analytics
        </p>
      </div>

      <Suspense fallback={<MLDashboardSkeleton />}>
        <MLDashboard />
      </Suspense>
    </div>
  );
}

function MLDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
