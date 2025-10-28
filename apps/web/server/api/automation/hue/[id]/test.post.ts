import { getHueConfig } from "@cattyshack/shared/db/queries/config";
import { getHueAutomationById } from "@cattyshack/shared/db/queries/hue-automations";
import { executeAutomationAction } from "@cattyshack/shared/services/hue";

export default defineEventHandler(async (event) => {
  try {
    const automationId = getRouterParam(event, "id");

    if (!automationId || Number.isNaN(Number(automationId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid automation ID",
      });
    }

    // Get the automation from database
    const automation = await getHueAutomationById(Number(automationId));
    if (!automation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Automation not found",
      });
    }

    // Get Hue bridge configuration
    const hueConfig = await getHueConfig();
    if (!hueConfig || !hueConfig.hue_ip || !hueConfig.hue_username) {
      throw createError({
        statusCode: 400,
        statusMessage: "Hue bridge not configured. Please configure your Hue bridge first.",
      });
    }

    // Parse automation configuration
    let actionConfig;
    let selectedLights;

    try {
      actionConfig = JSON.parse(automation.actionConfig);
      selectedLights = JSON.parse(automation.selectedLights);
    }
    catch {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid automation configuration",
      });
    }

    if (!Array.isArray(selectedLights) || selectedLights.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No lights selected for this automation",
      });
    }

    // Execute the automation action
    const results = await executeAutomationAction(
      hueConfig.hue_ip,
      hueConfig.hue_username,
      selectedLights,
      actionConfig,
    );

    // Check if any lights failed
    const failedLights = results.filter(result => !result.success);
    const successfulLights = results.filter(result => result.success);

    return {
      message: "Automation test completed",
      data: {
        automationId: automation.id,
        automationName: automation.name,
        totalLights: results.length,
        successfulLights: successfulLights.length,
        failedLights: failedLights.length,
        results,
      },
    };
  }
  catch (error: unknown) {
    // If it's already a createError, re-throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : "Failed to test automation";
    throw createError({
      statusCode: 500,
      statusMessage: message,
    });
  }
});
