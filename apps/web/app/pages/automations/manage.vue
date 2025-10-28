<script setup lang="ts">
import type { HueAutomation } from "@cattyshack/shared/db/schema";

useHead({
  title: "Manage Automations - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "View and manage your automation rules",
    },
  ],
});

// Fetch automations from API
const { data: automationsResponse, status, refresh } = await useAsyncData(
  "automations",
  () => $fetch<{ message: string; data: HueAutomation[]; count: number }>("/api/automation/hue"),
);

const automations = computed(() => automationsResponse.value?.data ?? []);
const isLoading = computed(() => status.value === "pending");

const toast = useToast();
const router = useRouter();

// Delete automation
async function deleteAutomation(id: number, name: string) {
  try {
    await $fetch(`/api/automation/hue/${id}`, {
      method: "DELETE",
    });

    toast.add({
      title: "Automation Deleted",
      description: `"${name}" has been deleted successfully`,
      color: "success",
    });

    // Refresh the list
    await refresh();
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete automation";
    toast.add({
      title: "Delete Failed",
      description: message,
      color: "error",
    });
  }
}

// Toggle automation enabled state
async function toggleAutomation(automation: HueAutomation) {
  try {
    // Parse the existing automation data
    const actionConfig = JSON.parse(automation.actionConfig);
    const selectedLights = JSON.parse(automation.selectedLights);

    const updateData = {
      name: automation.name,
      description: automation.description,
      enabled: !automation.enabled,
      action: actionConfig,
      selectedLights,
    };

    await $fetch(`/api/automation/hue/${automation.id}`, {
      method: "PUT",
      body: updateData,
    });

    toast.add({
      title: automation.enabled ? "Automation Disabled" : "Automation Enabled",
      description: `"${automation.name}" has been ${automation.enabled ? "disabled" : "enabled"}`,
      color: "success",
    });

    // Refresh the list
    await refresh();
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update automation";
    toast.add({
      title: "Update Failed",
      description: message,
      color: "error",
    });
  }
}

