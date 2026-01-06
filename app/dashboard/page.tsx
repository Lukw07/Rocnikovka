import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { StudentOverview } from "@/app/components/dashboard/StudentOverview"
import { TeacherOverview } from "@/app/components/dashboard/TeacherOverview"
import { UserRole } from "@/app/lib/generated/client"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role

  return (
    <div className="space-y-6">
      {role === UserRole.STUDENT && <StudentOverview userId={session.user.id} />}
      {(role === UserRole.TEACHER || role === UserRole.OPERATOR) && (
        <TeacherOverview 
          userId={session.user.id} 
          isOperator={role === UserRole.OPERATOR} 
        />
      )}
    </div>
  )
}
