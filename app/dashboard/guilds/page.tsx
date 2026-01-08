import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import { Shield, Plus, Flag } from "lucide-react"
import Link from "next/link"
import { GuildList } from "@/app/components/guilds/guild-list"
import { MyGuildDisplay } from "@/app/components/guilds/my-guild-display"

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
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(148, 108, 67, 0.08), transparent 32%), radial-gradient(circle at 80% 0%, rgba(47, 79, 79, 0.08), transparent 25%), radial-gradient(circle at 50% 80%, rgba(0, 0, 0, 0.05), transparent 30%)"
        }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Guildy</h1>
              <p className="text-muted-foreground">
                Spolupracujte s ostatními hráči, objevujte nové questy a vybojujte si místo mezi elitou.
              </p>
              <div className="flex items-center gap-3 text-sm text-amber-800">
                <span className="rounded-full bg-amber-100 px-3 py-1">🧙‍♂️⚔️🧝‍♀️</span>
                <span>Malá výprava u kulatého stolu čeká na další hrdiny.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild className="shadow-md">
              <Link href="/dashboard/guilds/create">
                <Flag className="mr-2 h-4 w-4" />
                <Plus className="mr-1 h-4 w-4" />
                Vytvořit guildu
              </Link>
            </Button>
          </div>
        </div>
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
          <MyGuildDisplay />
        </TabsContent>
      </Tabs>
    </div>
  )
}
