import { Metadata } from 'next';
import { WalletCard } from '@/app/components/wallet';
import { InventoryGrid } from '@/app/components/inventory';
import { BlackMarketShop } from '@/app/components/blackmarket';
import { RandomFindTrigger } from '@/app/components/random-finds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Economy - EduRPG',
  description: 'Správa peněz, itemů, tradingu a blackmarketu',
};

export default function EconomyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Random Find Trigger - floating button */}
      <RandomFindTrigger />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">💰 Economy System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Spravuj svoje peníze, itemy a obchoduj s ostatními hráči
        </p>
      </div>

      {/* Wallet Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard />
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventory">🎒 Inventář</TabsTrigger>
              <TabsTrigger value="blackmarket">🎭 Black Market</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-4">
              <InventoryGrid />
            </TabsContent>

            <TabsContent value="blackmarket" className="mt-4">
              <BlackMarketShop />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          label="Celkový gold získaný"
          value="15,420"
          trend="+12%"
        />
        <StatCard
          icon="🎒"
          label="Items v inventáři"
          value="42"
          trend="+5"
        />
        <StatCard
          icon="🔄"
          label="Aktivní trades"
          value="3"
          trend="2 pending"
        />
        <StatCard
          icon="🎭"
          label="Blackmarket purchases"
          value="8"
          trend="2 tento týden"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: string;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{trend}</p>
      </div>
    </div>
  );
}