// Test automation
async function testAutomation(automation: HueAutomation) {
  try {
    const result = await $fetch<{
      message: string;
      data: {
        automationId: number;
        automationName: string;
        totalLights: number;
        successfulLights: number;
        failedLights: number;
        results: Array<{ lightId: string; success: boolean; error?: string }>;
      };
    }>(`/api/automation/hue/${automation.id}/test`, {
      method: "POST",
    });

    const { data } = result;

    if (data.failedLights > 0) {
      toast.add({
        title: "Test Completed with Issues",
        description: `${data.successfulLights}/${data.totalLights} lights responded successfully`,
        color: "warning",
      });
    }
    else {
      toast.add({
        title: "Test Successful",
        description: `All ${data.totalLights} lights responded successfully`,
        color: "success",
      });
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to test automation";
    toast.add({
      title: "Test Failed",
      description: message,
      color: "error",
    });
  }
}

// Get action description for display
function getActionDescription(automation: HueAutomation): string {
  try {
    const action = JSON.parse(automation.actionConfig);
    switch (action.type) {
      case "setBrightness":
        return `Set brightness to ${action.brightness}%`;
      case "incrementBrightness": {
        let desc = action.increment > 0
          ? `Increase brightness by ${action.increment}%`
          : `Decrease brightness by ${Math.abs(action.increment)}%`;

        if (action.decayConfig?.enabled) {
          desc += " (with decay)";
        }

        return desc;
      }
      case "setColor":
        return `Set color to ${action.color}${action.brightness ? ` at ${action.brightness}%` : ""}`;
      case "randomColors":
        return `Random colors${action.brightness ? ` at ${action.brightness}%` : ""}${action.duration ? ` for ${action.duration}s` : ""}`;
      default:
        return "Unknown action";
    }
  }
  catch {
    return "Invalid action config";
  }
}

// Get selected lights count
function getLightsCount(automation: HueAutomation): number {
  try {
    const lights = JSON.parse(automation.selectedLights);
    return Array.isArray(lights) ? lights.length : 0;
  }
  catch {
    return 0;
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

function getToggleDescription(automation: HueAutomation): string {
  return automation.enabled
    ? `Are you sure you want to disable "${automation.name}"? It will stop running automatically.`
    : `Are you sure you want to enable "${automation.name}"? It will start running automatically.`;
}

function getTestDescription(automation: HueAutomation): string {
  return `Test "${automation.name}" by running it on the selected lights. This will execute the automation action immediately.`;
}
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              Manage Automations
            </h1>
            <p class="mt-2 text-lg text-muted">
              View, edit, and manage your automation rules
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
              @click="router.push('/automations')"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
              New Automation
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
      <div v-else-if="!automations.length" class="text-center py-12">
        <UIcon name="i-lucide-zap-off" class="w-16 h-16 mx-auto mb-4 text-muted" />
        <h3 class="text-xl font-semibold mb-2">
          No Automations Found
        </h3>
        <p class="text-muted mb-6">
          Get started by creating your first automation rule.
        </p>
        <UButton
          color="primary"
          @click="router.push('/automations')"
        >
          <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
          Create First Automation
        </UButton>
      </div>

      <!-- Automations List -->
      <div v-else class="space-y-4">
        <UCard
          v-for="automation in automations"
          :key="automation.id"
          class="hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold">
                  {{ automation.name }}
                </h3>
                <UBadge
                  :label="automation.enabled ? 'Enabled' : 'Disabled'"
                  :color="automation.enabled ? 'success' : 'neutral'"
                  variant="soft"
                />
                <UBadge
                  :label="automation.actionType"
                  color="primary"
                  variant="soft"
                  size="sm"
                />
              </div>

              <p v-if="automation.description" class="text-muted mb-3">
                {{ automation.description }}
              </p>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label class="font-medium text-muted">Action</label>
                  <p>{{ getActionDescription(automation) }}</p>
                </div>
                <div>
                  <label class="font-medium text-muted">Lights</label>
                  <p>{{ getLightsCount(automation) }} light{{ getLightsCount(automation) !== 1 ? 's' : '' }} selected</p>
                </div>
                <div>
                  <label class="font-medium text-muted">Created</label>
                  <p>{{ formatDate(automation.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-4">
              <!-- Toggle Enable/Disable -->
              <ConfirmAction
                :title="automation.enabled ? 'Disable Automation' : 'Enable Automation'"
                :description="getToggleDescription(automation)"
                :confirm-text="automation.enabled ? 'Disable' : 'Enable'"
                :confirm-color="automation.enabled ? 'warning' : 'success'"
                :confirm-icon="automation.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
                @confirm="toggleAutomation(automation)"
              >
                <UButton
                  :color="automation.enabled ? 'neutral' : 'success'"
                  variant="soft"
                  size="sm"
                >
                  <UIcon
                    :name="automation.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
                    class="w-4 h-4"
                  />
                </UButton>
              </ConfirmAction>

              <!-- Test Button -->
              <ConfirmAction
                title="Test Automation"
                :description="getTestDescription(automation)"
                confirm-text="Run Test"
                confirm-color="primary"
                confirm-icon="i-lucide-play-circle"
                @confirm="testAutomation(automation)"
              >
                <UButton
                  color="primary"
                  variant="outline"
                  size="sm"
                >
                  <UIcon name="i-lucide-play-circle" class="w-4 h-4" />
                </UButton>
              </ConfirmAction>

              <!-- Edit Button -->
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                @click="router.push(`/automations/${automation.id}`)"
              >
                <UIcon name="i-lucide-edit" class="w-4 h-4" />
              </UButton>

              <!-- Delete Button -->
              <ConfirmAction
                title="Delete Automation"
                :description="getDeleteDescription(automation.name)"
                confirm-text="Delete Automation"
                confirm-color="error"
                confirm-icon="i-lucide-trash-2"
                @confirm="deleteAutomation(automation.id, automation.name)"
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
      <div v-if="automations.length" class="mt-8 p-4 rounded-lg bg-elevated/50 border border-accented">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-6">
            <span>
              <strong>{{ automations.length }}</strong> total automation{{ automations.length !== 1 ? 's' : '' }}
            </span>
            <span>
              <strong>{{ automations.filter(a => a.enabled).length }}</strong> enabled
            </span>
            <span>
              <strong>{{ automations.filter(a => !a.enabled).length }}</strong> disabled
            </span>
          </div>
          <div class="text-muted">
            Last updated: {{ formatDate(automations[0]?.updatedAt || new Date().toISOString()) }}
          </div>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>
