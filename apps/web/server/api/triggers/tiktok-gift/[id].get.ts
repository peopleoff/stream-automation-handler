import { getTikTokGiftTriggerById } from "@cattyshack/shared/db/queries/tiktok-gift-triggers";
import * as z from "zod";

const routeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

    const trigger = await getTikTokGiftTriggerById(params.id);

    if (!trigger) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "TikTok gift trigger not found",
      });
    }

    return {
      message: "TikTok gift trigger retrieved successfully",
      data: trigger,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error retrieving TikTok gift trigger:", error);

    // Re-throw createError instances
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Retrieval Failed",
      message: error instanceof Error ? error.message : "Failed to retrieve TikTok gift trigger",
    });
  }
});
