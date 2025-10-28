import { getHueAutomationById } from "@cattyshack/shared/db/queries/hue-automations";
import * as z from "zod";

const routeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

    const automation = await getHueAutomationById(params.id);

    if (!automation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Hue automation not found",
      });
    }

    return {
      message: "Hue automation retrieved successfully",
      data: automation,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error fetching Hue automation:", error);

    // Re-throw createError instances
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Fetch Failed",
      message: error instanceof Error ? error.message : "Failed to fetch Hue automation",
    });
  }
});
