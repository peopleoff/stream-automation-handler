/**
 * Shared Hue service types combining frontend REST API and backend node-hue-api implementations
 */

// ============================================================================
// REST API Types (from frontend)
// ============================================================================

export type HueDiscoveryResponse = {
  id: string;
  internalipaddress: string;
};

export type HueApiSuccessResponse = {
  success: {
    username?: string;
    [key: string]: unknown;
  };
};

export type HueApiErrorResponse = {
  error: {
    type: number;
    address: string;
    description: string;
  };
};

export type HueApiResponse = HueApiSuccessResponse | HueApiErrorResponse;

export type HueLightState = {
  on: boolean;
  bri?: number; // 1-254
  hue?: number; // 0-65535
  sat?: number; // 0-254
  xy?: [number, number];
  colormode?: "hs" | "xy" | "ct";
  reachable: boolean;
};

export type HueLightCapabilities = {
  control: {
    colorgamut?: unknown;
    ct?: {
      min: number;
      max: number;
    };
  };
};

export type HueLight = {
  state: HueLightState;
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname: string;
  capabilities: HueLightCapabilities;
  uniqueid: string;
  swversion: string;
};

export type HueLightsResponse = {
  [lightId: string]: HueLight;
};

// ============================================================================
// Application Light Types
// ============================================================================

export type AppLight = {
  id: string;
  name: string;
  type: "white" | "dimmable" | "color";
  on: boolean;
  brightness: number; // 1-100 percentage
  reachable: boolean;
  productname: string;
  manufacturername: string;
};

// ============================================================================
// Advanced Effect Types (from backend)
// ============================================================================

export interface LightEffect {
  type: "color" | "brightness" | "flash" | "pulse" | "rainbow";
  color?: {
    red: number;
    green: number;
    blue: number;
  };
  brightness?: number; // 0-100
  duration?: number; // milliseconds
  repeats?: number;
}

export interface LightMapping {
  giftId: string;
  giftName: string;
  lightIds: string[];
  effects: LightEffect[];
  priority: number; // higher priority overrides lower
}

export interface LightAutomationConfig {
  bridgeIp: string;
  username: string;
  defaultBrightness?: number;
  maxEffectDuration?: number;
}

export interface LightInfo {
  id: string;
  name: string;
  state: {
    on: boolean;
    brightness: number;
    color?: {
      red: number;
      green: number;
      blue: number;
    };
  };
}

export interface LightAutomation {
  readonly name: string;
  readonly isConnected: boolean;
}

export interface LightAutomationActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  applyEffect: (lightIds: string[], effect: LightEffect) => Promise<void>;
  getLights: () => Promise<LightInfo[]>;
}

export type CreateLightAutomation = (
  config: LightAutomationConfig
) => LightAutomation & LightAutomationActions;

// ============================================================================
// Simple Automation Actions (from frontend)
// ============================================================================

export type SimpleAutomationAction = {
  type: "setBrightness" | "incrementBrightness" | "setColor" | "randomColors";
  brightness?: number;
  increment?: number;
  color?: string;
  duration?: number;
};

// ============================================================================
// Custom Errors
// ============================================================================

export class HueButtonPressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HueButtonPressError";
  }
}
