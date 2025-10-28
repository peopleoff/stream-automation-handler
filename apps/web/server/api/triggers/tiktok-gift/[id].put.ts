import { updateTikTokGiftTrigger } from "@cattyshack/shared/db/queries/tiktok-gift-triggers";
import { tiktokGiftTriggerCreateSchema } from "@cattyshack/shared/schemas";
import * as z from "zod";

const routeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

    // Validate request body
    const body = await readValidatedBody(event, body => tiktokGiftTriggerCreateSchema.parseAsync(body));

    // Update TikTok gift trigger
    const updates = {
      name: body.name,
      giftIds: JSON.stringify(body.giftIds),
      matchAllGifts: body.matchAllGifts,
      minQuantity: body.minQuantity ?? null,
      maxQuantity: body.maxQuantity ?? null,
      automationId: body.automationId,
      enabled: body.enabled,
    };

    const trigger = await updateTikTokGiftTrigger(params.id, updates);

    if (!trigger) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "TikTok gift trigger not found",
      });
    }

    return {
      message: "TikTok gift trigger updated successfully",
      data: trigger,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error updating TikTok gift trigger:", error);

    // Re-throw createError instances
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Update Failed",
      message: error instanceof Error ? error.message : "Failed to update TikTok gift trigger",
    });
  }
});
