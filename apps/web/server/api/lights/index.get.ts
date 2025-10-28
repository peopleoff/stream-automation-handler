import { getConfig } from "@cattyshack/shared/db/queries/config";
import { getHueLights } from "@cattyshack/shared/services/hue";

export default defineEventHandler(async () => {
  try {
    // Get Hue configuration from database
    const config = await getConfig();

    // Check if Hue is configured
    if (!config?.hue_ip || !config?.hue_username) {
      throw createError({
        statusCode: 400,
        statusMessage: "Hue Bridge Not Configured",
        message: "Please configure your Hue bridge in settings before accessing lights",
      });
    }

    // Get lights from Hue bridge
    const lights = await getHueLights(config.hue_ip, config.hue_username);

    return {
      message: "Lights retrieved successfully",
      data: lights,
      count: lights.length,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error fetching lights:", error);

    // Handle specific Hue errors
    if (error instanceof Error) {
      if (error.message.includes("unauthorized user") || error.message.includes("invalid credentials")) {
        throw createError({
          statusCode: 401,
          statusMessage: "Hue Authentication Failed",
          message: "Invalid Hue bridge credentials. Please reconfigure your bridge in settings.",
        });
      }

      if (error.message.includes("bridge not found") || error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        throw createError({
          statusCode: 503,
          statusMessage: "Hue Bridge Unreachable",
          message: "Cannot connect to Hue bridge. Please check that your bridge is connected to the network.",
        });
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Lights Fetch Failed",
      message: error instanceof Error ? error.message : "Failed to fetch lights from Hue bridge",
    });
  }
});
