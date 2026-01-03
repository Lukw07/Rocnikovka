/**
 * ML Dashboard Component
 * Displays ML predictions, churn risks, and student insights
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, TrendingUp, Users, Brain, Shield, RefreshCw } from 'lucide-react';

interface ChurnPrediction {
  user_id: string;
  churn_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: Array<{
    action: string;
    message: string;
    priority: string;
  }>;
}

interface ModelsStatus {
  clustering: { loaded: boolean; n_clusters: number | null };
  recommendation: { loaded: boolean; n_users: number; n_quests: number };
  churn: { loaded: boolean; threshold: number };
  anomaly: { loaded: boolean; contamination: number };
}

export default function MLDashboard() {
  const [loading, setLoading] = useState(true);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [churnData, setChurnData] = useState<{
    total_students: number;
    risk_counts: { HIGH: number; MEDIUM: number; LOW: number };
    predictions: ChurnPrediction[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load ML service status
      const statusRes = await fetch('/api/ml/status');
      const status = await statusRes.json();
      setMlStatus(status);

      // Load churn predictions
      const churnRes = await fetch('/api/ml/churn-predictions');
      if (churnRes.ok) {
        const data = await churnRes.json();
        setChurnData(data);
      }
    } catch (error) {
      console.error('Failed to load ML data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MLDashboardSkeleton />;
  }

  const serviceAvailable = mlStatus?.service?.available;

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ML Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Service</span>
              <Badge variant={serviceAvailable ? 'default' : 'destructive'}>
                {serviceAvailable ? 'Online' : 'Offline'}
              </Badge>
            </div>

            {serviceAvailable && mlStatus.models && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <ModelStatusCard
                  name="Clustering"
                  status={mlStatus.models.clustering}
                  icon="🎯"
                />
                <ModelStatusCard
                  name="Recommendation"
                  status={mlStatus.models.recommendation}
                  icon="📚"
                />
                <ModelStatusCard
                  name="Churn Prediction"
                  status={mlStatus.models.churn}
                  icon="⚠️"
                />
                <ModelStatusCard
                  name="Anomaly Detection"
                  status={mlStatus.models.anomaly}
                  icon="🛡️"
                />
              </div>
            )}

            <Button onClick={loadData} className="w-full mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Churn Risk Overview */}
      {churnData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{churnData.total_students}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">
                {churnData.risk_counts.HIGH}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Medium Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">
                {churnData.risk_counts.MEDIUM}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Low Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {churnData.risk_counts.LOW}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="churn" className="space-y-4">
        <TabsList>
          <TabsTrigger value="churn">Churn Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>At-Risk Students</CardTitle>
              <CardDescription>
                Students with high churn probability need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {churnData && churnData.predictions.length > 0 ? (
                <div className="space-y-4">
                  {churnData.predictions
                    .filter((p) => p.risk_level === 'HIGH' || p.risk_level === 'MEDIUM')
                    .slice(0, 10)
                    .map((prediction) => (
                      <ChurnPredictionCard
                        key={prediction.user_id}
                        prediction={prediction}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No churn predictions available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>ML-Powered Recommendations</CardTitle>
              <CardDescription>
                AI-generated recommendations for improving student engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quest recommendations are personalized per student.
                Check individual student profiles for tailored suggestions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>ML Insights</CardTitle>
              <CardDescription>
                Key insights from machine learning analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Student Segmentation</h4>
                    <p className="text-sm text-blue-700">
                      Students are automatically clustered into 5 segments based on behavior patterns
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900">Collaborative Filtering</h4>
                    <p className="text-sm text-purple-700">
                      Quest recommendations use both user similarity and content features
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Anomaly Detection</h4>
                    <p className="text-sm text-orange-700">
                      Suspicious activities are automatically flagged for review
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModelStatusCard({ name, status, icon }: any) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{name}</div>
        <Badge variant={status.loaded ? 'default' : 'secondary'} className="text-xs mt-1">
          {status.loaded ? 'Loaded' : 'Not Loaded'}
        </Badge>
      </div>
    </div>
  );
}

function ChurnPredictionCard({ prediction }: { prediction: ChurnPrediction }) {
  const riskColors = {
    HIGH: 'text-red-700 bg-red-100',
    MEDIUM: 'text-yellow-700 bg-yellow-100',
    LOW: 'text-green-700 bg-green-100',
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">Student ID: {prediction.user_id.slice(0, 8)}...</span>
        <Badge className={riskColors[prediction.risk_level]}>
          {prediction.risk_level} RISK ({(prediction.churn_probability * 100).toFixed(0)}%)
        </Badge>
      </div>

      {prediction.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Recommended Actions:</div>
          {prediction.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="text-sm p-2 bg-muted rounded flex items-start gap-2"
            >
              <Badge variant="outline" className="text-xs">
                {rec.priority}
              </Badge>
              <span className="flex-1">{rec.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MLDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
