import { updateHueAutomation } from "@cattyshack/shared/db/queries/hue-automations";
import { automationCreateSchema } from "@cattyshack/shared/schemas";
import * as z from "zod";

const routeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export default defineEventHandler(async (event) => {
  try {
    const params = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);

    // Validate request body
    const body = await readValidatedBody(event, body => automationCreateSchema.parseAsync(body));

    // Convert AutomationCreate to database format
    const updates = {
      name: body.name,
      description: body.description || null,
      enabled: body.enabled,
      actionType: body.action.type,
      actionConfig: JSON.stringify(body.action),
      selectedLights: JSON.stringify(body.selectedLights),
    };

    const automation = await updateHueAutomation(params.id, updates);

    if (!automation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Hue automation not found",
      });
    }

    return {
      message: "Hue automation updated successfully",
      data: automation,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error updating Hue automation:", error);

    // Re-throw createError instances
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Update Failed",
      message: error instanceof Error ? error.message : "Failed to update Hue automation",
    });
  }
});
