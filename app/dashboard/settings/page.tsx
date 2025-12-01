import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { SettingsPanel } from "@/app/components/settings/SettingsPanel"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="w-full p-4 md:p-6">
      <SettingsPanel />
    </div>
  )
}
