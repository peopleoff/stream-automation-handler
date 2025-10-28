import { updateConfig } from "@cattyshack/shared/db/queries/config";
import { tiktokConfigSchema } from "@cattyshack/shared/schemas/streaming";

export default defineEventHandler(async (event) => {
  try {
    // Validate and type the request body using the same schema as frontend
    const result = await readValidatedBody(event, body => tiktokConfigSchema.parseAsync(body));

    const { tiktok_handle, automations_enabled } = result;

    // Save configuration
    // Convert boolean to integer for SQLite (1 = true, 0 = false)
    const savedConfig = await updateConfig({
      tiktok_handle,
      automations_enabled: automations_enabled !== undefined ? (automations_enabled ? 1 : 0) : undefined,
    });

    return {
      message: "TikTok settings saved successfully",
      config: {
        tiktok_handle: savedConfig.tiktok_handle,
        automations_enabled: savedConfig.automations_enabled,
      },
    };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Failed to save TikTok settings",
    });
  }
});
