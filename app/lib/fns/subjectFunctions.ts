import prisma from "../prisma"
import { getBakalariTimetable } from "../bakalari/bakalari"

export const getUserSubjects = async (userIdString: string, fullWeek: boolean = false) => {
    // Get user with their Bakalari token
    const user = await prisma.user.findUnique({
        where: { id: userIdString },
        select: { bakalariToken: true }
    })

    if (!user?.bakalariToken) {
        console.log('[getUserSubjects] No Bakalari token, using DB enrollments')
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: userIdString },
            include: { subject: true, class: true, user: true },
            orderBy: { subject: { name: 'asc' } }
        })
        return enrollments
    }

    // Fetch subjects from Bakalari - use weekly timetable if requested
    const bakalariSubjects = fullWeek 
        ? await getBakalariTimetable(user.bakalariToken, 'week')
        : await getBakalariTimetable(user.bakalariToken, 'day')
    console.log('[getUserSubjects] Bakalari raw response:', JSON.stringify(bakalariSubjects, null, 2))
    console.log('[getUserSubjects] Bakalari response type:', typeof bakalariSubjects)
    console.log('[getUserSubjects] Is array:', Array.isArray(bakalariSubjects))

    if (!bakalariSubjects) {
        console.log('[getUserSubjects] Bakalari fetch failed, using DB enrollments')
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: userIdString },
            include: { subject: true, class: true, user: true },
            orderBy: { subject: { name: 'asc' } }
        })
        return enrollments
    }

    // Return the full timetable data (with Atoms and Subjects for lookup)
    console.log('[getUserSubjects] Returning Bakalari timetable data')
    return bakalariSubjects
}

export const getTeacherSubjects = async (userIdString: string) => {
    const subjects = await prisma.subject.findMany({
        include: {
            enrollments: { include: { user: true, class: true } },
            teacherDailyBudgets: {
                where: { teacherId: userIdString },
                include: { teacher: true }
            }
        },
        where: { teacherDailyBudgets: { some: { teacherId: userIdString } } }
    })
    return subjects
}

export const getUserSubjectData = async (userIdString: string, subjectIdString: string) => {
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId: userIdString, subjectId: subjectIdString },
        include: { subject: true, class: true, user: true }
    })
    return enrollment
}

export const getTeacherSubjectData = async (subjectIdString: string) => {
    const subject = await prisma.subject.findUnique({
        where: { id: subjectIdString },
        include: {
            enrollments: { include: { user: true, class: true } },
            teacherDailyBudgets: { include: { teacher: true } }
        }
    })
    return subject
}

export const updateSubjectItems = async (subjectId: number, items: any) => {
    return { message: "Not implemented", subjectId, items }
}

export const getUserSubjectItems = async (userIdString: string, subjectIdString: string) => {
    return []
}
