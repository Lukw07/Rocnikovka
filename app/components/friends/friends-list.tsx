'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { getFriends, removeFriend } from '@/app/actions/friends';
import { toast } from 'sonner';
import { Users, UserMinus, Trophy, Loader2, Calendar, ArrowRightLeft } from 'lucide-react';
import { CreateTradeDialog } from './create-trade-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  grade: number | null;
  totalXP: number;
  friendshipId: string;
  friendSince: string;
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    setLoading(true);
    const result = await getFriends();
    
    if (result.success && result.friends) {
      setFriends(result.friends);
    } else {
      toast.error('Nepodařilo se načíst přátele');
    }
    
    setLoading(false);
  }

  async function handleRemoveFriend() {
    if (!friendToRemove) return;

    setRemovingId(friendToRemove.friendshipId);
    
    const result = await removeFriend(friendToRemove.friendshipId);
    
    if (result.success) {
      toast.success('Přítel byl odebrán');
      setFriends(friends.filter(f => f.friendshipId !== friendToRemove.friendshipId));
    } else {
      toast.error(result.error || 'Nepodařilo se odebrat přítele');
    }
    
    setRemovingId(null);
    setFriendToRemove(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Zatím nemáte žádné přátele</h3>
          <p className="text-muted-foreground">
            Začněte vyhledáváním jiných hráčů a posílejte jim žádosti o přátelství!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Máte {friends.length} {friends.length === 1 ? 'přítele' : friends.length < 5 ? 'přátele' : 'přátel'}
        </p>
        <CreateTradeDialog friends={friends} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => (
          <Card key={friend.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatarUrl || undefined} alt={friend.name} />
                    <AvatarFallback>
                      {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{friend.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {friend.role === 'STUDENT' ? 'Student' : 'Učitel'}
                      {friend.grade && ` • ${friend.grade}. ročník`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{friend.totalXP.toLocaleString()} XP</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Přátelé od {new Date(friend.friendSince).toLocaleDateString('cs-CZ')}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setFriendToRemove(friend)}
                disabled={removingId === friend.friendshipId}
              >
                {removingId === friend.friendshipId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Odebírám...
                  </>
                ) : (
                  <>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Odebrat přítele
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete odebrat přítele?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce odstraní {friendToRemove?.name} ze seznamu vašich přátel. 
              Budete moci poslat novou žádost o přátelství později.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend}>
              Ano, odebrat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
