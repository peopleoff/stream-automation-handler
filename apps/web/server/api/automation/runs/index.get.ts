import { getRecentRuns } from "@cattyshack/shared/db/queries/automation-runs";

export default defineEventHandler(async () => {
  try {
    const runs = await getRecentRuns(15);

    return {
      message: "Automation runs retrieved successfully",
      data: runs,
      count: runs.length,
    };
  }
  catch (error: unknown) {
    console.error("💥 Error fetching automation runs:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Fetch Failed",
      message: error instanceof Error ? error.message : "Failed to fetch automation runs",
    });
  }
});
