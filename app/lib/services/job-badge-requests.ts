import { prisma } from "../prisma"
import { JobBadgeRequestStatus } from "../generated"
import { generateRequestId, sanitizeForLog } from "../utils"

export class JobBadgeRequestService {
  static async listPending(requestId?: string) {
    const reqId = requestId || generateRequestId()
    const requests = await prisma.jobBadgeRequest.findMany({
      where: { status: JobBadgeRequestStatus.PENDING },
      include: {
        job: true,
        badge: true,
        requester: true
      },
      orderBy: { createdAt: "asc" }
    })

    await prisma.systemLog.create({
      data: {
        level: "DEBUG",
        message: sanitizeForLog("Fetched pending job badge requests"),
        requestId: reqId
      }
    })

    return requests
  }

  static async updateStatus(params: { requestId: string; action: "approve" | "reject"; reviewerId: string }, requestId?: string) {
    const reqId = requestId || generateRequestId()

    return await prisma.$transaction(async (tx) => {
      const request = await tx.jobBadgeRequest.findUnique({
        where: { id: params.requestId },
        include: { job: true }
      })

      if (!request) {
        throw new Error("Job badge request not found")
      }

      if (request.status !== JobBadgeRequestStatus.PENDING) {
        throw new Error("Request already processed")
      }

      const newStatus = params.action === "approve" ? JobBadgeRequestStatus.APPROVED : JobBadgeRequestStatus.REJECTED

      const updated = await tx.jobBadgeRequest.update({
        where: { id: params.requestId },
        data: {
          status: newStatus,
          reviewerId: params.reviewerId,
          reviewedAt: new Date()
        }
      })

      if (newStatus === JobBadgeRequestStatus.APPROVED) {
        await tx.job.update({
          where: { id: request.jobId },
          data: { approvedBadgeId: request.badgeId }
        })
      }

      await tx.systemLog.create({
        data: {
          level: "INFO",
          message: sanitizeForLog(`Job badge request ${params.action}d`),
          userId: params.reviewerId,
          requestId: reqId,
          metadata: {
            requestId: params.requestId,
            jobId: request.jobId,
            badgeId: request.badgeId
          }
        }
      })

      return updated
    })
  }
}
