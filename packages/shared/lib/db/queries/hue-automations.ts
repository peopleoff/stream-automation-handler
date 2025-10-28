import type { HueAutomation, NewHueAutomation } from "../schema";

import db from "../index";
import { hueAutomations } from "../schema";
import { eq, sql } from "drizzle-orm";

/**
 * Get all Hue automations
 */
export async function getAllHueAutomations(): Promise<HueAutomation[]> {
  return await db.select().from(hueAutomations).orderBy(hueAutomations.createdAt);
}

/**
 * Get a specific Hue automation by ID
 */
export async function getHueAutomationById(id: number): Promise<HueAutomation | undefined> {
  const result = await db.select().from(hueAutomations).where(eq(hueAutomations.id, id));
  return result[0];
}

/**
 * Create a new Hue automation
 */
export async function createHueAutomation(automation: NewHueAutomation): Promise<HueAutomation> {
  const result = await db.insert(hueAutomations).values(automation).returning();
  return result[0]!;
}

/**
 * Update an existing Hue automation
 */
export async function updateHueAutomation(id: number, updates: Partial<NewHueAutomation>): Promise<HueAutomation | undefined> {
  const result = await db
    .update(hueAutomations)
    .set({
      ...updates,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(hueAutomations.id, id))
    .returning();

  return result[0];
}

/**
 * Delete a Hue automation
 */
export async function deleteHueAutomation(id: number): Promise<boolean> {
  // First check if the automation exists
  const existing = await db.select().from(hueAutomations).where(eq(hueAutomations.id, id));

  if (existing.length === 0) {
    return false;
  }

  // Delete the automation
  await db.delete(hueAutomations).where(eq(hueAutomations.id, id));
  return true;
}

/**
 * Get enabled Hue automations only
 */
export async function getEnabledHueAutomations(): Promise<HueAutomation[]> {
  return await db
    .select()
    .from(hueAutomations)
    .where(eq(hueAutomations.enabled, true))
    .orderBy(hueAutomations.createdAt);
}
