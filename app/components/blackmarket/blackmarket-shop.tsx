'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Skull, Clock, TrendingDown, Coins, Gem } from 'lucide-react';

interface BlackMarketOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  gemPrice: number;
  rarity: string;
  stock: number;
  soldCount: number;
  discount: number;
  isFeatured: boolean;
  availableFrom: string;
  availableTo: string;
  timeLeftMs: number;
  stockRemaining: number;
}

export default function BlackMarketShop() {
  const [offers, setOffers] = useState<BlackMarketOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
    const interval = setInterval(fetchOffers, 30000); // Refresh každých 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/blackmarket');
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Error fetching blackmarket:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (offerId: string, currency: 'gold' | 'gems') => {
    try {
      setPurchasing(offerId);
      const res = await fetch('/api/blackmarket/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, currency }),
      });

      if (res.ok) {
        alert('Item zakoupen!');
        fetchOffers();
      } else {
        const error = await res.json();
        alert(error.error || 'Chyba při nákupu');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      COMMON: 'bg-gray-100 text-gray-700 border-gray-400',
      UNCOMMON: 'bg-green-100 text-green-700 border-green-400',
      RARE: 'bg-blue-100 text-blue-700 border-blue-400',
      EPIC: 'bg-purple-100 text-purple-700 border-purple-400',
      LEGENDARY: 'bg-yellow-100 text-yellow-700 border-yellow-400',
    };
    return colors[rarity] ?? 'bg-gray-100 text-gray-700 border-gray-400';
  };

  const formatTimeLeft = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} dní`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <Card><CardContent className="p-8 text-center">Načítání...</CardContent></Card>;
  }

  const featured = offers.filter(o => o.isFeatured);
  const regular = offers.filter(o => !o.isFeatured);

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-purple-900 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Skull className="h-8 w-8 text-purple-400" />
          🎭 Black Market
        </CardTitle>
        <CardDescription className="text-gray-300">
          Vzácné a časově omezené předměty
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Featured Items */}
        {featured.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              ⭐ Doporučené
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {featured.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onPurchase={purchaseItem}
                  purchasing={purchasing === offer.id}
                  getRarityColor={getRarityColor}
                  formatTimeLeft={formatTimeLeft}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Items */}
        {regular.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">📦 Všechny nabídky</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regular.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onPurchase={purchaseItem}
                  purchasing={purchasing === offer.id}
                  getRarityColor={getRarityColor}
                  formatTimeLeft={formatTimeLeft}
                />
              ))}
            </div>
          </div>
        )}

        {offers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Skull className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Momentálně žádné nabídky</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OfferCard({
  offer,
  onPurchase,
  purchasing,
  getRarityColor,
  formatTimeLeft,
  featured = false,
}: {
  offer: BlackMarketOffer;
  onPurchase: (id: string, currency: 'gold' | 'gems') => void;
  purchasing: boolean;
  getRarityColor: (rarity: string) => string;
  formatTimeLeft: (ms: number) => string;
  featured?: boolean;
}) {
  const finalPrice = Math.floor(offer.price * (1 - offer.discount / 100));
  const finalGemPrice = offer.gemPrice > 0 
    ? Math.floor(offer.gemPrice * (1 - offer.discount / 100))
    : 0;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 ${
        featured ? 'border-yellow-400 shadow-xl' : 'border-gray-600'
      } bg-gray-800/50 backdrop-blur`}
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Badge className={getRarityColor(offer.rarity)}>{offer.rarity}</Badge>
        {offer.discount > 0 && (
          <Badge className="bg-red-500">-{offer.discount}%</Badge>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 mt-6">
        <h4 className="font-bold text-lg">{offer.name}</h4>
        <p className="text-sm text-gray-400 line-clamp-2">{offer.description}</p>

        {/* Stock & Timer */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            📦 {offer.stockRemaining}/{offer.stock}
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <Clock className="h-3 w-3" />
            {formatTimeLeft(offer.timeLeftMs)}
          </span>
        </div>

        {/* Pricing */}
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm">Cena:</span>
            <div className="flex items-center gap-2">
              {offer.discount > 0 && (
                <span className="text-gray-500 line-through text-sm">
                  {offer.price}
                </span>
              )}
              <span className="font-bold flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                {finalPrice}
              </span>
            </div>
          </div>
          
          {finalGemPrice > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Nebo:</span>
              <span className="font-bold flex items-center gap-1">
                <Gem className="h-4 w-4 text-cyan-500" />
                {finalGemPrice}
              </span>
            </div>
          )}
        </div>

        {/* Purchase Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            size="sm"
            onClick={() => onPurchase(offer.id, 'gold')}
            disabled={purchasing || offer.stockRemaining === 0}
          >
            <Coins className="h-4 w-4 mr-1" />
            {purchasing ? '...' : 'Koupit'}
          </Button>
          
          {finalGemPrice > 0 && (
            <Button
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              size="sm"
              onClick={() => onPurchase(offer.id, 'gems')}
              disabled={purchasing || offer.stockRemaining === 0}
            >
              <Gem className="h-4 w-4 mr-1" />
              {purchasing ? '...' : 'Koupit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
