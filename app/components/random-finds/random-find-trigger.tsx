'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Sparkles, Clock, Gift } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

interface FindResult {
  find: any;
  item?: any;
  rewards: {
    gold: number;
    gems: number;
  };
  rarity: string;
}

export default function RandomFindTrigger() {
  const [canFind, setCanFind] = useState(false);
  const [findsToday, setFindsToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [nextAvailable, setNextAvailable] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [finding, setFinding] = useState(false);
  const [result, setResult] = useState<FindResult | null>(null);

  useEffect(() => {
    checkCooldown();
    const interval = setInterval(checkCooldown, 10000); // Každých 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!nextAvailable) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextAvailable.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Dostupné!');
        checkCooldown();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextAvailable]);

  const checkCooldown = async () => {
    try {
      const res = await fetch('/api/random-finds/check');
      if (res.ok) {
        const data = await res.json();
        setCanFind(data.canFind);
        setFindsToday(data.findsToday);
        setDailyLimit(data.dailyLimit);
        if (data.nextAvailableAt) {
          setNextAvailable(new Date(data.nextAvailableAt));
        } else {
          setNextAvailable(null);
        }
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const triggerFind = async () => {
    if (!canFind) return;

    try {
      setFinding(true);
      const res = await fetch('/api/random-finds/trigger', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        checkCooldown();
        
        // Auto-close po 5 sekundách
        setTimeout(() => setResult(null), 5000);
      } else {
        const error = await res.json();
        alert(error.error || 'Chyba při hledání');
      }
    } catch (error) {
      console.error('Error triggering find:', error);
    } finally {
      setFinding(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'from-gray-400 to-gray-600',
      UNCOMMON: 'from-green-400 to-green-600',
      RARE: 'from-blue-400 to-blue-600',
      EPIC: 'from-purple-400 to-purple-600',
      LEGENDARY: 'from-yellow-400 to-yellow-600',
    };
    return colors[rarity] || colors.COMMON;
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={triggerFind}
          disabled={!canFind || finding}
          size="lg"
          className={`rounded-full h-16 w-16 shadow-lg transition-all ${
            canFind ? 'animate-pulse bg-linear-to-r from-yellow-500 to-orange-500 hover:scale-110' : ''
          }`}
        >
          {finding ? (
            <div className="animate-spin">⏳</div>
          ) : (
            <Sparkles className="h-8 w-8" />
          )}
        </Button>

        {/* Info badge */}
        <div className="absolute -top-2 -left-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow">
          <Badge variant={canFind ? 'default' : 'secondary'} className="text-xs">
            {findsToday}/{dailyLimit}
          </Badge>
        </div>

        {/* Cooldown timer */}
        {!canFind && timeLeft && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft}
            </Badge>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in">
          <div className={`relative p-8 rounded-2xl bg-linear-to-br ${getRarityColor(result.rarity)} text-white shadow-2xl animate-in zoom-in`}>
            <div className="text-center space-y-4">
              <div className="animate-bounce">
                <Gift className="h-20 w-20 mx-auto" />
              </div>
              
              <h2 className="text-3xl font-bold">✨ Náhodný nález!</h2>
              
              {result.item ? (
                <>
                  <Badge className="text-lg px-4 py-2">{result.rarity}</Badge>
                  <p className="text-2xl font-bold">{result.item.name}</p>
                  <p className="text-sm opacity-90">{result.item.description}</p>
                </>
              ) : (
                <div className="space-y-2">
                  {result.rewards.gold > 0 && (
                    <p className="text-2xl font-bold">
                      💰 +{result.rewards.gold} Gold
                    </p>
                  )}
                  {result.rewards.gems > 0 && (
                    <p className="text-2xl font-bold">
                      💎 +{result.rewards.gems} Gems
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => setResult(null)}
                className="mt-4"
              >
                Zavřít
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
