import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import { Shield, Plus } from "lucide-react"
import Link from "next/link"
import { GuildList } from "@/app/components/guilds/guild-list"

export const metadata: Metadata = {
  title: "Guildy | EduRPG",
  description: "Připojte se k guildě nebo založte vlastní"
}

export default async function GuildsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Guildy</h1>
            <p className="text-muted-foreground">
              Spolupracujte s ostatními hráči a plňte společné cíle
            </p>
          </div>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/guilds/create">
            <Plus className="mr-2 h-4 w-4" />
            Vytvořit guildu
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Všechny guildy</TabsTrigger>
          <TabsTrigger value="my">Moje guilda</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <GuildList />
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            Implementace "Moje guilda" - zobrazí guildu, ve které je hráč členem
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
