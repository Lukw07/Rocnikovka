'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Coins, Gem } from 'lucide-react';

interface WalletBalance {
  userId: string;
  name: string;
  gold: number;
  gems: number;
  totalWealth: number;
}

export default function WalletCard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>💰 Peněženka</CardTitle>
          <CardDescription>Načítání...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <Card className="w-full bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-yellow-600" />
          Peněženka
        </CardTitle>
        <CardDescription>Tvoje finanční prostředky</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gold */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-full">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gold</p>
              <p className="text-2xl font-bold text-yellow-600">{balance.gold.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Gems */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-full">
              <Gem className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gems</p>
              <p className="text-2xl font-bold text-cyan-600">{balance.gems.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Total Wealth */}
        <div className="p-4 bg-linear-to-r from-yellow-500/10 to-cyan-500/10 rounded-lg border-2 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Celkové bohatství
            </span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-yellow-600 to-cyan-600">
              {balance.totalWealth.toLocaleString()}
            </span>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
