import * as z from "zod";

/**
 * Schema for creating a new TikTok gift trigger
 */
export const tiktokGiftTriggerCreateSchema = z.object({
  name: z.string().min(1, "Trigger name is required"),
  giftIds: z.array(z.string()),
  matchAllGifts: z.boolean().default(false),
  minQuantity: z.number().int().min(0, "Minimum quantity must be at least 0").optional(),
  maxQuantity: z.number().int().min(1, "Maximum quantity must be at least 1").optional(),
  automationId: z.number().int().positive("Please select an automation"),
  enabled: z.boolean().default(true),
}).refine(
  (data) => {
    // If both min and max are provided, min must be <= max
    if (data.minQuantity !== undefined && data.maxQuantity !== undefined) {
      return data.minQuantity <= data.maxQuantity;
    }
    return true;
  },
  {
    message: "Minimum quantity must be less than or equal to maximum quantity",
    path: ["minQuantity"],
  }
).refine(
  (data) => {
    // If matchAllGifts is false, at least one gift must be selected
    if (!data.matchAllGifts && data.giftIds.length === 0) {
      return false;
    }
    return true;
  },
  {
    message: "Please select at least one gift or enable 'Match all gifts'",
    path: ["giftIds"],
  }
).refine(
  (data) => {
    // Maximum 10 specific gifts can be selected
    if (!data.matchAllGifts && data.giftIds.length > 10) {
      return false;
    }
    return true;
  },
  {
    message: "You can select a maximum of 10 gifts",
    path: ["giftIds"],
  }
);

export type TikTokGiftTriggerCreate = z.output<typeof tiktokGiftTriggerCreateSchema>;
