import { prisma } from "../prisma"
import { Logger } from "../logging"
import { LevelingSystem } from "../leveling"

const logger = new Logger("studentFunctions")

/**
 * Adds XP to a student's record in the database.
 * This creates an XP audit entry and logs the action.
 * 
 * @param {string} userId - The ID of the user/student
 * @param {string} subjectId - The ID of the subject
 * @param {number} xpValue - The amount of XP to add
 * @param {string} reason - The reason for adding XP
 * @param {string} requestId - Optional request ID for tracking
 * @returns {Promise<void>} Promise that resolves when the XP is added
 * 
 * @example
 * // Add 50 XP to student for completing homework
 * await addXp("user123", "subject456", 50, "Completed homework assignment", "req789");
 */
export const addXp = async (
    userId: string, 
    subjectId: string, 
    xpValue: number, 
    reason: string,
    requestId?: string
) => {
    // Create XP audit entry
    await prisma.xPAudit.create({
        data: {
            userId,
            amount: xpValue,
            reason,
            requestId
        }
    })

    // Log the action
    await logger.info(`Added ${xpValue} XP to user ${userId} for subject ${subjectId}: ${reason}`, {
        userId,
        requestId,
        metadata: { subjectId, xpValue, reason }
    })
}

/**
 * Gets the total XP for a user
 * 
 * @param {string} userId - The ID of the user
 * @returns {Promise<number>} Promise that resolves to the total XP
 * 
 * @example
 * const totalXP = await getTotalXp("user123");
 */
export const getTotalXp = async (userId: string): Promise<number> => {
    const audits = await prisma.xPAudit.findMany({
        where: { userId },
        select: { amount: true }
    })

    return audits.reduce((total, audit) => total + audit.amount, 0)
}

/**
 * Gets the current level and XP info for a user
 * 
 * @param {string} userId - The ID of the user
 * @returns {Promise<object>} Promise that resolves to level information
 * 
 * @example
 * const levelInfo = await getUserLevelInfo("user123");
 * // Returns { level: 5, totalXP: 1250, xpRequired: 300, ... }
 */
export const getUserLevelInfo = async (userId: string) => {
    const totalXP = await getTotalXp(userId)
    const levelInfo = LevelingSystem.getLevelInfo(totalXP)
    
    return {
        ...levelInfo,
        totalXP
    }
}

/**
 * Gets user data including their level information
 * 
 * @param {string} userId - The ID of the user to retrieve data for
 * @returns {Promise<object | null>} Promise that resolves to the user data or null if not found
 * 
 * @example
 * const userData = await getUserData("user123");
 */
export const getUserData = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            enrollments: {
                include: {
                    subject: true,
                    class: true
                }
            },
            achievementAwards: {
                include: {
                    achievement: true
                }
            }
        }
    })

    if (!user) return null

    const levelInfo = await getUserLevelInfo(userId)

    return {
        ...user,
        ...levelInfo
    }
}

/**
 * Gets all students enrolled in a specific subject
 * 
 * @param {string} subjectId - The ID of the subject
 * @returns {Promise<Array>} Promise that resolves to an array of students with their enrollment info
 * 
 * @example
 * const students = await getSubjectStudents("subject123");
 */
export const getSubjectStudents = async (subjectId: string) => {
    const enrollments = await prisma.enrollment.findMany({
        where: { subjectId },
        include: {
            user: true,
            class: true
        }
    })

    // Get level info for each student
    const studentsWithLevels = await Promise.all(
        enrollments.map(async (enrollment) => {
            const levelInfo = await getUserLevelInfo(enrollment.userId)
            return {
                ...enrollment,
                levelInfo
            }
        })
    )

    return studentsWithLevels
}

/**
 * Gets all students in a specific class
 * 
 * @param {string} classId - The ID of the class
 * @returns {Promise<Array>} Promise that resolves to an array of students
 * 
 * @example
 * const students = await getClassStudents("class123");
 */
export const getClassStudents = async (classId: string) => {
    const students = await prisma.user.findMany({
        where: { 
            classId,
            role: "STUDENT"
        },
        include: {
            enrollments: {
                include: {
                    subject: true
                }
            }
        }
    })

    // Get level info for each student
    const studentsWithLevels = await Promise.all(
        students.map(async (student) => {
            const levelInfo = await getUserLevelInfo(student.id)
            return {
                ...student,
                levelInfo
            }
        })
    )

    return studentsWithLevels
}