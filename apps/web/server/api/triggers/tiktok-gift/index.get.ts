import { getAllTikTokGiftTriggers } from "@cattyshack/shared/db/queries/tiktok-gift-triggers";

export default defineEventHandler(async () => {
  try {
    const triggers = await getAllTikTokGiftTriggers();

    return {
      message: "TikTok gift triggers retrieved successfully",
      data: triggers,
      count: triggers.length,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error retrieving TikTok gift triggers:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Retrieval Failed",
      message: error instanceof Error ? error.message : "Failed to retrieve TikTok gift triggers",
    });
  }
});
