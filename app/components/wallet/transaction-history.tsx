'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface Transaction {
  id: string;
  amount: number;
  type: 'EARNED' | 'SPENT' | 'REFUND';
  reason: string;
  createdAt: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'EARNED' | 'SPENT' | 'REFUND'>('ALL');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL' 
        ? '/api/wallet/transactions'
        : `/api/wallet/transactions?type=${filter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EARNED':
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
      case 'SPENT':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
      case 'REFUND':
        return <RefreshCcw className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EARNED':
        return 'text-green-600';
      case 'SPENT':
        return 'text-red-600';
      case 'REFUND':
        return 'text-blue-600';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>📜 Historie transakcí</CardTitle>
        <CardDescription>Přehled všech tvých finančních operací</CardDescription>
        
        {/* Filters */}
        <div className="flex gap-2 pt-4">
          {['ALL', 'EARNED', 'SPENT', 'REFUND'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f as any)}
            >
              {f === 'ALL' ? 'Vše' : 
               f === 'EARNED' ? 'Získáno' :
               f === 'SPENT' ? 'Utraceno' : 'Vráceno'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-gray-500">Načítání...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500">Žádné transakce</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(tx.type)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {tx.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString('cs-CZ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getTypeColor(tx.type)}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </p>
                  <Badge variant={tx.type === 'EARNED' ? 'default' : 'secondary'}>
                    {tx.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
