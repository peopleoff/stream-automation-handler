import { updateHueConfig } from "@cattyshack/shared/db/queries/config";

export default defineEventHandler(async () => {
  try {
    // Clear Hue configuration by setting fields to null
    await updateHueConfig({
      hue_ip: null,
      hue_username: null,
      hue_password: null,
    });

    return {
      success: true,
      message: "Hue bridge configuration cleared successfully",
    };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Failed to clear Hue configuration",
    });
  }
});
