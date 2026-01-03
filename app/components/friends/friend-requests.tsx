'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest
} from '@/app/actions/friends';
import { toast } from 'sonner';
import { UserPlus, UserX, X, Loader2, Inbox } from 'lucide-react';

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    grade: number | null;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    grade: number | null;
  };
}

export function FriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    
    const [receivedResult, sentResult] = await Promise.all([
      getFriendRequests('received'),
      getFriendRequests('sent')
    ]);
    
    if (receivedResult.success && receivedResult.requests) {
      const receivedRequests = receivedResult.requests.map(req => ({
        ...req,
        createdAt: typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toISOString()
      }));
      setReceivedRequests(receivedRequests as FriendRequest[]);
    }
    
    if (sentResult.success && sentResult.requests) {
      const sentRequests = sentResult.requests.map(req => ({
        ...req,
        createdAt: typeof req.createdAt === 'string' ? req.createdAt : new Date(req.createdAt).toISOString()
      }));
      setSentRequests(sentRequests as FriendRequest[]);
    }
    
    setLoading(false);
  }

  async function handleAccept(requestId: string) {
    setProcessingId(requestId);
    
    const result = await acceptFriendRequest(requestId);
    
    if (result.success) {
      toast.success('Žádost přijata! Máte nového přítele.');
      setReceivedRequests(receivedRequests.filter(r => r.id !== requestId));
    } else {
      toast.error(result.error || 'Nepodařilo se přijmout žádost');
    }
    
    setProcessingId(null);
  }

  async function handleDecline(requestId: string) {
    setProcessingId(requestId);
    
    const result = await declineFriendRequest(requestId);
    
    if (result.success) {
      toast.success('Žádost byla odmítnuta');
      setReceivedRequests(receivedRequests.filter(r => r.id !== requestId));
    } else {
      toast.error(result.error || 'Nepodařilo se odmítnout žádost');
    }
    
    setProcessingId(null);
  }

  async function handleCancel(requestId: string) {
    setProcessingId(requestId);
    
    const result = await cancelFriendRequest(requestId);
    
    if (result.success) {
      toast.success('Žádost byla zrušena');
      setSentRequests(sentRequests.filter(r => r.id !== requestId));
    } else {
      toast.error(result.error || 'Nepodařilo se zrušit žádost');
    }
    
    setProcessingId(null);
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

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="received">
          Přijaté ({receivedRequests.length})
        </TabsTrigger>
        <TabsTrigger value="sent">
          Odeslané ({sentRequests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-4 mt-4">
        {receivedRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Žádné nové žádosti</h3>
              <p className="text-muted-foreground">
                Momentálně nemáte žádné čekající žádosti o přátelství
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {receivedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.sender.avatarUrl || undefined} alt={request.sender.name} />
                        <AvatarFallback>
                          {request.sender.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{request.sender.name}</CardTitle>
                        <CardDescription>
                          {request.sender.role === 'STUDENT' ? 'Student' : 'Učitel'}
                          {request.sender.grade && ` • ${request.sender.grade}. ročník`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(request.createdAt).toLocaleDateString('cs-CZ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                {request.message && (
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground italic">
                      "{request.message}"
                    </p>
                  </CardContent>
                )}
                
                <CardContent className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Přijmout
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDecline(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4" />
                    )}
                    Odmítnout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-4 mt-4">
        {sentRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Žádné odeslané žádosti</h3>
              <p className="text-muted-foreground">
                Momentálně nemáte žádné čekající odeslané žádosti
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sentRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.receiver.avatarUrl || undefined} alt={request.receiver.name} />
                        <AvatarFallback>
                          {request.receiver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{request.receiver.name}</CardTitle>
                        <CardDescription>
                          {request.receiver.role === 'STUDENT' ? 'Student' : 'Učitel'}
                          {request.receiver.grade && ` • ${request.receiver.grade}. ročník`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(request.createdAt).toLocaleDateString('cs-CZ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                {request.message && (
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground italic">
                      "{request.message}"
                    </p>
                  </CardContent>
                )}
                
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCancel(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ruším...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Zrušit žádost
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
