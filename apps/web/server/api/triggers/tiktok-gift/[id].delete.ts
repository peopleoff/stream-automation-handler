import { deleteTikTokGiftTrigger } from "@cattyshack/shared/db/queries/tiktok-gift-triggers";
import * as z from "zod";

const routeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

    const success = await deleteTikTokGiftTrigger(params.id);

    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "TikTok gift trigger not found",
      });
    }

    return {
      message: "TikTok gift trigger deleted successfully",
      data: { id: params.id },
    };
  }
  catch (error: unknown) {
    console.error("💥 Error deleting TikTok gift trigger:", error);

    // Re-throw createError instances
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Deletion Failed",
      message: error instanceof Error ? error.message : "Failed to delete TikTok gift trigger",
    });
  }
});
