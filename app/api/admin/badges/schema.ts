import { z } from "zod"
import { ItemRarity } from "@/app/lib/generated"

export const createBadgeSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .trim(),
  imageUrl: z.string()
    .min(1, "Image URL is required")
    .refine((val) => val.startsWith('/') || val.startsWith('http'), {
      message: "Image URL must start with / (relative) or http/https (absolute)"
    }),
  rarity: z.nativeEnum(ItemRarity, {
    errorMap: () => ({ message: "Invalid rarity value" })
  }),
  category: z.string().optional(),
})

export type CreateBadgeInput = z.infer<typeof createBadgeSchema>
