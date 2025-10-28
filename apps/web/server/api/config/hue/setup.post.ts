import { updateHueConfig } from "@cattyshack/shared/db/queries/config";
import { setupHueBridge } from "@cattyshack/shared/services/hue";

export default defineEventHandler(async () => {
  try {
    console.log("🔧 API: Starting Hue bridge auto-setup...");

    // Attempt to set up the Hue bridge
    const { ip, username } = await setupHueBridge();

    console.log(`✅ API: Bridge setup successful - IP: ${ip}`);

    // Save configuration to database
    const savedConfig = await updateHueConfig({
      hue_ip: ip,
      hue_username: username,
      hue_password: null, // Hue bridges don't use passwords for API access
    });

    return {
      success: true,
      message: "Hue bridge setup completed successfully",
      config: {
        hue_ip: savedConfig.hue_ip,
        hue_username: savedConfig.hue_username,
      },
    };
  }
  catch (error: unknown) {
    console.error("❌ API: Hue setup failed:", error);

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Hue Setup Failed",
      message: error instanceof Error ? error.message : "Unknown error during Hue setup",
    });
  }
});
