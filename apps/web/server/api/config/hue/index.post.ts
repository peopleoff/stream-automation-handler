import { updateHueConfig } from "@cattyshack/shared/db/queries/config";
import { hueConfigSchema } from "@cattyshack/shared/schemas/hue";

export default defineEventHandler(async (event) => {
  try {
    // Validate and type the request body using the same schema as frontend
    const result = await readValidatedBody(event, body => hueConfigSchema.parseAsync(body));

    const { hue_ip, hue_username, hue_password } = result;

    // Save configuration
    const savedConfig = await updateHueConfig({
      hue_ip,
      hue_username,
      hue_password: hue_password || null,
    });

    return {
      message: "Hue configuration saved successfully",
      config: {
        hue_ip: savedConfig.hue_ip,
        hasCredentials: !!(savedConfig.hue_username),
      },
    };
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Failed to save Hue configuration",
    });
  }
});
