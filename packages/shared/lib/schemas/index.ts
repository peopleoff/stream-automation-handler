/**
 * Centralized Zod validation schemas for the entire project
 *
 * Import schemas like:
 * import { hueConfigSchema } from '@/lib/schemas'
 *
 * Or import from specific schema files:
 * import { hueConfigSchema } from '@/lib/schemas/hue'
 */

// Automation schemas
export {
  type AutomationAction,
  automationActionSchema,
  type AutomationCreate,
  automationCreateSchema,
  type LightSelection,
  lightSelectionSchema,
} from "./automation";

// Hardware/Device schemas
export { type HueConfig, hueConfigSchema } from "./hue";

// Stream Integration schemas
export { type TiktokConfig, tiktokConfigSchema } from "./streaming";

// Trigger schemas
export {
  type TikTokGiftTriggerCreate,
  tiktokGiftTriggerCreateSchema,
} from "./tiktok-gift-trigger";

// Future schema exports will go here:
// export { userSchema, type User } from './auth'
