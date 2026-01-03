/**
 * Market Stats Dashboard
 * Zobrazuje statistiky a trending items
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, DollarSign, Eye, Flame } from 'lucide-react';

interface TrendingItem {
  itemId: string;
  itemName: string;
  imageUrl?: string;
  rarity: string;
  popularityScore: number;
  priceChange24h: number;
  currentAvgPrice: number;
  demandTrend: string;
  sales24h: number;
}

interface MarketStats {
  summary: {
    totalListings: number;
    totalTransactions24h: number;
    totalVolume24h: number;
    averageTransactionValue: number;
  };
  trending: TrendingItem[];
  mostViewed: Array<{
    itemId: string;
    itemName: string;
    imageUrl?: string;
    rarity: string;
    totalViews: number;
  }>;
}

export default function MarketStats() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/marketplace/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'bg-gray-500',
      UNCOMMON: 'bg-green-500',
      RARE: 'bg-blue-500',
      EPIC: 'bg-purple-500',
      LEGENDARY: 'bg-orange-500',
    };
    return colors[rarity] || 'bg-gray-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'RISING') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'FALLING') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Listings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.summary.totalListings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transactions (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">{stats.summary.totalTransactions24h}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Volume (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.summary.totalVolume24h.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.summary.averageTransactionValue.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trending Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Items
          </CardTitle>
          <CardDescription>
            Most popular items based on sales, views, and demand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.trending.map((item, index) => (
              <div 
                key={item.itemId}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/marketplace?searchQuery=${encodeURIComponent(item.itemName)}`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                {/* Image */}
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.itemName}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{item.itemName}</p>
                    <Badge className={`${getRarityColor(item.rarity)} text-xs`}>
                      {item.rarity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      {getTrendIcon(item.demandTrend)}
                      {item.demandTrend}
                    </span>
                    <span>{item.sales24h} sales today</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">
                    {item.currentAvgPrice} 🪙
                  </p>
                  {item.priceChange24h !== 0 && (
                    <p className={`text-sm ${item.priceChange24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.priceChange24h > 0 ? '+' : ''}{item.priceChange24h.toFixed(1)}%
                    </p>
                  )}
                </div>

                {/* Popularity */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-200 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Score</p>
                      <p className="text-lg font-bold text-orange-600">{item.popularityScore}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            Most Viewed Items
          </CardTitle>
          <CardDescription>
            Items that players are interested in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.mostViewed.map((item) => (
              <div 
                key={item.itemId}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/marketplace?searchQuery=${encodeURIComponent(item.itemName)}`}
              >
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.itemName}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm">{item.itemName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getRarityColor(item.rarity)} text-xs`}>
                      {item.rarity}
                    </Badge>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.totalViews}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
