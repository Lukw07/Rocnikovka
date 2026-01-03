/**
 * Služba pro správu notifikací
 * Podporuje různé typy notifikací včetně achievementů a streaks
 */

import { prisma } from "@/app/lib/prisma"
import { NotificationType } from "@/app/lib/generated"

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

export class NotificationService {
  
  /**
   * Vytvoří novou notifikaci
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || undefined,
        isRead: false
      }
    })
  }

  /**
   * Získá nepřečtené notifikace uživatele
   */
  static async getUnreadNotifications(userId: string): Promise<NotificationData[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Omezit na posledních 50 nepřečtených
    })

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt
    }))
  }

  /**
   * Získá všechny notifikace uživatele (včetně přečtených)
   */
  static async getAllNotifications(
    userId: string, 
    limit: number = 100
  ): Promise<NotificationData[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt
    }))
  }

  /**
   * Označí notifikaci jako přečtenou
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId // Security: jen vlastní notifikace
      },
      data: {
        isRead: true
      }
    })
  }

  /**
   * Označí všechny notifikace jako přečtené
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })
  }

  /**
   * Smaže staré přečtené notifikace (cleanup)
   */
  static async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return {
      deletedCount: result.count,
      cutoffDate
    }
  }

  /**
   * Získá počet nepřečtených notifikací
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
  }

  /**
   * Smaže notifikaci
   */
  static async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId // Security: jen vlastní notifikace
      }
    })
  }

  /**
   * Filtruje notifikace podle typu
   */
  static async getNotificationsByType(
    userId: string,
    type: NotificationType,
    limit: number = 50
  ): Promise<NotificationData[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt
    }))
  }
}
