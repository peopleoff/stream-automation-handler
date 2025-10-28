import { getConfig } from "@cattyshack/shared/db/queries/config";

export default defineEventHandler(async () => {
  try {
    const config = await getConfig();
    return config;
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
