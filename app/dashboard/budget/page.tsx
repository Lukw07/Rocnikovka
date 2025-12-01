import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated"
import { BudgetPanel } from "@/app/components/dashboard/budget/BudgetPanel"

export default async function BudgetPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== UserRole.TEACHER) {
    redirect("/dashboard")
  }

  return (
    <div className="w-full p-4 md:p-6">
      <BudgetPanel />
    </div>
  )
}
