import { Metadata } from "next";
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Users } from "lucide-react";
import { FriendsList } from "@/app/components/friends/friends-list";
import { FriendRequests } from "@/app/components/friends/friend-requests";
import { SearchUsers } from "@/app/components/friends/search-users";

export const metadata: Metadata = {
  title: "Přátelé | EduRPG",
  description: "Spravujte své přátele a navazujte nová spojení"
};

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Přátelé</h1>
          <p className="text-muted-foreground">
            Navazujte přátelství a spolupracujte s ostatními hráči
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Moji přátelé</TabsTrigger>
          <TabsTrigger value="requests">Žádosti</TabsTrigger>
          <TabsTrigger value="search">Hledat</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FriendRequests />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <SearchUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
