import { Metadata } from "next"
import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { PersonalSpaceEditor } from "@/app/components/personal-space/personal-space-editor"
import { Home } from "lucide-react"

export const metadata: Metadata = {
  title: "Personal Space | EduRPG",
  description: "Upravte si svůj osobní prostor"
}

export default async function PersonalSpacePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Personal Space</h1>
          <p className="text-muted-foreground">Upravte si svůj virtuální prostor a nábytek</p>
        </div>
      </div>

      <PersonalSpaceEditor />
    </div>
  )
}
