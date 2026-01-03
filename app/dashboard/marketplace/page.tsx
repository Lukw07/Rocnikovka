import { Metadata } from "next";
import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Store } from "lucide-react";
import { MarketplaceView } from "@/app/components/marketplace/MarketplaceView";
import { SellItem } from "@/app/components/marketplace/SellItem";
import { MarketStats } from "@/app/components/marketplace/MarketStats";

export const metadata: Metadata = {
  title: "Marketplace | EduRPG",
  description: "Obchodujte s předměty na trhu"
};

export default async function MarketplacePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Nakupujte a prodávejte předměty s ostatními hráči
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Procházet</TabsTrigger>
          <TabsTrigger value="sell">Prodávat</TabsTrigger>
          <TabsTrigger value="stats">Statistiky</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <MarketplaceView />
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <SellItem />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <MarketStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
