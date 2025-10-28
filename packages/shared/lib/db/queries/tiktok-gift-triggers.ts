import type { TikTokGiftTrigger, NewTikTokGiftTrigger, HueAutomation } from "../schema";

import db from "../index";
import { tiktokGiftTriggers, hueAutomations } from "../schema";
import { eq, sql } from "drizzle-orm";

/**
 * Get all TikTok gift triggers
 */
export async function getAllTikTokGiftTriggers(): Promise<TikTokGiftTrigger[]> {
  return await db.select().from(tiktokGiftTriggers).orderBy(tiktokGiftTriggers.createdAt);
}

/**
 * Get a specific TikTok gift trigger by ID
 */
export async function getTikTokGiftTriggerById(id: number): Promise<TikTokGiftTrigger | undefined> {
  const result = await db.select().from(tiktokGiftTriggers).where(eq(tiktokGiftTriggers.id, id));
  return result[0];
}

/**
 * Create a new TikTok gift trigger
 */
export async function createTikTokGiftTrigger(trigger: NewTikTokGiftTrigger): Promise<TikTokGiftTrigger> {
  const result = await db.insert(tiktokGiftTriggers).values(trigger).returning();
  return result[0]!;
}

/**
 * Update an existing TikTok gift trigger
 */
export async function updateTikTokGiftTrigger(
  id: number,
  updates: Partial<NewTikTokGiftTrigger>
): Promise<TikTokGiftTrigger | undefined> {
  const result = await db
    .update(tiktokGiftTriggers)
    .set({
      ...updates,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(tiktokGiftTriggers.id, id))
    .returning();

  return result[0];
}

/**
 * Delete a TikTok gift trigger
 */
export async function deleteTikTokGiftTrigger(id: number): Promise<boolean> {
  // First check if the trigger exists
  const existing = await db.select().from(tiktokGiftTriggers).where(eq(tiktokGiftTriggers.id, id));

  if (existing.length === 0) {
    return false;
  }

  // Delete the trigger
  await db.delete(tiktokGiftTriggers).where(eq(tiktokGiftTriggers.id, id));
  return true;
}

/**
 * Get enabled TikTok gift triggers only
 */
export async function getEnabledTikTokGiftTriggers(): Promise<TikTokGiftTrigger[]> {
  return await db
    .select()
    .from(tiktokGiftTriggers)
    .where(eq(tiktokGiftTriggers.enabled, true))
    .orderBy(tiktokGiftTriggers.createdAt);
}

/**
 * Extended type for trigger with linked automation data
 */
export interface TikTokGiftTriggerWithAutomation extends TikTokGiftTrigger {
  automation: HueAutomation;
}

/**
 * Get enabled TikTok gift triggers with their linked automation data
 * This is used by the backend event service to execute automations
 */
export async function getEnabledTikTokGiftTriggersWithAutomations(): Promise<TikTokGiftTriggerWithAutomation[]> {
  const results = await db
    .select({
      trigger: tiktokGiftTriggers,
      automation: hueAutomations,
    })
    .from(tiktokGiftTriggers)
    .innerJoin(hueAutomations, eq(tiktokGiftTriggers.automationId, hueAutomations.id))
    .where(eq(tiktokGiftTriggers.enabled, true))
    .orderBy(tiktokGiftTriggers.createdAt);

  return results.map(({ trigger, automation }) => ({
    ...trigger,
    automation,
  }));
}
