import { authOptions } from "@/app/lib/auth"
import { getUserSubjects } from "../../lib/fns/subjectFunctions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { calculateLevel } from "@/app/lib/utils";

export const GET = async (req: NextRequest) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Support bakalariOnly query param
        const url = new URL(req.url)
        const bakalariOnly = url.searchParams.get("bakalariOnly") === "true"
        const listOnly = url.searchParams.get("listOnly") === "true"
        const withXP = url.searchParams.get("withXP") === "true"
        const data = await getUserSubjects(session.user.id, bakalariOnly) // Pass fullWeek flag

        if (bakalariOnly) {
            // Only return Bakaláři timetable if available
            if (Array.isArray(data)) {
                // If fallback to DB, return empty (no Bakaláři data)
                return NextResponse.json({ success: true, message: "No Bakaláři subjects", data: { timetable: null } }, { status: 200 })
            }
            // Return full weekly timetable data (includes Days with Atoms and lookup Subjects)
            return NextResponse.json({ success: true, message: "Bakaláři timetable", data: { timetable: data } }, { status: 200 })
        }

        if (listOnly) {
            // Return list of subjects (for SubjectsPanel)
            if (Array.isArray(data)) {
                // Database enrollments - add XP data if requested
                if (withXP) {
                    const subjectsWithXP = await Promise.all(data.map(async (enrollment: any) => {
                        const subjectId = enrollment.subject?.id
                        if (!subjectId) {
                            console.log('No subjectId for enrollment:', enrollment)
                            return {
                                ...enrollment,
                                subjectXP: 0,
                                subjectLevel: 1
                            }
                        }
                        
                        // Get all XP audits (grants) for this user
                        const xpAudits = await prisma.xPAudit.findMany({
                            where: {
                                userId: session.user.id
                            },
                            select: {
                                amount: true,
                                reason: true
                            }
                        })
                        
                        // For now, distribute XP evenly across all subjects
                        // In future, we could parse 'reason' field to match subjects
                        const totalXP = xpAudits.reduce((sum, audit) => sum + audit.amount, 0)
                        const enrollmentCount = data.length || 1
                        const xpPerSubject = Math.floor(totalXP / enrollmentCount)
                        
                        const levelInfo = calculateLevel(xpPerSubject)
                        
                        console.log(`Subject ${enrollment.subject?.name}: ${xpPerSubject} XP, Level ${levelInfo.level}`)
                        
                        return {
                            ...enrollment,
                            subjectXP: xpPerSubject,
                            subjectLevel: levelInfo.level
                        }
                    }))
                    return NextResponse.json({ success: true, message: "Subjects with XP from DB", data: subjectsWithXP }, { status: 200 })
                }
                return NextResponse.json({ success: true, message: "Subjects list from DB", data }, { status: 200 })
            }
            // Extract Subjects array from Bakaláři timetable
            const subjects = data.Subjects || []
            return NextResponse.json({ success: true, message: "Subjects list from Bakaláři", data: subjects }, { status: 200 })
        }

        return NextResponse.json({ success: true, message: "Subjects fetched successfully", data }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error }, { status: 500 });
    }
}