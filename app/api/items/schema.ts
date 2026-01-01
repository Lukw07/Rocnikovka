import { z } from "zod"
import { ItemRarity, ItemType } from "@/app/lib/generated"

export const createItemSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .trim(),
  price: z.number()
    .int("Price must be an integer")
    .min(0, "Price must be at least 0")
    .max(10000, "Price cannot exceed 10,000"),
  rarity: z.nativeEnum(ItemRarity, {
    errorMap: () => ({ message: "Invalid rarity value" })
  }),
  type: z.nativeEnum(ItemType, {
    errorMap: () => ({ message: "Invalid item type" })
  }),
  imageUrl: z.string()
    .optional()
    .refine((val) => !val || val.startsWith('/') || val.startsWith('http'), {
      message: "Image URL must start with / (relative) or http/https (absolute)"
    }),
  isPurchasable: z.boolean().optional().default(true)
})

export type CreateItemRequest = z.infer<typeof createItemSchema>
