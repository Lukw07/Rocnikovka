import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@/app/lib/generated"
import { AdminShopPanel } from "@/app/components/admin/shop/AdminShopPanel"

export default async function AdminShopPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <AdminShopPanel />
    </div>
  )
}
