/**
 * Hue Bridge Discovery and Connection Service
 * Using Philips Hue REST API directly
 */

import type {
  AppLight,
  HueApiResponse,
  HueDiscoveryResponse,
  HueLight,
  HueLightsResponse,
  SimpleAutomationAction,
} from "./types";
import { HueButtonPressError } from "./types";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrapper for fetch that disables TLS verification for Hue bridge self-signed certs
 * Use this for all Hue bridge API calls
 */
async function hueFetch(url: string, options?: RequestInit): Promise<Response> {
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    return await fetch(url, options);
  }
  finally {
    // Always restore original TLS setting
    if (originalRejectUnauthorized === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
    else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
  }
}

/**
 * Convert hex color to Hue XY color space
 * @param hex Hex color string (e.g., "#FF0000")
 * @returns [x, y] coordinates in CIE color space
 */
function hexToXy(hex: string): [number, number] {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse RGB values
  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const red = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  const green = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  const blue = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ
  const X = red * 0.649926 + green * 0.103455 + blue * 0.197109;
  const Y = red * 0.234327 + green * 0.743075 + blue * 0.022598;
  const Z = red * 0.0000000 + green * 0.053077 + blue * 1.035763;

  // Convert to xy
  const sum = X + Y + Z;
  if (sum === 0) {
    return [0.3127, 0.3290]; // Default white point
  }

  const x = X / sum;
  const y = Y / sum;

  return [x, y];
}

// ============================================================================
// Discovery Functions
// ============================================================================

/**
 * Discover Hue bridges on the local network
 * Uses Philips Hue N-UPnP discovery service
 */
export async function discoverHueBridge(): Promise<string | null> {
  try {
    console.log("🔍 Discovering Hue bridges via N-UPnP service...");
    const response = await fetch("https://discovery.meethue.com/");
    const bridges = await response.json() as HueDiscoveryResponse[];

    if (bridges[0] && bridges.length > 0) {
      console.log(`✅ Found bridge at IP: ${bridges[0].internalipaddress}`);
      return bridges[0].internalipaddress;
    }
    else {
      console.log("❌ No bridges found via discovery service");
      return null;
    }
  }
  catch (error) {
    console.error("Bridge discovery failed:", error);
    return null;
  }
}

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Create a new user on the Hue bridge
 * Requires the bridge button to be pressed within 30 seconds
 * @throws {HueButtonPressError} When bridge button needs to be pressed
 * @throws {Error} For other connection or API errors
 */
export async function createHueUser(ip: string): Promise<string> {
  console.warn(`⏳ Attempting to create username on Hue bridge at ${ip}...`);

  try {
    const url = `https://${ip}/api`;
    console.log(`📡 Sending POST request to: ${url}`);

    const fetchResponse = await hueFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        devicetype: "CattyShack-Automation#LiveStream",
      }),
    });

    console.log(`📡 Response status: ${fetchResponse.status} ${fetchResponse.statusText}`);

    const response = await fetchResponse.json() as HueApiResponse[];

    return processCreateUserResponse(response);
  }
  catch (error: unknown) {
    // Re-throw HueButtonPressError as-is
    if (error instanceof HueButtonPressError) {
      throw error;
    }

    // Log the full error for debugging
    console.error("❌ Failed to create Hue user:", error);

    // Handle other errors with more context
    const errorMessage = error instanceof Error ? error.message : "Failed to create user on Hue bridge";
    throw new Error(
      `Cannot connect to Hue bridge at ${ip}. ${errorMessage}. Please verify the bridge is accessible on your network.`,
    );
  }
}

// Helper to process create user response (broken out to avoid duplication)
function processCreateUserResponse(response: HueApiResponse[]): string {
  if (response && response.length > 0) {
    const firstResponse = response[0];
    if (!firstResponse) {
      throw new Error("No response from Hue bridge");
    }

    if ("error" in firstResponse) {
      console.error(`❌ Hue bridge error: ${firstResponse.error.description} (type: ${firstResponse.error.type})`);
      // Error code 101 = link button not pressed
      if (firstResponse.error.type === 101) {
        throw new HueButtonPressError(
          "Bridge button was not pressed. Please press the button on your Hue bridge and try again.",
        );
      }
      throw new Error(firstResponse.error.description);
    }

    if ("success" in firstResponse && firstResponse.success.username) {
      console.warn("🎉 Successfully created Hue user!");
      return firstResponse.success.username;
    }
  }

  throw new Error("Unexpected response format from Hue bridge");
}

/**
 * Test connection to Hue bridge with existing credentials
 * Verifies if the IP and username are valid
 * @throws {Error} If connection fails or credentials are invalid
 */
export async function testHueConnection(ip: string, username: string): Promise<void> {
  try {
    const response = await hueFetch(`https://${ip}/api/${username}/lights`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    await response.json();
  }
  catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Invalid credentials or connection failed",
    );
  }
}

// ============================================================================
// Light Control Functions
// ============================================================================

/**
 * Get all lights from Hue bridge
 * Returns formatted light data for use in the application
 */
