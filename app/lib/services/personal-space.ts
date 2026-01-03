import { prisma } from "../prisma"
import { generateRequestId, sanitizeForLog } from "../utils"

/**
 * Service pro správu osobního prostoru hráče
 * Podporuje customizaci theme, layout a furniture
 */
export class PersonalSpaceService {
  /**
   * Získá nebo vytvoří osobní prostor uživatele
   */
  static async getUserSpace(userId: string, requestId?: string) {
    const reqId = requestId || generateRequestId()

    try {
      let space = await prisma.personalSpace.findUnique({
        where: { userId },
        include: {
          furniture: {
            orderBy: { createdAt: "asc" },
          },
        },
      })

      // Pokud prostor neexistuje, vytvořit výchozí
      if (!space) {
        space = await prisma.personalSpace.create({
          data: {
            userId,
            theme: "default",
            layout: null,
          },
          include: {
            furniture: true,
          },
        })

        console.log(
          `[${reqId}] Created default personal space for user ${sanitizeForLog(userId)}`
        )
      }

      return space
    } catch (error) {
      console.error(`[${reqId}] Error getting user space:`, error)
      throw error
    }
  }

  /**
   * Aktualizuje theme nebo layout prostoru
   */
  static async updateSpace(
    userId: string,
    data: {
      theme?: string
      layout?: string
    },
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zajistit, že prostor existuje
      await this.getUserSpace(userId, reqId)

      const space = await prisma.personalSpace.update({
        where: { userId },
        data: {
          ...(data.theme && { theme: data.theme }),
          ...(data.layout && { layout: data.layout }),
        },
        include: {
          furniture: true,
        },
      })

      console.log(
        `[${reqId}] Updated personal space for user ${sanitizeForLog(userId)}`
      )

      return space
    } catch (error) {
      console.error(`[${reqId}] Error updating space:`, error)
      throw error
    }
  }

  /**
   * Přidá nábytek do prostoru
   */
  static async addFurniture(
    userId: string,
    data: {
      name: string
      type: string
      positionX: number
      positionY: number
      rotation?: number
    },
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Zajistit, že prostor existuje
      const space = await this.getUserSpace(userId, reqId)

      const furniture = await prisma.furniture.create({
        data: {
          personalSpaceId: space.id,
          name: data.name,
          type: data.type,
          positionX: data.positionX,
          positionY: data.positionY,
          rotation: data.rotation || 0,
        },
      })

      console.log(
        `[${reqId}] Added furniture ${furniture.id} to space of user ${sanitizeForLog(
          userId
        )}`
      )

      return furniture
    } catch (error) {
      console.error(`[${reqId}] Error adding furniture:`, error)
      throw error
    }
  }

  /**
   * Aktualizuje pozici nebo rotaci nábytku
   */
  static async updateFurniture(
    userId: string,
    furnitureId: string,
    data: {
      positionX?: number
      positionY?: number
      rotation?: number
    },
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Ověřit vlastnictví
      const space = await this.getUserSpace(userId, reqId)
      const existing = await prisma.furniture.findFirst({
        where: {
          id: furnitureId,
          personalSpaceId: space.id,
        },
      })

      if (!existing) {
        throw new Error("Furniture not found or does not belong to user")
      }

      const furniture = await prisma.furniture.update({
        where: { id: furnitureId },
        data: {
          ...(data.positionX !== undefined && { positionX: data.positionX }),
          ...(data.positionY !== undefined && { positionY: data.positionY }),
          ...(data.rotation !== undefined && { rotation: data.rotation }),
        },
      })

      console.log(
        `[${reqId}] Updated furniture ${furnitureId} for user ${sanitizeForLog(
          userId
        )}`
      )

      return furniture
    } catch (error) {
      console.error(`[${reqId}] Error updating furniture:`, error)
      throw error
    }
  }

  /**
   * Odstraní nábytek z prostoru
   */
  static async removeFurniture(
    userId: string,
    furnitureId: string,
    requestId?: string
  ) {
    const reqId = requestId || generateRequestId()

    try {
      // Ověřit vlastnictví
      const space = await this.getUserSpace(userId, reqId)
      const existing = await prisma.furniture.findFirst({
        where: {
          id: furnitureId,
          personalSpaceId: space.id,
        },
      })

      if (!existing) {
        throw new Error("Furniture not found or does not belong to user")
      }

      await prisma.furniture.delete({
        where: { id: furnitureId },
      })

      console.log(
        `[${reqId}] Removed furniture ${furnitureId} from space of user ${sanitizeForLog(
          userId
        )}`
      )

      return true
    } catch (error) {
      console.error(`[${reqId}] Error removing furniture:`, error)
      throw error
    }
  }

  /**
   * Získá dostupné themes
   */
  static getAvailableThemes() {
    return [
      { id: "default", name: "Výchozí", icon: "🏠" },
      { id: "dark", name: "Temná", icon: "🌙" },
      { id: "forest", name: "Les", icon: "🌲" },
      { id: "ocean", name: "Oceán", icon: "🌊" },
      { id: "space", name: "Vesmír", icon: "🚀" },
      { id: "castle", name: "Hrad", icon: "🏰" },
      { id: "cyberpunk", name: "Cyberpunk", icon: "🌃" },
      { id: "fantasy", name: "Fantasy", icon: "✨" },
    ]
  }

  /**
   * Získá dostupný nábytek
   */
  static getAvailableFurniture() {
    return [
      { id: "desk", name: "Stůl", type: "furniture", icon: "🪑" },
      { id: "chair", name: "Židle", type: "furniture", icon: "💺" },
      { id: "bookshelf", name: "Knihovna", type: "furniture", icon: "📚" },
      { id: "plant", name: "Rostlina", type: "decoration", icon: "🪴" },
      { id: "lamp", name: "Lampa", type: "decoration", icon: "💡" },
      { id: "painting", name: "Obraz", type: "decoration", icon: "🖼️" },
      { id: "trophy", name: "Trofej", type: "decoration", icon: "🏆" },
      { id: "rug", name: "Koberec", type: "decoration", icon: "🧶" },
      { id: "window", name: "Okno", type: "decoration", icon: "🪟" },
      { id: "clock", name: "Hodiny", type: "decoration", icon: "🕰️" },
    ]
  }
}
