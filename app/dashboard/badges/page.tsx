import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { UserRole } from "@/app/lib/generated/client"
import BadgesPanel from "@/app/components/badges/BadgesPanel"

export default async function BadgesPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const isOperator = role === UserRole.OPERATOR

  return <BadgesPanel isOperator={isOperator} />
}