export async function getHueLights(ip: string, username: string): Promise<AppLight[]> {
  try {
    const response = await hueFetch(`https://${ip}/api/${username}/lights`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const lights = await response.json() as HueLightsResponse;

    return Object.entries(lights).map(([lightId, light]) => {
      // Determine light type based on capabilities
      let type: "white" | "dimmable" | "color" = "white";
      if (light.capabilities.control.colorgamut) {
        type = "color";
      }
      else if (light.capabilities.control.ct) {
        type = "dimmable";
      }

      return {
        id: lightId,
        name: light.name,
        type,
        on: light.state.on || false,
        brightness: Math.round(((light.state.bri || 0) / 254) * 100), // Convert 1-254 to 1-100
        reachable: light.state.reachable || false,
        productname: light.productname || "Unknown",
        manufacturername: light.manufacturername || "Unknown",
      };
    });
  }
  catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch lights from Hue bridge",
    );
  }
}

/**
 * Control a specific Hue light
 */
export async function controlHueLight(
  ip: string,
  username: string,
  lightId: string,
  state: {
    on?: boolean;
    bri?: number; // 1-254
    hue?: number; // 0-65535
    sat?: number; // 0-254
    xy?: [number, number]; // CIE color space
  },
) {
  try {
    const body: Record<string, unknown> = {};

    if (state.on !== undefined) {
      body.on = state.on;
    }
    if (state.bri !== undefined) {
      body.bri = state.bri;
    }
    if (state.hue !== undefined) {
      body.hue = state.hue;
    }
    if (state.sat !== undefined) {
      body.sat = state.sat;
    }
    if (state.xy !== undefined) {
      body.xy = state.xy;
    }

    const response = await hueFetch(`https://${ip}/api/${username}/lights/${lightId}/state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
  catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : `Failed to control light ${lightId}`,
    );
  }
}

// ============================================================================
// Automation Functions
// ============================================================================

/**
 * Complete Hue bridge setup process
 * 1. Discover bridge IP
 * 2. Create user (requires button press)
 * 3. Test connection
 * @throws {HueButtonPressError} When bridge button needs to be pressed
 * @throws {Error} For other setup failures
 */
export async function setupHueBridge(): Promise<{ ip: string; username: string }> {
  console.log("🚀 Starting Hue bridge auto-setup...");

  // Step 1: Discover bridge
  const bridgeIp = await discoverHueBridge();

  if (!bridgeIp) {
    throw new Error(
      "No Hue bridge found on the network. Please check that your bridge is connected and try again.",
    );
  }

  console.log(`✅ Bridge discovered at: ${bridgeIp}`);

  // Step 2: Create user (requires button press)
  const username = await createHueUser(bridgeIp);

  console.log("✅ User created, testing connection...");

  // Step 3: Test the new connection
  await testHueConnection(bridgeIp, username);

  console.log("🎉 Hue bridge setup complete!");

  return {
    ip: bridgeIp,
    username,
  };
}

/**
 * Execute an automation action on specified lights
 */
export async function executeAutomationAction(
  ip: string,
  username: string,
  lightIds: string[],
  action: {
    type: "setBrightness" | "incrementBrightness" | "setColor" | "randomColors";
    brightness?: number;
    increment?: number;
    color?: string;
    duration?: number;
  },
) {
  const results: Array<{ lightId: string; success: boolean; error?: string }> = [];

  for (const lightId of lightIds) {
    try {
      const body: Record<string, unknown> = {};

      switch (action.type) {
        case "setBrightness": {
          body.on = true;
          body.bri = Math.round((action.brightness! / 100) * 254);
          break;
        }

        case "incrementBrightness": {
          // Get current light state first
          const lightResponse = await hueFetch(`https://${ip}/api/${username}/lights/${lightId}`);
          if (!lightResponse.ok) {
            throw new Error(`HTTP ${lightResponse.status}: ${lightResponse.statusText}`);
          }
          const currentLight = await lightResponse.json() as HueLight;
          const currentBri = currentLight.state.bri || 127;
          const newBri = Math.max(1, Math.min(254, currentBri + Math.round((action.increment! / 100) * 254)));
          body.on = true;
          body.bri = newBri;
          break;
        }

        case "setColor": {
          const xy = hexToXy(action.color!);
          body.on = true;
          body.xy = xy;
          if (action.brightness) {
            body.bri = Math.round((action.brightness / 100) * 254);
          }
          break;
        }

        case "randomColors": {
          // Generate random color
          const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
          const randomXy = hexToXy(randomHex);
          body.on = true;
          body.xy = randomXy;
          if (action.brightness) {
            body.bri = Math.round((action.brightness / 100) * 254);
          }
          break;
        }
      }

      const stateResponse = await hueFetch(`https://${ip}/api/${username}/lights/${lightId}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!stateResponse.ok) {
        throw new Error(`HTTP ${stateResponse.status}: ${stateResponse.statusText}`);
      }

      results.push({ lightId, success: true });
    }
    catch (error: unknown) {
      results.push({
        lightId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
