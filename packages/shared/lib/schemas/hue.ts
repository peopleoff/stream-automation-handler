import * as z from "zod";

/**
 * Schema for Philips Hue bridge configuration
 */
export const hueConfigSchema = z.object({
  hue_ip: z.string()
    .min(1, "IP address is required")
    .regex(/^(?:\d{1,3}\.){3}\d{1,3}$/, "Please enter a valid IP address"),
  hue_username: z.string()
    .min(1, "Username is required")
    .min(10, "Username must be at least 10 characters"),
  hue_password: z.string().optional(),
});

export type HueConfig = z.output<typeof hueConfigSchema>;
