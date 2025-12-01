import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import AchievementsPanel from "@/app/components/achievements/AchievementsPanel"
import { UserRole } from "@/app/lib/generated"

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const canManage = role === UserRole.TEACHER || role === UserRole.OPERATOR

  return <AchievementsPanel canManage={canManage} />
}
