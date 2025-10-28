<script setup lang="ts">
import type { HueAutomation, TikTokGiftTrigger } from "@cattyshack/shared/db/schema";

useHead({
  title: "TikTok Gift Triggers - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Manage TikTok gift triggers for your automations",
    },
  ],
});

// Fetch triggers from API
const { data: triggersResponse, status, refresh } = await useAsyncData(
  "tiktok-gift-triggers",
  () => $fetch<{ message: string; data: TikTokGiftTrigger[]; count: number }>("/api/triggers/tiktok-gift"),
);

// Fetch automations for display
const { data: automationsResponse } = await useAsyncData(
  "automations-for-triggers",
  () => $fetch<{ message: string; data: HueAutomation[]; count: number }>("/api/automation/hue"),
);

const triggers = computed(() => triggersResponse.value?.data ?? []);
const automations = computed(() => automationsResponse.value?.data ?? []);
const isLoading = computed(() => status.value === "pending");

const toast = useToast();
const router = useRouter();

// Get automation name by ID
function getAutomationName(automationId: number): string {
  const automation = automations.value.find(a => a.id === automationId);
  return automation?.name || `Automation #${automationId}`;
}

// Format quantity range
function formatQuantityRange(trigger: TikTokGiftTrigger): string {
  if (trigger.minQuantity === null && trigger.maxQuantity === null) {
    return "Any quantity";
  }
  if (trigger.minQuantity !== null && trigger.maxQuantity !== null) {
    return `${trigger.minQuantity}-${trigger.maxQuantity}`;
  }
  if (trigger.minQuantity !== null) {
    return `${trigger.minQuantity}+`;
  }
  if (trigger.maxQuantity !== null) {
    return `≤ ${trigger.maxQuantity}`;
  }
  return "Any quantity";
}

// Delete trigger
async function deleteTrigger(id: number, name: string) {
  try {
    await $fetch(`/api/triggers/tiktok-gift/${id}`, {
      method: "DELETE",
    });

    toast.add({
      title: "Trigger Deleted",
      description: `"${name}" has been deleted successfully`,
      color: "success",
    });

    // Refresh the list
    await refresh();
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete trigger";
    toast.add({
      title: "Delete Failed",
      description: message,
      color: "error",
    });
  }
}

// Get gift names for display
function getGiftNames(trigger: TikTokGiftTrigger): string {
  if (trigger.matchAllGifts) {
    return "All gifts";
  }

  try {
    const giftIds: string[] = JSON.parse(trigger.giftIds);
    if (giftIds.length === 0) {
      return "No gifts selected";
    }
    if (giftIds.length === 1) {
      return `1 gift selected`;
    }
    return `${giftIds.length} gifts selected`;
  }
  catch (error) {
    console.error("Failed to parse giftIds:", error);
    return "Invalid configuration";
  }
}

