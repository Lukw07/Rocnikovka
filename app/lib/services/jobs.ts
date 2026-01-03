import { prisma } from "../prisma"
import { JobStatus, JobAssignmentStatus, UserRole, JobTier } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"
import { ProgressionService } from "./progression"
import { TeacherStatsService } from "./teacher-stats"

export class JobsService {
  static async createJob(data: {
    title: string
    description: string
    subjectId: string
    teacherId: string
    categoryId?: string
    tier?: JobTier
    xpReward: number
    moneyReward: number
    skillpointsReward?: number
    reputationReward?: number
    maxStudents?: number
    isTeamJob?: boolean
    requiredLevel?: number
    requiredSkillId?: string
    requiredSkillLevel?: number
    estimatedHours?: number
  }, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    const job = await prisma.$transaction(async (tx) => {
      // Verify teacher exists and has TEACHER role
      const teacher = await tx.user.findFirst({
        where: {
          id: data.teacherId,
          role: { in: [UserRole.TEACHER, UserRole.OPERATOR] }
        }
      })
      
      if (!teacher) {
        throw new Error("Teacher not found or insufficient permissions")
      }
      
      // Create job
      const job = await tx.job.create({
        data: {
          title: data.title,
          description: data.description,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          categoryId: data.categoryId,
          tier: data.tier || JobTier.BASIC,
          xpReward: data.xpReward,
          moneyReward: data.moneyReward,
          skillpointsReward: data.skillpointsReward || 1,
          reputationReward: data.reputationReward || 0,
          maxStudents: data.maxStudents || 1,
          isTeamJob: data.isTeamJob || false,
          requiredLevel: data.requiredLevel || 0,
          requiredSkillId: data.requiredSkillId,
          requiredSkillLevel: data.requiredSkillLevel,
          estimatedHours: data.estimatedHours,
          status: JobStatus.OPEN
        }
      })
      
      // Log creation
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job created: ${data.title}`),
          userId: data.teacherId,
          requestId: reqId,
          metadata: {
            jobId: job.id,
            subjectId: data.subjectId,
            tier: job.tier,
            xpReward: data.xpReward,
            moneyReward: data.moneyReward,
            isTeamJob: data.isTeamJob
          }
        }
      })
      
      return job
    })
    
    // Track teacher statistics (outside transaction to avoid deadlocks)
    try {
      await TeacherStatsService.trackJobCreated(data.teacherId, {
        xpReward: data.xpReward,
        moneyReward: data.moneyReward
      }, reqId)
    } catch (error) {
      console.error("Failed to track teacher stats:", error)
    }
    
    return job
  }
  
  static async applyForJob(jobId: string, studentId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      // Verify job exists and is open
      const job = await tx.job.findUnique({
        where: { id: jobId },
        include: { assignments: true }
      })
      
      if (!job) {
        throw new Error("Job not found")
      }
      
      if (job.status !== JobStatus.OPEN) {
        throw new Error("Job is not open for applications")
      }
      
      // Check if student already applied
      const existingAssignment = await tx.jobAssignment.findUnique({
        where: {
          jobId_studentId: {
            jobId,
            studentId
          }
        }
      })
      
      if (existingAssignment) {
        throw new Error("Student already applied for this job")
      }
      
      // Check if job is full
      if (job.assignments.length >= job.maxStudents) {
        throw new Error("Job is full")
      }
      
      // Create assignment
      const assignment = await tx.jobAssignment.create({
        data: {
          jobId,
          studentId,
          status: JobAssignmentStatus.APPLIED
        }
      })
      
      // Log application
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Student applied for job: ${job.title}`),
          userId: studentId,
          requestId: reqId,
          metadata: {
            jobId,
            assignmentId: assignment.id
          }
        }
      })
      
      return assignment
    })
  }
  
  static async approveJobAssignment(assignmentId: string, teacherId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.jobAssignment.findUnique({
        where: { id: assignmentId },
        include: { job: true }
      })
      
      if (!assignment) {
        throw new Error("Assignment not found")
      }
      
      if (assignment.job.teacherId !== teacherId) {
        throw new Error("Only the job creator can approve assignments")
      }
      
      if (assignment.status !== JobAssignmentStatus.APPLIED) {
        throw new Error("Assignment is not in APPLIED status")
      }
      
      const updatedAssignment = await tx.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: JobAssignmentStatus.APPROVED }
      })
      
      // Log approval
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job assignment approved: ${assignment.job.title}`),
          userId: teacherId,
          requestId: reqId,
          metadata: {
            assignmentId,
            jobId: assignment.jobId,
            studentId: assignment.studentId
          }
        }
      })
      
      return updatedAssignment
    })
  }
  
  static async closeJob(jobId: string, teacherId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        include: {
          assignments: {
            include: { student: true }
          }
        }
      })
      
      if (!job) {
        throw new Error("Job not found")
      }
      
      if (job.teacherId !== teacherId) {
        throw new Error("Only the job creator can close the job")
      }
      
      if (job.status !== JobStatus.OPEN && job.status !== JobStatus.IN_PROGRESS) {
        throw new Error("Job cannot be closed in current status")
      }
      
      // Update job status
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CLOSED,
          closedAt: new Date()
        }
      })
      
      // Process payouts for approved assignments
      const approvedAssignments = job.assignments.filter(
        a => a.status === JobAssignmentStatus.APPROVED
      )
      
      const payouts: Array<{
        studentId: string
        studentName: string
        xpAmount: number
        moneyAmount: number
      }> = []
      
      let totalXpPaid = 0
      let totalMoneyPaid = 0
      
      if (approvedAssignments.length > 0) {
        // Calculate individual payout (floor division)
        const xpPerStudent = Math.floor(job.xpReward / approvedAssignments.length)
        const moneyPerStudent = Math.floor(job.moneyReward / approvedAssignments.length)
        
        for (const assignment of approvedAssignments) {
          // Get student's Leadership level for job reward bonus
          const leadershipSkill = await tx.skill.findFirst({
            where: { name: "Leadership" }
          })
          
          let leadershipBonus = 1.0
          if (leadershipSkill) {
            const leadershipLevel = await tx.playerSkill.findUnique({
              where: {
                userId_skillId: {
                  userId: assignment.studentId,
                  skillId: leadershipSkill.id
                }
              }
            })
            
            if (leadershipLevel && leadershipLevel.level > 0) {
              // Apply Leadership bonus: +2% per level (max +20%)
              leadershipBonus = Math.min(1.2, 1.0 + (leadershipLevel.level * 0.02))
            }
          }
          
          // Award XP with Leadership bonus applied
          const xpWithBonus = Math.floor(xpPerStudent * leadershipBonus)
          await tx.xPAudit.create({
            data: {
              userId: assignment.studentId,
              amount: xpWithBonus,
              reason: `Job completion: ${job.title}${leadershipBonus > 1.0 ? ` (Leadership bonus +${((leadershipBonus - 1) * 100).toFixed(0)}%)` : ""}`,
              requestId: reqId
            }
          })
          
          // Award money with Leadership bonus applied
          const moneyWithBonus = Math.floor(moneyPerStudent * leadershipBonus)
          await tx.moneyTx.create({
            data: {
              userId: assignment.studentId,
              amount: moneyWithBonus,
              type: "EARNED",
              reason: `Job completion: ${job.title}`,
              requestId: reqId
            }
          })
          
          // Award skillpoint (1 skillpoint per job completion)
          try {
            const skillpointsToAward = job.skillpointsReward || 1
            await tx.skillPoint.upsert({
              where: { userId: assignment.studentId },
              update: {
                available: { increment: skillpointsToAward },
                total: { increment: skillpointsToAward }
              },
              create: {
                userId: assignment.studentId,
                available: skillpointsToAward,
                total: skillpointsToAward,
                spent: 0
              }
            })
          } catch (err) {
            console.error("Error awarding skillpoint:", err)
            // Continue anyway - skillpoint is nice-to-have
          }

          // Award reputation if job has reputation reward
          if (job.reputationReward && job.reputationReward !== 0) {
            try {
              await tx.reputation.upsert({
                where: { userId: assignment.studentId },
                update: {
                  points: { increment: job.reputationReward }
                },
                create: {
                  userId: assignment.studentId,
                  points: job.reputationReward,
                  tier: 0
                }
              })

              // Log reputation change
              await tx.reputationLog.create({
                data: {
                  userId: assignment.studentId,
                  change: job.reputationReward,
                  reason: `Job completion: ${job.title}`,
                  sourceId: job.id,
                  sourceType: 'job'
                }
              })

              // Calculate new reputation tier (every 100 points = 1 tier)
              const reputation = await tx.reputation.findUnique({
                where: { userId: assignment.studentId }
              })

              if (reputation) {
                const newTier = Math.floor(Math.abs(reputation.points) / 100)
                if (newTier !== reputation.tier) {
                  await tx.reputation.update({
                    where: { userId: assignment.studentId },
                    data: { tier: newTier }
                  })
                }
              }
            } catch (err) {
              console.error("Error awarding reputation:", err)
              // Continue anyway - reputation is nice-to-have
            }
          }
          
          // Update assignment status
          await tx.jobAssignment.update({
            where: { id: assignment.id },
            data: {
              status: JobAssignmentStatus.COMPLETED,
              completedAt: new Date()
            }
          })

          // Guild integration - if student is in a guild and it's a team job
          if (job.isTeamJob) {
            try {
              const guildMember = await tx.guildMember.findFirst({
                where: { userId: assignment.studentId }
              })

              if (guildMember) {
                // Add bonus to guild treasury (5% of money reward)
                const treasuryBonus = Math.floor(moneyPerStudent * 0.05)
                if (treasuryBonus > 0) {
                  await tx.guild.update({
                    where: { id: guildMember.guildId },
                    data: { treasury: { increment: treasuryBonus } }
                  })
                }

                // Add XP to guild (25% of XP reward)
                const guildXP = Math.floor(xpPerStudent * 0.25)
                await tx.guild.update({
                  where: { id: guildMember.guildId },
                  data: { xp: { increment: guildXP } }
                })

                // Update member contribution
                await tx.guildMember.update({
                  where: { id: guildMember.id },
                  data: {
                    contributedXP: { increment: guildXP },
                    contributedMoney: { increment: treasuryBonus }
                  }
                })

                // Log guild activity
                await tx.guildActivity.create({
                  data: {
                    guildId: guildMember.guildId,
                    userId: assignment.studentId,
                    action: "team_job_completed",
                    details: `Completed team job: ${job.title}`
                  }
                })
              }
            } catch (err) {
              console.error("Error processing guild integration:", err)
              // Continue anyway - guild integration is optional
            }
          }
          
          totalXpPaid += xpWithBonus
          totalMoneyPaid += moneyWithBonus
          
          payouts.push({
            studentId: assignment.studentId,
            studentName: assignment.student.name,
            xpAmount: xpPerStudent,
            moneyAmount: moneyPerStudent
          })
        }
      }
      
      // Calculate remainders
      const xpRemainder = job.xpReward - totalXpPaid
      const moneyRemainder = job.moneyReward - totalMoneyPaid
      
      // Log completion with remainder information
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job closed: ${job.title}`),
          userId: teacherId,
          requestId: reqId,
          metadata: {
            jobId,
            totalXP: job.xpReward,
            totalMoney: job.moneyReward,
            studentsCount: approvedAssignments.length,
            xpPaid: totalXpPaid,
            moneyPaid: totalMoneyPaid,
            xpRemainder,
            moneyRemainder
          }
        }
      })
      
      // Log remainder if any
      if (xpRemainder > 0 || moneyRemainder > 0) {
        await tx.systemLog.create({
          data: {
            level: "WARN",
            message: sanitizeForLog(`Job payout remainder: XP=${xpRemainder}, Money=${moneyRemainder}`),
            userId: teacherId,
            requestId: reqId,
            metadata: {
              jobId,
              xpRemainder,
              moneyRemainder,
              reason: "Floor division remainder"
            }
          }
        })
      }
      
      return {
        job: updatedJob,
        payouts,
        remainder: {
          xp: xpRemainder,
          money: moneyRemainder
        }
      }
    })
    
    // Track teacher statistics for job completion (outside transaction)
    try {
      await TeacherStatsService.trackJobCompleted(teacherId, {
        xpAwarded: result.payouts.reduce((sum, p) => sum + p.xpAmount, 0),
        moneyAwarded: result.payouts.reduce((sum, p) => sum + p.moneyAmount, 0),
        studentsCount: result.payouts.length
      }, reqId)
    } catch (error) {
      console.error("Failed to track teacher stats:", error)
    }
    
    return result
  }
  
  static async getJobsForStudent(studentId: string, classId?: string, filters?: {
    categoryId?: string
    tier?: string
    isTeamJob?: boolean
    status?: string
  }) {
    try {
      const whereClause: any = {
        status: filters?.status || JobStatus.OPEN,
        subject: {
          enrollments: {
            some: {
              userId: studentId,
              ...(classId && { classId })
            }
          }
        }
      }

      // Filter by category if provided
      if (filters?.categoryId) {
        whereClause.categoryId = filters.categoryId
      }

      // Filter by tier if provided
      if (filters?.tier) {
        whereClause.tier = filters.tier
      }

      // Filter by team job if provided
      if (filters?.isTeamJob !== undefined) {
        whereClause.isTeamJob = filters.isTeamJob
      }

      return await prisma.job.findMany({
        where: whereClause,
        include: {
          subject: true,
          category: true,
          requiredSkill: true,
          teacher: {
            select: { name: true }
          },
          assignments: {
            where: { studentId }
          },
          _count: {
            select: { assignments: true }
          }
        },
        orderBy: [
          { tier: 'asc' },
          { createdAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error("Error in getJobsForStudent:", error)
      return []
    }
  }
  
  static async getJobsForTeacher(teacherId: string) {
    try {
      return await prisma.job.findMany({
        where: { teacherId },
        include: {
          subject: true,
          assignments: {
            include: {
              student: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    } catch (error) {
      console.error("Error in getJobsForTeacher:", error)
      return []
    }
  }
  
  static async getJobsForClass(classId: string, userId: string, userRole: string) {
    const whereClause: any = {
      subject: {
        enrollments: {
          some: { classId }
        }
      }
    }
    
    // Students can only see open jobs
    if (userRole === "STUDENT") {
      whereClause.status = JobStatus.OPEN
    }
    
    // Optimized query to avoid N+1 by fetching all assignments in one go
    return await prisma.job.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: {
          select: { name: true }
        },
        assignments: {
          where: { studentId: userId },
          include: {
            student: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }
  
  static async rejectJobAssignment(assignmentId: string, teacherId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.jobAssignment.findUnique({
        where: { id: assignmentId },
        include: { job: true }
      })
      
      if (!assignment) {
        throw new Error("Assignment not found")
      }
      
      if (assignment.job.teacherId !== teacherId) {
        throw new Error("Only the job creator can reject assignments")
      }
      
      if (assignment.status !== JobAssignmentStatus.APPLIED) {
        throw new Error("Assignment is not in APPLIED status")
      }
      
      const updatedAssignment = await tx.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: JobAssignmentStatus.REJECTED }
      })
      
      // Log rejection
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job assignment rejected: ${assignment.job.title}`),
          userId: teacherId,
          requestId: reqId,
          metadata: {
            assignmentId,
            jobId: assignment.jobId,
            studentId: assignment.studentId
          }
        }
      })
      
      return updatedAssignment
    })
  }
  
  static async returnJobAssignment(assignmentId: string, teacherId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()
    
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.jobAssignment.findUnique({
        where: { id: assignmentId },
        include: { job: true }
      })
      
      if (!assignment) {
        throw new Error("Assignment not found")
      }
      
      if (assignment.job.teacherId !== teacherId) {
        throw new Error("Only the job creator can return assignments")
      }
      
      if (assignment.status !== JobAssignmentStatus.APPROVED) {
        throw new Error("Assignment is not in APPROVED status")
      }
      
      const updatedAssignment = await tx.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: JobAssignmentStatus.APPLIED }
      })
      
      // Log return
      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job assignment returned for revision: ${assignment.job.title}`),
          userId: teacherId,
          requestId: reqId,
          metadata: {
            assignmentId,
            jobId: assignment.jobId,
            studentId: assignment.studentId
          }
        }
      })
      
      return updatedAssignment
    })
  }
}
