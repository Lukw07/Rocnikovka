/**
 * Friend Quests Page
 * Stránka pro zobrazení a správu Friend Questů
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { FriendQuestCard } from "@/app/components/gamification/friend-quest-card";
import { 
  Users, 
  Search, 
  Trophy,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function FriendQuestsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"available" | "active" | "completed">("active");
  
  // Friends list
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendSearch, setFriendSearch] = useState("");

  // Quests
  const [availableQuests, setAvailableQuests] = useState<any[]>([]);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [completedQuests, setCompletedQuests] = useState<any[]>([]);

  // Loading states
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
    loadActiveQuests();
  }, []);

  // Load available quests when friend is selected
  useEffect(() => {
    if (selectedFriend && activeTab === "available") {
      loadAvailableQuests();
    }
  }, [selectedFriend, activeTab]);

  // Load completed quests when tab is selected
  useEffect(() => {
    if (activeTab === "completed") {
      loadCompletedQuests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const response = await fetch("/api/friends");
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
      toast.error("Nepodařilo se načíst seznam přátel");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadAvailableQuests = async () => {
    if (!selectedFriend) return;

    try {
      setIsLoadingQuests(true);
      const response = await fetch(
        `/api/friend-quests?mode=available&friendId=${selectedFriend}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailableQuests(data.quests || []);
      } else {
        toast.error(data.error || "Nepodařilo se načíst dostupné questy");
      }
    } catch (error) {
      console.error("Failed to load available quests:", error);
      toast.error("Chyba při načítání questů");
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const loadActiveQuests = async () => {
    try {
      setIsLoadingQuests(true);
      const response = await fetch("/api/friend-quests?mode=active");
      const data = await response.json();

      if (data.success) {
        setActiveQuests(data.progresses || []);
      }
    } catch (error) {
      console.error("Failed to load active quests:", error);
      toast.error("Chyba při načítání aktivních questů");
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const loadCompletedQuests = async () => {
    try {
      setIsLoadingQuests(true);
      const response = await fetch("/api/friend-quests?mode=completed&limit=20");
      const data = await response.json();

      if (data.success) {
        setCompletedQuests(data.completions || []);
      }
    } catch (error) {
      console.error("Failed to load completed quests:", error);
      toast.error("Chyba při načítání dokončených questů");
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const handleAcceptQuest = async (questId: string) => {
    if (!selectedFriend) return;

    try {
      const response = await fetch("/api/friend-quests/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendQuestId: questId,
          friendId: selectedFriend
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Quest byl úspěšně přijat!");
        loadAvailableQuests();
        loadActiveQuests();
      } else {
        toast.error(data.error || "Nepodařilo se přijmout quest");
      }
    } catch (error) {
      console.error("Failed to accept quest:", error);
      toast.error("Chyba při přijímání questu");
    }
  };

  const handleUpdateProgress = async (progressId: string, delta: number) => {
    try {
      const response = await fetch(`/api/friend-quests/progress/${progressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressDelta: delta })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Progress aktualizován (+${delta}%)`);
        loadActiveQuests();
      } else {
        toast.error(data.error || "Nepodařilo se aktualizovat progress");
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("Chyba při aktualizaci progressu");
    }
  };

  const handleCompleteQuest = async (progressId: string) => {
    try {
      const response = await fetch(`/api/friend-quests/complete/${progressId}`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        toast.success("🎉 Quest dokončen! Odměny byly přidány!");
        loadActiveQuests();
        loadCompletedQuests();
      } else {
        toast.error(data.error || "Nepodařilo se dokončit quest");
      }
    } catch (error) {
      console.error("Failed to complete quest:", error);
      toast.error("Chyba při dokončování questu");
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.friend.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    friend.friend.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Friend Questy</h1>
        </div>
        <p className="text-muted-foreground">
          Spolupracujte s přáteli na speciálních questech a získejte společné odměny!
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">
            <Search className="w-4 h-4 mr-2" />
            Dostupné questy
          </TabsTrigger>
          <TabsTrigger value="active">
            <Trophy className="w-4 h-4 mr-2" />
            Aktivní ({activeQuests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Dokončené
          </TabsTrigger>
        </TabsList>

        {/* AVAILABLE QUESTS */}
        <TabsContent value="available" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Friends Sidebar */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Vyber přítele</CardTitle>
                <CardDescription>
                  S kým chceš splnit quest?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Hledat přítele..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="mb-3"
                />

                {isLoadingFriends ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Žádní přátelé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friendship) => (
                      <Button
                        key={friendship.id}
                        variant={selectedFriend === friendship.friend.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedFriend(friendship.friend.id)}
                      >
                        {friendship.friend.avatarUrl ? (
                          <img 
                            src={friendship.friend.avatarUrl} 
                            alt={friendship.friend.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            {friendship.friend.name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{friendship.friend.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Quests */}
            <div className="md:col-span-2 space-y-4">
              {!selectedFriend ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Vyber přítele, aby se zobrazily dostupné Friend Questy
                    </p>
                  </CardContent>
                </Card>
              ) : isLoadingQuests ? (
                <Card>
                  <CardContent className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : availableQuests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-center">
                      Žádné dostupné Friend Questy s tímto přítelem
                    </p>
                  </CardContent>
                </Card>
              ) : (
                availableQuests.map((quest) => (
                  <FriendQuestCard
                    key={quest.id}
                    quest={quest}
                    mode="available"
                    currentUserId={session?.user?.id}
                    onAccept={handleAcceptQuest}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* ACTIVE QUESTS */}
        <TabsContent value="active" className="space-y-4">
          {isLoadingQuests ? (
            <Card>
              <CardContent className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : activeQuests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-center mb-4">
                  Žádné aktivní Friend Questy
                </p>
                <Button onClick={() => setActiveTab("available")}>
                  Prozkoumat dostupné questy
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeQuests.map((progress) => (
              <FriendQuestCard
                key={progress.id}
                quest={progress.friendQuest}
                progress={progress}
                mode="active"
                currentUserId={session?.user?.id}
                onUpdateProgress={handleUpdateProgress}
                onComplete={handleCompleteQuest}
              />
            ))
          )}
        </TabsContent>

        {/* COMPLETED QUESTS */}
        <TabsContent value="completed" className="space-y-4">
          {isLoadingQuests ? (
            <Card>
              <CardContent className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : completedQuests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-center">
                  Zatím žádné dokončené Friend Questy
                </p>
              </CardContent>
            </Card>
          ) : (
            completedQuests.map((completion) => (
              <FriendQuestCard
                key={completion.id}
                quest={completion.friendQuest}
                mode="completed"
                currentUserId={session?.user?.id}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
