/**
 * Hue Service - Unified API for Philips Hue control
 *
 * Provides both:
 * - Simple REST API functions (for frontend/web app)
 * - Advanced client with effect queue (for backend event service)
 */

// Export all types
export * from "./types";

// Export simple REST API functions (for frontend)
export {
  hueFetch,
  discoverHueBridge,
  createHueUser,
  testHueConnection,
  getHueLights,
  controlHueLight,
  setupHueBridge,
  executeAutomationAction,
} from "./rest-api";
