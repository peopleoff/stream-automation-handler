/**
 * POST /api/config/hue/test
 *
 * Test existing Hue bridge configuration
 * Verifies connection with stored credentials
 */

import { getHueConfig } from "@cattyshack/shared/db/queries/config";
import { testHueConnection } from "@cattyshack/shared/services/hue";

export default defineEventHandler(async () => {
  try {
    // Get existing configuration from database
    const hueConfig = await getHueConfig();

    if (!hueConfig || !hueConfig.hue_ip || !hueConfig.hue_username) {
      throw new Error("Hue configuration is incomplete. Please set up the bridge first.");
    }

    // Test the connection - will throw if it fails
    await testHueConnection(hueConfig.hue_ip, hueConfig.hue_username);

    return {
      message: "Hue bridge connection successful",
      config: {
        hue_ip: hueConfig.hue_ip,
      },
    };
  }
  catch (error: unknown) {
    throw createError({
      statusMessage: error instanceof Error ? error.message : "Hue connection test failed",
    });
  }
});
