'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ArrowRightLeft } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    rarity: string;
  };
}

interface TradeOffer {
  itemId: string;
  quantity: number;
  name: string;
}

export function CreateTradeDialog({ friends }: { friends: Friend[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [myOffers, setMyOffers] = useState<TradeOffer[]>([]);
  const [myCoins, setMyCoins] = useState(0);
  const [theirCoins, setTheirCoins] = useState(0);

  useEffect(() => {
    if (open) {
      fetchInventory();
    }
  }, [open]);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      
      if (response.ok) {
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Nepodařilo se načíst inventář');
    }
  };

  const addItemOffer = (invItem: InventoryItem) => {
    const existing = myOffers.find(o => o.itemId === invItem.itemId);
    if (existing) {
      if (existing.quantity < invItem.quantity) {
        setMyOffers(prev => 
          prev.map(o => o.itemId === invItem.itemId 
            ? { ...o, quantity: o.quantity + 1 }
            : o
          )
        );
      } else {
        toast.error('Nemáte dostatek tohoto předmětu');
      }
    } else {
      setMyOffers(prev => [...prev, {
        itemId: invItem.itemId,
        quantity: 1,
        name: invItem.item.name
      }]);
    }
  };

  const removeItemOffer = (itemId: string) => {
    setMyOffers(prev => prev.filter(o => o.itemId !== itemId));
  };

  const incrementQuantity = (itemId: string) => {
    const invItem = inventory.find(i => i.itemId === itemId);
    if (!invItem) return;

    setMyOffers(prev => 
      prev.map(o => {
        if (o.itemId === itemId && o.quantity < invItem.quantity) {
          return { ...o, quantity: o.quantity + 1 };
        }
        return o;
      })
    );
  };

  const decrementQuantity = (itemId: string) => {
    setMyOffers(prev => 
      prev.map(o => {
        if (o.itemId === itemId && o.quantity > 1) {
          return { ...o, quantity: o.quantity - 1 };
        }
        return o;
      }).filter(o => o.quantity > 0)
    );
  };

  const handleCreateTrade = async () => {
    if (!selectedFriend) {
      toast.error('Vyberte přítele');
      return;
    }

    if (myOffers.length === 0 && myCoins === 0) {
      toast.error('Přidejte alespoň jeden předmět nebo coiny');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedFriend,
          offeredItems: myOffers.map(o => ({
            itemId: o.itemId,
            quantity: o.quantity
          })),
          offeredCoins: myCoins,
          requestedCoins: theirCoins,
        })
      });

      if (response.ok) {
        toast.success('Obchodní nabídka odeslána!');
        setOpen(false);
        resetForm();
        
        // Refresh the page to show new trade
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Nepodařilo se vytvořit obchod');
      }
    } catch (error) {
      console.error('Error creating trade:', error);
      toast.error('Chyba při vytváření obchodu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFriend('');
    setMyOffers([]);
    setMyCoins(0);
    setTheirCoins(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nový obchod
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vytvořit nový obchod</DialogTitle>
          <DialogDescription>
            Vyberte přítele a nabídněte mu obchod
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Friend */}
          <div className="space-y-2">
            <Label>Obchodovat s:</Label>
            <Select value={selectedFriend} onValueChange={setSelectedFriend}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte přítele" />
              </SelectTrigger>
              <SelectContent>
                {friends.map(friend => (
                  <SelectItem key={friend.id} value={friend.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.avatarUrl ?? undefined} alt={friend.name} />
                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      {friend.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* My Offers */}
            <div className="space-y-4">
              <h3 className="font-semibold">Nabízím:</h3>
              
              {/* My Items */}
              <div className="space-y-2">
                <Label>Moje předměty:</Label>
                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {inventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Žádné předměty v inventáři
                    </p>
                  ) : (
                    inventory.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => addItemOffer(item)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Dostupné: {item.quantity}
                          </p>
                        </div>
                        <Badge variant="outline">{item.item.rarity}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Selected Items */}
              {myOffers.length > 0 && (
                <div className="space-y-2">
                  <Label>Vybrané předměty:</Label>
                  <div className="space-y-2">
                    {myOffers.map(offer => (
                      <div key={offer.itemId} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1 text-sm">{offer.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decrementQuantity(offer.itemId)}
                          >
                            -
                          </Button>
                          <span className="text-sm w-8 text-center">{offer.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => incrementQuantity(offer.itemId)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemOffer(offer.itemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Coins */}
              <div className="space-y-2">
                <Label>Coiny:</Label>
                <Input
                  type="number"
                  min="0"
                  value={myCoins}
                  onChange={(e) => setMyCoins(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
            </div>

            <ArrowRightLeft className="h-8 w-8 self-center justify-self-center text-muted-foreground" />

            {/* Their Side */}
            <div className="space-y-4">
              <h3 className="font-semibold">Požaduji:</h3>
              
              <div className="space-y-2">
                <Label>Coiny:</Label>
                <Input
                  type="number"
                  min="0"
                  value={theirCoins}
                  onChange={(e) => setTheirCoins(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Přítel bude moci:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Přijmout obchod</li>
                  <li>Odmítnout obchod</li>
                  <li>Nabídnout protinávrh</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleCreateTrade} disabled={loading || !selectedFriend}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vytváření...
                </>
              ) : (
                'Vytvořit obchod'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
