'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceHistoryData {
  periodStart: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  totalSold: number;
}

interface ItemPriceChartProps {
  itemId: string;
}

export function ItemPriceChart({ itemId }: ItemPriceChartProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceHistory();
  }, [itemId]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/price-history/${itemId}?period=daily`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.priceHistory
    .slice(0, 14)
    .reverse()
    .map((entry: PriceHistoryData) => ({
      date: new Date(entry.periodStart).toLocaleDateString('cs-CZ', { 
        month: 'short', 
        day: 'numeric' 
      }),
      avg: entry.averagePrice,
      low: entry.lowestPrice,
      high: entry.highestPrice,
    }));

  const currentPrice = data.currentMarket.avgPrice;
  const basePrice = data.item.price;
  const priceChange = ((currentPrice - basePrice) / basePrice) * 100;
  const isUp = priceChange > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📊 Cenová historie: {data.item.name}</span>
          <Badge variant={isUp ? 'destructive' : 'default'}>
            {isUp ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </Badge>
        </CardTitle>
        <CardDescription>
          Poslední 2 týdny marketplace aktivita
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Market Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Aktuální průměr</p>
            <p className="text-2xl font-bold">{currentPrice} 💰</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nejlevnější</p>
            <p className="text-xl font-semibold text-green-600">
              {data.currentMarket.lowestPrice} 💰
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nejdražší</p>
            <p className="text-xl font-semibold text-red-600">
              {data.currentMarket.highestPrice} 💰
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aktivní nabídky</p>
            <p className="text-xl font-semibold">{data.currentMarket.activeListings}</p>
          </div>
        </div>

        {/* Price Chart - Simple Text Chart */}
        <div className="h-64 bg-muted/30 rounded-lg p-4 overflow-x-auto">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold mb-3">Cenová história (poslední 14 dní)</p>
            {chartData.map((entry: any, idx: number) => {
              const maxPrice = Math.max(...chartData.map((d: any) => d.high));
              const barHeight = (entry.avg / maxPrice) * 100;
              return (
                <div key={idx} className="flex items-end gap-2 h-6">
                  <div className="w-8 text-xs text-muted-foreground text-right">{entry.date}</div>
                  <div className="flex-1 flex items-end gap-1 h-full">
                    <div 
                      className="bg-blue-500 opacity-60 rounded-sm" 
                      style={{ height: `${barHeight}%`, width: '8px' }}
                      title={`Průměr: ${entry.avg}💰`}
                    />
                    <div 
                      className="bg-green-500 opacity-40 rounded-sm" 
                      style={{ height: `${(entry.low / maxPrice) * 100}%`, width: '6px' }}
                      title={`Min: ${entry.low}💰`}
                    />
                    <div 
                      className="bg-red-500 opacity-40 rounded-sm" 
                      style={{ height: `${(entry.high / maxPrice) * 100}%`, width: '6px' }}
                      title={`Max: ${entry.high}💰`}
                    />
                  </div>
                  <div className="text-xs text-right w-12">{entry.avg}💰</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Celkem prodáno</p>
            <p className="font-semibold">{data.stats.totalSales}x</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Základní cena</p>
            <p className="font-semibold">{basePrice} 💰</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dostupnost</p>
            <p className="font-semibold">{data.currentMarket.availableQuantity}x</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketplaceStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/stats?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📈 Marketplace Statistiky</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="daily">Denně</option>
          <option value="weekly">Týdně</option>
          <option value="monthly">Měsíčně</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktivní nabídky</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeListingsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transakce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objem Gold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalGoldVolume.toLocaleString()} 💰</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objem Gems</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalGemVolume} 💎</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Nejprodávanější itemy</CardTitle>
          <CardDescription>Top 10 itemů podle počtu prodejů</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topSelling.slice(0, 10).map((item: any, index: number) => (
              <div key={item.item?.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-lg w-8">#{index + 1}</div>
                  <div>
                    <p className="font-semibold">{item.item?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.totalQuantitySold}x prodáno
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.totalSales} transakcí</p>
                  <p className="text-sm text-muted-foreground">
                    {item.totalGoldVolume.toLocaleString()} 💰 objem
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Traders */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Traders</CardTitle>
          <CardDescription>Nejúspěšnější obchodníci</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topTraders.slice(0, 5).map((trader: any, index: number) => (
              <div key={trader.userId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-lg w-8">#{index + 1}</div>
                  <div>
                    <p className="font-semibold">Trader {trader.userId.slice(0, 8)}</p>
                    {trader.isVerifiedTrader && (
                      <Badge variant="default" className="text-xs">✓ Ověřený</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{trader.totalSales} prodejů</p>
                  <p className="text-sm text-muted-foreground">
                    Trust: {trader.trustScore}/100
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
