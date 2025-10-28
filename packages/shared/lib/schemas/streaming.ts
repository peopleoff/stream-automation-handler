import * as z from "zod";

/**
 * Schema for TikTok handle configuration
 * Validates TikTok username format (alphanumeric, underscores, periods, 1-24 chars)
 * Strips @ prefix if present
 */
export const tiktokConfigSchema = z.object({
  tiktok_handle: z.string()
    .min(1, "TikTok handle is required")
    .regex(/^@?[\w.]{1,24}$/, "TikTok handle must be 1-24 characters (letters, numbers, underscores, periods)")
    .transform(val => val.startsWith("@") ? val.slice(1) : val),
  automations_enabled: z.boolean().optional(),
});

export type TiktokConfig = z.output<typeof tiktokConfigSchema>;
