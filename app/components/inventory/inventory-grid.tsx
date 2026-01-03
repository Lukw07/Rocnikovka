'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Sparkles, ShoppingBag, Zap, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface InventoryItem {
  id: string;
  quantity: number;
  isEquipped: boolean;
  obtainedAt: string;
  item: {
    id: string;
    name: string;
    description: string;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    type: 'COSMETIC' | 'BOOST' | 'COLLECTIBLE';
    imageUrl?: string;
    effects?: any;
  };
}

export default function InventoryGrid() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [grouped, setGrouped] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory);
        setGrouped(data.grouped);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseItem = async (inventoryId: string) => {
    try {
      const res = await fetch('/api/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId }),
      });

      if (res.ok) {
        alert('Item použit!');
        fetchInventory();
        setSelectedItem(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Chyba při použití itemu');
      }
    } catch (error) {
      console.error('Error using item:', error);
    }
  };

  const handleEquipItem = async (inventoryId: string, equip: boolean) => {
    try {
      const res = await fetch('/api/inventory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId, equip }),
      });

      if (res.ok) {
        fetchInventory();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      COMMON: 'bg-gray-100 text-gray-700 border-gray-300',
      UNCOMMON: 'bg-green-100 text-green-700 border-green-300',
      RARE: 'bg-blue-100 text-blue-700 border-blue-300',
      EPIC: 'bg-purple-100 text-purple-700 border-purple-300',
      LEGENDARY: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colors[rarity as keyof typeof colors] || colors.COMMON;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COSMETIC':
        return <Sparkles className="h-4 w-4" />;
      case 'BOOST':
        return <Zap className="h-4 w-4" />;
      case 'COLLECTIBLE':
        return <Star className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const ItemCard = ({ item }: { item: InventoryItem }) => (
    <div
      className={`relative p-4 border-2 rounded-lg cursor-pointer transition hover:shadow-lg ${getRarityColor(item.item.rarity)}`}
      onClick={() => setSelectedItem(item)}
    >
      {item.isEquipped && (
        <Badge className="absolute top-2 right-2 bg-green-500">Nasazeno</Badge>
      )}
      
      <div className="flex flex-col items-center text-center">
        {item.item.imageUrl ? (
          <img src={item.item.imageUrl} alt={item.item.name} className="h-16 w-16 object-contain mb-2" />
        ) : (
          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center mb-2">
            {getTypeIcon(item.item.type)}
          </div>
        )}
        
        <h4 className="font-bold text-sm">{item.item.name}</h4>
        {item.quantity > 1 && (
          <Badge variant="secondary" className="mt-1">x{item.quantity}</Badge>
        )}
        <Badge variant="outline" className="mt-1 text-xs">
          {item.item.rarity}
        </Badge>
      </div>
    </div>
  );

  if (loading) {
    return <Card><CardContent className="p-8 text-center">Načítání inventáře...</CardContent></Card>;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Inventář
          </CardTitle>
          <CardDescription>
            Celkem {inventory.length} předmětů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Vše ({inventory.length})</TabsTrigger>
              <TabsTrigger value="cosmetic">Cosmetic ({grouped.cosmetic?.length || 0})</TabsTrigger>
              <TabsTrigger value="boost">Boost ({grouped.boost?.length || 0})</TabsTrigger>
              <TabsTrigger value="collectible">Sběratelské ({grouped.collectible?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {inventory.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cosmetic">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {grouped.cosmetic?.map((item: InventoryItem) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="boost">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {grouped.boost?.map((item: InventoryItem) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="collectible">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {grouped.collectible?.map((item: InventoryItem) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>{selectedItem.item.name}</CardTitle>
              <CardDescription>{selectedItem.item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getRarityColor(selectedItem.item.rarity)}>
                  {selectedItem.item.rarity}
                </Badge>
                <Badge variant="outline">{selectedItem.item.type}</Badge>
                {selectedItem.quantity > 1 && (
                  <Badge variant="secondary">x{selectedItem.quantity}</Badge>
                )}
              </div>

              {selectedItem.item.effects && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm font-medium mb-1">Efekty:</p>
                  <pre className="text-xs">{JSON.stringify(selectedItem.item.effects, null, 2)}</pre>
                </div>
              )}

              <div className="flex gap-2">
                {selectedItem.item.type === 'COSMETIC' && (
                  <Button
                    className="flex-1"
                    onClick={() => handleEquipItem(selectedItem.id, !selectedItem.isEquipped)}
                  >
                    {selectedItem.isEquipped ? 'Sundat' : 'Nasadit'}
                  </Button>
                )}
                
                {(selectedItem.item.type === 'BOOST' || selectedItem.item.type === 'COLLECTIBLE') && (
                  <Button
                    className="flex-1"
                    onClick={() => handleUseItem(selectedItem.id)}
                  >
                    Použít
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                >
                  Zavřít
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
