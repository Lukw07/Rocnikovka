'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, ArrowRightLeft, Package, Check, X, Clock } from 'lucide-react';

interface TradeItem {
  id: string;
  tradeId: string;
  itemId: string;
  quantity: number;
  offeredBy: string;
  item: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    rarity: string;
  };
}

interface Trade {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  requesterCoins: number;
  recipientCoins: number;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tradeItems: TradeItem[];
}

const statusLabels = {
  PENDING: { label: 'Čeká', color: 'bg-yellow-500' },
  ACCEPTED: { label: 'Přijato', color: 'bg-green-500' },
  REJECTED: { label: 'Odmítnuto', color: 'bg-red-500' },
  COMPLETED: { label: 'Dokončeno', color: 'bg-blue-500' },
  CANCELLED: { label: 'Zrušeno', color: 'bg-gray-500' },
};

export function TradingList() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trading');
      const data = await response.json();

      if (response.ok) {
        setTrades(data.trades || []);
      } else {
        toast.error('Nepodařilo se načíst obchody');
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast.error('Chyba při načítání obchodů');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      setActionLoading(tradeId);
      const response = await fetch(`/api/trading/${tradeId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Obchod přijat!');
        
        // Trigger stats update
        fetch('/api/progression/stats').catch(() => {});
        
        await fetchTrades();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Nepodařilo se přijmout obchod');
      }
    } catch (error) {
      console.error('Error accepting trade:', error);
      toast.error('Chyba při přijímání obchodu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      setActionLoading(tradeId);
      const response = await fetch(`/api/trading/${tradeId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Obchod odmítnut');
        await fetchTrades();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Nepodařilo se odmítnout obchod');
      }
    } catch (error) {
      console.error('Error rejecting trade:', error);
      toast.error('Chyba při odmítání obchodu');
    } finally {
      setActionLoading(null);
    }
  };

  const TradeCard = ({ trade, currentUserId }: { trade: Trade; currentUserId?: string }) => {
    const isReceived = trade.recipientId === currentUserId;
    const otherUser = isReceived ? trade.requester : trade.recipient;
    const myItems = trade.tradeItems.filter(item => 
      isReceived ? item.offeredBy === trade.requesterId : item.offeredBy === trade.recipientId
    );
    const theirItems = trade.tradeItems.filter(item => 
      isReceived ? item.offeredBy === trade.recipientId : item.offeredBy === trade.requesterId
    );

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{otherUser.name}</CardTitle>
                <CardDescription>
                  {new Date(trade.createdAt).toLocaleDateString('cs-CZ')}
                </CardDescription>
              </div>
            </div>
            <Badge className={statusLabels[trade.status].color}>
              {statusLabels[trade.status].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trade Items */}
          <div className="grid grid-cols-2 gap-4">
            {/* My Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {isReceived ? 'Dostanu' : 'Nabízím'}
              </h4>
              {theirItems.length > 0 ? (
                <div className="space-y-1">
                  {theirItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3" />
                      <span>{item.item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Žádné předměty</p>
              )}
              {(isReceived ? trade.requesterCoins : trade.recipientCoins) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">🪙</span>
                  <span>{isReceived ? trade.requesterCoins : trade.recipientCoins} coinů</span>
                </div>
              )}
            </div>

            <ArrowRightLeft className="h-4 w-4 self-center justify-self-center text-muted-foreground" />

            {/* Their Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {isReceived ? 'Nabízím' : 'Dostanu'}
              </h4>
              {myItems.length > 0 ? (
                <div className="space-y-1">
                  {myItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3" />
                      <span>{item.item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Žádné předměty</p>
              )}
              {(isReceived ? trade.recipientCoins : trade.requesterCoins) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">🪙</span>
                  <span>{isReceived ? trade.recipientCoins : trade.requesterCoins} coinů</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {trade.status === 'PENDING' && isReceived && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAcceptTrade(trade.id)}
                disabled={actionLoading === trade.id}
              >
                {actionLoading === trade.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Přijmout
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleRejectTrade(trade.id)}
                disabled={actionLoading === trade.id}
              >
                {actionLoading === trade.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Odmítnout
                  </>
                )}
              </Button>
            </div>
          )}

          {trade.status === 'PENDING' && !isReceived && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Clock className="h-4 w-4" />
              <span>Čeká na odpověď...</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingTrades = trades.filter(t => t.status === 'PENDING');
  const completedTrades = trades.filter(t => t.status !== 'PENDING');

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">
          Aktivní ({pendingTrades.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Historie ({completedTrades.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pendingTrades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Žádné aktivní obchody</h3>
              <p className="text-muted-foreground">
                Začněte obchodovat s přáteli!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingTrades.map(trade => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {completedTrades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Žádná historie</h3>
              <p className="text-muted-foreground">
                Historie vašich obchodů se zobrazí zde
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {completedTrades.map(trade => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
