"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { UserRole } from "@/app/lib/generated"
import { revalidatePath } from "next/cache"

export async function toggleOperatorRole(targetUserId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== UserRole.OPERATOR) {
    throw new Error("Unauthorized")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  // Only allow toggling between TEACHER and OPERATOR
  if (targetUser.role !== UserRole.TEACHER && targetUser.role !== UserRole.OPERATOR) {
    throw new Error("Can only toggle operator role for teachers")
  }

  const newRole = targetUser.role === UserRole.TEACHER ? UserRole.OPERATOR : UserRole.TEACHER

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  })

  revalidatePath("/dashboard")
  return { success: true, newRole }
}

export async function getTeachersAndOperators() {
    const session = await getServerSession(authOptions)
  
    if (!session?.user || session.user.role !== UserRole.OPERATOR) {
      throw new Error("Unauthorized")
    }

    const users = await prisma.user.findMany({
        where: {
            role: {
                in: [UserRole.TEACHER, UserRole.OPERATOR]
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: {
            name: 'asc'
        }
    })

    return users
}
