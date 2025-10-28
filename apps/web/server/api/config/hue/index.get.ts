/**
 * GET /api/config/hue
 *
 * Get current Hue bridge configuration
 * Returns stored configuration without sensitive data
 */

import { getHueConfig } from "@cattyshack/shared/db/queries/config";

export default defineEventHandler(async () => {
  try {
    console.log("📋 Fetching Hue configuration...");

    const config = await getHueConfig();

    if (!config) {
      return null;
    }

    // Return configuration without sensitive data
    return {
      success: true,
      config: {
        hue_ip: config.hue_ip,
        hue_username: config.hue_username,
        hue_password: config.hue_password,
      },
      message: "Hue configuration retrieved successfully",
    };
  }
  catch (error: unknown) {
    console.error("💥 Error fetching Hue config:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Fetch Failed",
      message: error instanceof Error ? error.message : "Failed to fetch Hue configuration",
    });
  }
});
