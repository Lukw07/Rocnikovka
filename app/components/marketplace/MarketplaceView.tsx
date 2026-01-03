'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Search, TrendingUp, ShoppingCart, Tag, Eye } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  type: 'COSMETIC' | 'BOOST' | 'COLLECTIBLE';
}

interface MarketplaceListing {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  gemPrice: number;
  status: string;
  views: number;
  createdAt: string;
  item: Item;
}

const rarityColors = {
  COMMON: 'bg-gray-500',
  UNCOMMON: 'bg-green-500',
  RARE: 'bg-blue-500',
  EPIC: 'bg-purple-500',
  LEGENDARY: 'bg-yellow-500',
};

const rarityIcons = {
  COMMON: '⚪',
  UNCOMMON: '🟢',
  RARE: '🔵',
  EPIC: '🟣',
  LEGENDARY: '🟡',
};

export function MarketplaceView() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [useGems, setUseGems] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [selectedRarity, sortBy]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
      });

      if (selectedRarity !== 'all') {
        params.append('rarity', selectedRarity);
      }

      const response = await fetch(`/api/marketplace?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setListings(data.listings);
      } else {
        toast.error('Nepodařilo se načíst marketplace');
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast.error('Chyba při načítání marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedListing) return;

    try {
      setBuying(true);
      const response = await fetch(`/api/marketplace/${selectedListing.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, useGems }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ Úspěšně jsi koupil ${quantity}x ${selectedListing.item.name}!`);
        
        // Trigger stats update
        fetch('/api/progression/stats').catch(() => {});
        
        setBuyDialogOpen(false);
        fetchListings();
        
        // Reload after short delay to update inventory
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || 'Nákup selhal');
      }
    } catch (error) {
      console.error('Error buying item:', error);
      toast.error('Chyba při nákupu');
    } finally {
      setBuying(false);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPrice = selectedListing 
    ? (useGems ? selectedListing.gemPrice : selectedListing.pricePerUnit) * quantity
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">🏪 Marketplace</h2>
          <p className="text-muted-foreground">Nakupuj a prodávej itemy s ostatními hráči</p>
        </div>
        <Button onClick={fetchListings} variant="outline">
          Obnovit
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat itemy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedRarity} onValueChange={setSelectedRarity}>
              <SelectTrigger>
                <SelectValue placeholder="Rarita" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny rarity</SelectItem>
                <SelectItem value="COMMON">⚪ Common</SelectItem>
                <SelectItem value="UNCOMMON">🟢 Uncommon</SelectItem>
                <SelectItem value="RARE">🔵 Rare</SelectItem>
                <SelectItem value="EPIC">🟣 Epic</SelectItem>
                <SelectItem value="LEGENDARY">🟡 Legendary</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Řadit podle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Nejnovější</SelectItem>
                <SelectItem value="price">Nejlevnější</SelectItem>
                <SelectItem value="popular">Nejpopulárnější</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Žádné itemy k dispozici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {rarityIcons[listing.item.rarity]}
                      {listing.item.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {listing.item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={rarityColors[listing.item.rarity]}>
                    {listing.item.rarity}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {listing.views}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cena:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {listing.pricePerUnit} 💰
                      </span>
                      {listing.gemPrice > 0 && (
                        <span className="text-sm text-muted-foreground">
                          nebo {listing.gemPrice} 💎
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dostupné:</span>
                    <span className="font-semibold">{listing.quantity}x</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedListing(listing);
                    setQuantity(1);
                    setUseGems(false);
                    setBuyDialogOpen(true);
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Koupit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Koupit {selectedListing?.item.name}</DialogTitle>
            <DialogDescription>
              Vyber množství a způsob platby
            </DialogDescription>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Množství</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedListing.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedListing.quantity))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {selectedListing.quantity}
                </p>
              </div>

              {selectedListing.gemPrice > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useGems"
                    checked={useGems}
                    onChange={(e) => setUseGems(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="useGems" className="text-sm">
                    Zaplatit gems místo gold
                  </label>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Celková cena:</span>
                  <span>
                    {totalPrice} {useGems ? '💎' : '💰'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBuy}
                  disabled={buying}
                  className="flex-1"
                >
                  {buying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Nakupuji...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Koupit
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
                  Zrušit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
