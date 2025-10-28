import { getAllHueAutomations } from "@cattyshack/shared/db/queries/hue-automations";

export default defineEventHandler(async () => {
  try {
    const automations = await getAllHueAutomations();

    return {
      message: "Hue automations retrieved successfully",
      data: automations,
      count: automations.length,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error fetching Hue automations:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Fetch Failed",
      message: error instanceof Error ? error.message : "Failed to fetch Hue automations",
    });
  }
});
