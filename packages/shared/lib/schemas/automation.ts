import * as z from "zod";

export const lightSelectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["color", "dimmable", "white"]),
  on: z.boolean(),
  brightness: z.number().min(0).max(100),
  reachable: z.boolean(),
  productname: z.string(),
  manufacturername: z.string(),
});

// Decay configuration schema for time-based brightness decay
export const decayConfigSchema = z.object({
  enabled: z.boolean(),
  decayAmount: z.number()
    .min(1, "Decay amount must be at least 1%")
    .max(100, "Decay amount cannot exceed 100%"),
  decayInterval: z.number()
    .min(1000, "Decay interval must be at least 1 second")
    .max(300000, "Decay interval cannot exceed 5 minutes"),
  addTimePerEvent: z.number()
    .min(1000, "Time per event must be at least 1 second")
    .max(300000, "Time per event cannot exceed 5 minutes"),
  maxAccumulatedTime: z.number()
    .min(10000, "Max accumulated time must be at least 10 seconds")
    .max(3600000, "Max accumulated time cannot exceed 1 hour")
    .optional(),
}).refine(
  (data) => !data.enabled || data.decayAmount > 0,
  { message: "Decay amount must be greater than 0 when decay is enabled" },
);

// Automation action types
export const automationActionSchema = z.discriminatedUnion("type", [
  // Set specific brightness
  z.object({
    type: z.literal("setBrightness"),
    brightness: z.number().min(1, "Brightness must be at least 1%").max(100, "Brightness cannot exceed 100%"),
  }),
  // Increment/decrement brightness
  z.object({
    type: z.literal("incrementBrightness"),
    increment: z.number().min(-100, "Increment cannot be less than -100%").max(100, "Increment cannot be more than 100%"),
    decayConfig: decayConfigSchema.optional(),
  }),
  // Set specific color
  z.object({
    type: z.literal("setColor"),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
    brightness: z.number().min(1, "Brightness must be at least 1%").max(100, "Brightness cannot exceed 100%").optional(),
  }),
  // Random colors
  z.object({
    type: z.literal("randomColors"),
    brightness: z.number().min(1, "Brightness must be at least 1%").max(100, "Brightness cannot exceed 100%").optional(),
    duration: z.number().min(1, "Duration must be at least 1 second").max(300, "Duration cannot exceed 5 minutes").optional(),
  }),
]);

export const automationCreateSchema = z.object({
  name: z.string().min(1, "Automation name is required"),
  description: z.string().optional(),
  selectedLights: z.array(z.string()).min(1, "At least one light must be selected"),
  action: automationActionSchema,
  enabled: z.boolean().default(true),
});

export type LightSelection = z.output<typeof lightSelectionSchema>;
export type DecayConfig = z.output<typeof decayConfigSchema>;
export type AutomationAction = z.output<typeof automationActionSchema>;
export type AutomationCreate = z.output<typeof automationCreateSchema>;
