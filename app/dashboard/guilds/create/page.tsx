import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { CreateGuildForm } from "@/app/components/guilds/create-guild-form"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Vytvořit guildu | EduRPG",
  description: "Založte novou guildu"
}

export default async function CreateGuildPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/guilds">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na guildy
        </Link>
      </Button>

      <CreateGuildForm />
    </div>
  )
}
