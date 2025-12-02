import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@/app/lib/generated"
import JobListPanel from "@/app/components/job-list/JobListPanel"
import { TeacherJobListPanel } from "@/app/components/dashboard/TeacherJobListPanel"

export default async function JobListPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role

  if (role === UserRole.TEACHER || role === UserRole.OPERATOR) {
    return (
      <div className="w-full p-4 md:p-6">
        <TeacherJobListPanel />
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6">
      <JobListPanel />
    </div>
  )
}
