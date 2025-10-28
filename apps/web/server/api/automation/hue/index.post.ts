import { createHueAutomation } from "@cattyshack/shared/db/queries/hue-automations";
import { automationCreateSchema } from "@cattyshack/shared/schemas";

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const body = await readValidatedBody(event, body => automationCreateSchema.parseAsync(body));

    // Convert AutomationCreate to database format
    const newAutomation = {
      name: body.name,
      description: body.description || null,
      enabled: body.enabled,
      actionType: body.action.type,
      actionConfig: JSON.stringify(body.action),
      selectedLights: JSON.stringify(body.selectedLights),
      triggerType: "manual",
      triggerConfig: null,
    };

    const automation = await createHueAutomation(newAutomation);

    return {
      message: "Hue automation created successfully",
      data: automation,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error creating Hue automation:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Creation Failed",
      message: error instanceof Error ? error.message : "Failed to create Hue automation",
    });
  }
});
