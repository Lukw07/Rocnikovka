import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import LogPanel from "@/app/components/log/LogPanel"

export default async function LogPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== UserRole.STUDENT) {
    redirect("/dashboard")
  }

  return (
    <div className="w-full p-4 md:p-6">
      <LogPanel />
    </div>
  )
}
