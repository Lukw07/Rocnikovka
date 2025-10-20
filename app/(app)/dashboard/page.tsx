import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/lib/auth"
import { StudentDashboardModern } from "@/app/components/dashboard/StudentDashboardModern"
import V2SidebarLayout from "@/app/components/ui/V2sidebar"
import { TeacherDashboard } from "@/app/components/dashboard/TeacherDashboard"
import { OperatorDashboard } from "@/app/components/dashboard/OperatorDashboard"
import { UserRole } from "@/app/lib/generated"
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader"
import { DashboardClient } from "@/app/components/dashboard/DashboardClient"

// Client component wrapper for handling mobile state
async function DashboardWrapper() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <DashboardClient 
      user={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as UserRole,
        classId: session.user.classId
      }}
    />
  )
}

export default function DashboardPage() {
  return <DashboardWrapper />
}