import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { UsersPanel } from "@/app/components/dashboard/users/UsersPanel"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== UserRole.OPERATOR) {
    redirect("/dashboard")
  }

  return (
    <div className="w-full p-4 md:p-6">
      <UsersPanel />
    </div>
  )
}
