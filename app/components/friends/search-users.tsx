'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { searchUsers, sendFriendRequest, cancelFriendRequest, acceptFriendRequest } from '@/app/actions/friends';
import { toast } from 'sonner';
import { Search, UserPlus, Loader2, Trophy, Check, X, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from '@/app/components/ui/label';

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  grade: number | null;
  totalXP: number;
  relationshipStatus: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  friendshipId?: string;
  requestId?: string;
}

export function SearchUsers() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (query.length < 2) {
      toast.error('Zadejte alespoň 2 znaky');
      return;
    }

    setLoading(true);
    
    const result = await searchUsers(query);
    
    if (result.success && result.users) {
      setUsers(result.users);
      if (result.users.length === 0) {
        toast.info('Žádní uživatelé nenalezeni');
      }
    } else {
      toast.error(result.error || 'Nepodařilo se vyhledat uživatele');
    }
    
    setLoading(false);
  }

  async function handleSendRequest(user: SearchedUser) {
    setSelectedUser(user);
    setMessage('');
    setShowDialog(true);
  }

  async function confirmSendRequest() {
    if (!selectedUser) return;

    setProcessingId(selectedUser.id);
    setShowDialog(false);
    
    const result = await sendFriendRequest(selectedUser.id, message || undefined);
    
    if (result.success) {
      if (result.autoAccepted) {
        toast.success('Žádost přijata! Jste nyní přátelé.');
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, relationshipStatus: 'FRIENDS' as const } 
            : u
        ));
      } else {
        toast.success('Žádost o přátelství byla odeslána');
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, relationshipStatus: 'REQUEST_SENT' as const } 
            : u
        ));
      }
    } else {
      toast.error(result.error || 'Nepodařilo se odeslat žádost');
    }
    
    setProcessingId(null);
    setSelectedUser(null);
  }

  async function handleCancelRequest(userId: string, requestId: string) {
    setProcessingId(userId);
    
    const result = await cancelFriendRequest(requestId);
    
    if (result.success) {
      toast.success('Žádost byla zrušena');
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, relationshipStatus: 'NONE' as const, requestId: undefined } 
          : u
      ));
    } else {
      toast.error(result.error || 'Nepodařilo se zrušit žádost');
    }
    
    setProcessingId(null);
  }

  async function handleAcceptRequest(userId: string, requestId: string) {
    setProcessingId(userId);
    
    const result = await acceptFriendRequest(requestId);
    
    if (result.success) {
      toast.success('Žádost přijata! Máte nového přítele.');
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, relationshipStatus: 'FRIENDS' as const, requestId: undefined } 
          : u
      ));
    } else {
      toast.error(result.error || 'Nepodařilo se přijmout žádost');
    }
    
    setProcessingId(null);
  }

  function getActionButton(user: SearchedUser) {
    const isProcessing = processingId === user.id;

    switch (user.relationshipStatus) {
      case 'FRIENDS':
        return (
          <Button variant="outline" disabled>
            <Check className="mr-2 h-4 w-4" />
            Přátelé
          </Button>
        );
      
      case 'REQUEST_SENT':
        return (
          <Button
            variant="outline"
            onClick={() => handleCancelRequest(user.id, user.requestId!)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Clock className="mr-2 h-4 w-4" />
            )}
            Žádost odeslána
          </Button>
        );
      
      case 'REQUEST_RECEIVED':
        return (
          <Button
            onClick={() => handleAcceptRequest(user.id, user.requestId!)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Přijmout žádost
          </Button>
        );
      
      case 'NONE':
      default:
        return (
          <Button
            onClick={() => handleSendRequest(user)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Poslat žádost
          </Button>
        );
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Vyhledat hráče</CardTitle>
          <CardDescription>
            Zadejte jméno nebo email uživatele, kterého chcete přidat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Zadejte jméno nebo email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {users.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{user.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {user.role === 'STUDENT' ? 'Student' : 'Učitel'}
                      {user.grade && ` • ${user.grade}. ročník`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{user.totalXP.toLocaleString()} XP</span>
                </div>

                {getActionButton(user)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poslat žádost o přátelství</DialogTitle>
            <DialogDescription>
              Posíláte žádost uživateli {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Zpráva (volitelné)</Label>
              <Textarea
                id="message"
                placeholder="Ahoj! Chtěl bych se s tebou spřátelit..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Zrušit
            </Button>
            <Button onClick={confirmSendRequest}>
              Odeslat žádost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
