'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Package, Tag, X, TrendingUp } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  type: string;
  price: number;
  isTradeable: boolean;
}

interface InventoryItem {
  id: string;
  quantity: number;
  isEquipped: boolean;
  obtainedAt: string;
  item: Item;
}

interface MyListing {
  id: string;
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

export function SellItemDialog() {
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [gemPrice, setGemPrice] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInventory();
    }
  }, [open]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      const data = await response.json();

      if (response.ok) {
        // Pouze tradeable items
        const tradeable = data.inventory.filter((i: InventoryItem) => 
          i.item.isTradeable && i.quantity > 0
        );
        setInventory(tradeable);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Chyba při načítání inventáře');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedItem) return;

    if (quantity <= 0 || pricePerUnit <= 0) {
      toast.error('Množství a cena musí být větší než 0');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.item.id,
          quantity,
          pricePerUnit,
          gemPrice,
          title,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Nabídka vytvořena!');
        setOpen(false);
        resetForm();
      } else {
        toast.error(data.error || 'Vytvoření nabídky selhalo');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Chyba při vytváření nabídky');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity(1);
    setPricePerUnit(0);
    setGemPrice(0);
    setTitle('');
    setDescription('');
  };

  const suggestedPrice = selectedItem?.item.price || 0;
  const totalValue = pricePerUnit * quantity;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Tag className="mr-2 h-4 w-4" />
        Prodat item
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vytvořit marketplace nabídku</DialogTitle>
            <DialogDescription>
              Prodej své itemy ostatním hráčům
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Item Selection */}
            {!selectedItem ? (
              <div>
                <Label>Vyber item k prodeji</Label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : inventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Nemáš žádné tradeable itemy
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {inventory.map((invItem) => (
                      <Card
                        key={invItem.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          setSelectedItem(invItem);
                          setPricePerUnit(Math.round(invItem.item.price * 0.8)); // 80% base price
                          setTitle(invItem.item.name);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{invItem.item.name}</p>
                              <Badge className={`${rarityColors[invItem.item.rarity]} text-xs mt-1`}>
                                {invItem.item.rarity}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Vlastníš</p>
                              <p className="font-bold">{invItem.quantity}x</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Item */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedItem.item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Vlastníš: {selectedItem.quantity}x
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quantity */}
                <div>
                  <Label htmlFor="quantity">Množství</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selectedItem.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.quantity))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {selectedItem.quantity}
                  </p>
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerUnit">Cena za kus (Gold) 💰</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      min={1}
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Doporučená: {suggestedPrice}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="gemPrice">Alternativní cena (Gems) 💎</Label>
                    <Input
                      id="gemPrice"
                      type="number"
                      min={0}
                      value={gemPrice}
                      onChange={(e) => setGemPrice(parseInt(e.target.value) || 0)}
                      placeholder="Volitelné"
                    />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <Label htmlFor="title">Název nabídky</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Např. 'Legendární meč - super stav!'"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Popis (volitelné)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Přidej popis, proč je tento item skvělý..."
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Celková hodnota:</span>
                        <span className="font-bold text-lg">{totalValue} 💰</span>
                      </div>
                      {gemPrice > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Nebo v gems:</span>
                          <span className="font-bold">{gemPrice * quantity} 💎</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vytvářím...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Vytvořit nabídku
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Zrušit
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MyListingsView() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace?type=sent'); // TODO: add seller filter
      // For now, we'll need to implement a separate endpoint or filter
      const data = await response.json();
      
      if (response.ok) {
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching my listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (listingId: string) => {
    try {
      const response = await fetch(`/api/marketplace/${listingId}/cancel`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Nabídka zrušena');
        fetchMyListings();
      } else {
        toast.error('Zrušení selhalo');
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      toast.error('Chyba při rušení nabídky');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Moje nabídky</h3>
        <SellItemDialog />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Zatím nemáš žádné aktivní nabídky</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{listing.item.name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>{listing.quantity}x</span>
                      <span className="font-bold">{listing.pricePerUnit} 💰/kus</span>
                      <span className="text-muted-foreground">{listing.views} zobrazení</span>
                      <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {listing.status}
                      </Badge>
                    </div>
                  </div>
                  {listing.status === 'ACTIVE' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(listing.id)}
                    >
                      Zrušit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