// Toggle trigger enabled state
async function toggleTrigger(trigger: TikTokGiftTrigger) {
  try {
    // Parse giftIds from JSON
    let giftIds: string[] = [];
    try {
      giftIds = JSON.parse(trigger.giftIds);
    }
    catch (error) {
      console.error("Failed to parse giftIds:", error);
    }

    const updateData = {
      name: trigger.name,
      giftIds,
      matchAllGifts: trigger.matchAllGifts,
      minQuantity: trigger.minQuantity,
      maxQuantity: trigger.maxQuantity,
      automationId: trigger.automationId,
      enabled: !trigger.enabled,
    };

    await $fetch(`/api/triggers/tiktok-gift/${trigger.id}`, {
      method: "PUT",
      body: updateData,
    });

    toast.add({
      title: trigger.enabled ? "Trigger Disabled" : "Trigger Enabled",
      description: `"${trigger.name}" has been ${trigger.enabled ? "disabled" : "enabled"}`,
      color: "success",
    });

    // Refresh the list
    await refresh();
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update trigger";
    toast.add({
      title: "Update Failed",
      description: message,
      color: "error",
    });
  }
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generate confirmation descriptions
function getDeleteDescription(name: string): string {
  return `Are you sure you want to delete "${name}"? This action cannot be undone.`;
}

function getToggleDescription(trigger: TikTokGiftTrigger): string {
  return trigger.enabled
    ? `Are you sure you want to disable "${trigger.name}"? It will stop triggering automations.`
    : `Are you sure you want to enable "${trigger.name}"? It will start triggering automations.`;
}
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              TikTok Gift Triggers
            </h1>
            <p class="mt-2 text-lg text-muted">
              Configure which TikTok gifts trigger your automations
            </p>
          </div>
          <div class="flex gap-3">
            <UButton
              variant="outline"
              :loading="isLoading"
              @click="refresh()"
            >
              <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
              Refresh
            </UButton>
            <UButton
              color="primary"
              @click="router.push('/triggers/tiktok-gift/create')"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
              New Trigger
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-32 w-full"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="!triggers.length" class="text-center py-12">
        <UIcon name="i-lucide-gift" class="w-16 h-16 mx-auto mb-4 text-muted" />
        <h3 class="text-xl font-semibold mb-2">
          No Triggers Found
        </h3>
        <p class="text-muted mb-6">
          Get started by creating your first TikTok gift trigger.
        </p>
        <UButton
          color="primary"
          @click="router.push('/triggers/tiktok-gift/create')"
        >
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create First Trigger
        </UButton>
      </div>

      <!-- Triggers List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="trigger in triggers"
          :key="trigger.id"
          class="hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold">
                  {{ trigger.name }}
                </h3>
                <UBadge
                  :label="trigger.enabled ? 'Enabled' : 'Disabled'"
                  :color="trigger.enabled ? 'success' : 'neutral'"
                  variant="soft"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label class="font-medium text-muted">TikTok Gifts</label>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-gift" class="w-4 h-4 text-primary" />
                    <UBadge
                      v-if="trigger.matchAllGifts"
                      label="All gifts"
                      color="success"
                      variant="soft"
                      size="sm"
                    />
                    <span v-else>{{ getGiftNames(trigger) }}</span>
                  </div>
                </div>
                <div>
                  <label class="font-medium text-muted">Quantity Range</label>
                  <p>{{ formatQuantityRange(trigger) }}</p>
                </div>
                <div>
                  <label class="font-medium text-muted">Triggers Automation</label>
                  <p class="flex items-center gap-2">
                    <UIcon name="i-lucide-zap" class="w-4 h-4 text-purple-500" />
                    {{ getAutomationName(trigger.automationId) }}
                  </p>
                </div>
              </div>

              <div class="mt-3 text-sm text-muted">
                Created {{ formatDate(trigger.createdAt) }}
              </div>
            </div>

            <div class="flex items-center gap-2 ml-4">
              <!-- Toggle Enable/Disable -->
              <ConfirmAction
                :title="trigger.enabled ? 'Disable Trigger' : 'Enable Trigger'"
                :description="getToggleDescription(trigger)"
                :confirm-text="trigger.enabled ? 'Disable' : 'Enable'"
                :confirm-color="trigger.enabled ? 'warning' : 'success'"
                :confirm-icon="trigger.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
                @confirm="toggleTrigger(trigger)"
              >
                <UButton
                  :color="trigger.enabled ? 'neutral' : 'success'"
                  variant="soft"
                  size="sm"
                >
                  <UIcon
                    :name="trigger.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
                    class="w-4 h-4"
                  />
                </UButton>
              </ConfirmAction>

              <!-- Edit Button -->
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                @click="router.push(`/triggers/tiktok-gift/${trigger.id}`)"
              >
                <UIcon name="i-lucide-edit" class="w-4 h-4" />
              </UButton>

              <!-- Delete Button -->
              <ConfirmAction
                title="Delete Trigger"
                :description="getDeleteDescription(trigger.name)"
                confirm-text="Delete Trigger"
                confirm-color="error"
                confirm-icon="i-lucide-trash-2"
                @confirm="deleteTrigger(trigger.id, trigger.name)"
              >
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </UButton>
              </ConfirmAction>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Summary -->
      <div v-if="triggers.length" class="mt-8 p-4 rounded-lg bg-elevated/50 border border-accented">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-6">
            <span>
              <strong>{{ triggers.length }}</strong> total trigger{{ triggers.length !== 1 ? 's' : '' }}
            </span>
            <span>
              <strong>{{ triggers.filter(t => t.enabled).length }}</strong> enabled
            </span>
            <span>
              <strong>{{ triggers.filter(t => !t.enabled).length }}</strong> disabled
            </span>
          </div>
          <div class="text-muted">
            Last updated: {{ formatDate(triggers[0]?.updatedAt || new Date().toISOString()) }}
          </div>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>
