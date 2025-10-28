import { createTikTokGiftTrigger } from "@cattyshack/shared/db/queries/tiktok-gift-triggers";
import { tiktokGiftTriggerCreateSchema } from "@cattyshack/shared/schemas";

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const body = await readValidatedBody(event, body => tiktokGiftTriggerCreateSchema.parseAsync(body));

    // Create new TikTok gift trigger
    const newTrigger = {
      name: body.name,
      giftIds: JSON.stringify(body.giftIds),
      matchAllGifts: body.matchAllGifts,
      minQuantity: body.minQuantity ?? null,
      maxQuantity: body.maxQuantity ?? null,
      automationId: body.automationId,
      enabled: body.enabled,
    };

    const trigger = await createTikTokGiftTrigger(newTrigger);

    return {
      message: "TikTok gift trigger created successfully",
      data: trigger,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error creating TikTok gift trigger:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Creation Failed",
      message: error instanceof Error ? error.message : "Failed to create TikTok gift trigger",
    });
  }
});
