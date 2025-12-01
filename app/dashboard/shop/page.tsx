import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { ShopInterface } from "@/app/components/shop/ShopInterface"

export default async function ShopPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return <ShopInterface userId={session.user.id} userRole={session.user.role} />
}
