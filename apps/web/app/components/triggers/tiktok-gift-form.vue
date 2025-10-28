<script setup lang="ts">
import type { HueAutomation } from "@cattyshack/shared/db/schema";
import type { TikTokGiftTriggerCreate } from "@cattyshack/shared/schemas";
import type { FormSubmitEvent } from "@nuxt/ui";

import { TIKTOK_GIFTS } from "@cattyshack/shared/constants/tiktok-gifts";
import { tiktokGiftTriggerCreateSchema } from "@cattyshack/shared/schemas";

type Props = {
  mode: "create" | "edit";
  triggerId?: string;
  initialData?: Partial<TikTokGiftTriggerCreate>;
};

const props = defineProps<Props>();

const router = useRouter();
const toast = useToast();

// Fetch automations for dropdown
const { data: automationsResponse, status: automationsStatus } = await useAsyncData(
  "automations-for-trigger-form",
  () => $fetch<{ message: string; data: HueAutomation[]; count: number }>("/api/automation/hue"),
);

const availableAutomations = computed(() => automationsResponse.value?.data ?? []);
const isLoadingAutomations = computed(() => automationsStatus.value === "pending");

// Form state
const state = reactive<Partial<TikTokGiftTriggerCreate>>({
  name: props.initialData?.name ?? undefined,
  giftIds: props.initialData?.giftIds ?? [],
  matchAllGifts: props.initialData?.matchAllGifts ?? false,
  minQuantity: props.initialData?.minQuantity ?? undefined,
  maxQuantity: props.initialData?.maxQuantity ?? undefined,
  automationId: props.initialData?.automationId ?? undefined,
  enabled: props.initialData?.enabled ?? true,
});

// Watch for matchAllGifts changes - clear selections when enabled
watch(() => state.matchAllGifts, (matchAll) => {
  if (matchAll) {
    state.giftIds = [];
  }
});

// Gift options for dropdown
const giftOptions = computed(() => {
  if (!TIKTOK_GIFTS || !Array.isArray(TIKTOK_GIFTS)) {
    return [];
  }
  return TIKTOK_GIFTS.map(gift => ({
    label: gift.name,
    value: gift.id,
  }));
});

// Get selected gift names for preview
const selectedGiftNames = computed(() => {
  if (state.matchAllGifts) {
    return ["All gifts"];
  }
  if (!state.giftIds || state.giftIds.length === 0) {
    return ["No gifts selected"];
  }
  return state.giftIds.map((id) => {
    const gift = TIKTOK_GIFTS.find(g => g.id === id);
    return gift?.name || `Unknown (${id})`;
  });
});

// Automation options for select
const automationOptions = computed(() => {
  if (!availableAutomations.value || !Array.isArray(availableAutomations.value)) {
    return [];
  }
  return availableAutomations.value.map(auto => ({
    label: auto.name,
    value: auto.id,
    description: getActionDescription(auto),
  }));
});

// Get action description for automation
function getActionDescription(automation: HueAutomation): string {
  try {
    const action = JSON.parse(automation.actionConfig);
    switch (action.type) {
      case "setBrightness":
        return `Set brightness to ${action.brightness}%`;
      case "incrementBrightness":
        return action.increment > 0
          ? `Increase brightness by ${action.increment}%`
          : `Decrease brightness by ${Math.abs(action.increment)}%`;
      case "setColor":
        return `Set color to ${action.color}`;
      case "randomColors":
        return "Random colors";
      default:
        return "Unknown action";
    }
  }
  catch {
    return "Invalid action";
  }
}

// Handle form submission
async function onSubmit(event: FormSubmitEvent<TikTokGiftTriggerCreate>) {
  try {
    if (props.mode === "create") {
      await $fetch("/api/triggers/tiktok-gift", {
        method: "POST",
        body: event.data,
      });

      toast.add({
        title: "Success",
        description: `Trigger "${event.data.name}" created successfully!`,
        color: "success",
      });
    }
    else {
      await $fetch(`/api/triggers/tiktok-gift/${props.triggerId}`, {
        method: "PUT",
        body: event.data,
      });

      toast.add({
        title: "Success",
        description: `Trigger "${event.data.name}" updated successfully!`,
        color: "success",
      });
    }

    // Navigate to triggers list
    router.push("/triggers/tiktok-gift");
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Failed to ${props.mode} trigger`;
    toast.add({
      title: "Error",
      description: message,
      color: "error",
    });
  }
}

// Get selected automation name for preview
const selectedAutomationName = computed(() => {
  if (!state.automationId)
    return "No automation selected";
  const automation = availableAutomations.value.find(a => a.id === state.automationId);
  return automation?.name || "Unknown automation";
});

// Format quantity range for preview
const quantityRangePreview = computed(() => {
  if (!state.minQuantity && !state.maxQuantity) {
    return "Any quantity";
  }
  if (state.minQuantity && state.maxQuantity) {
    return `${state.minQuantity}-${state.maxQuantity}`;
  }
  if (state.minQuantity) {
    return `${state.minQuantity}+`;
  }
  if (state.maxQuantity) {
    return `≤ ${state.maxQuantity}`;
  }
  return "Any quantity";
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Form Section -->
    <div class="lg:col-span-2">
      <UForm
        :schema="tiktokGiftTriggerCreateSchema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Basic Information -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500" />
              <h3 class="text-lg font-semibold">
                Basic Information
              </h3>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField name="enabled">
              <UCheckbox v-model="state.enabled" label="Enable this trigger" />
            </UFormField>

            <UFormField
              label="Trigger Name"
              name="name"
              required
            >
              <UInput
                v-model="state.name"
                placeholder="e.g., Small Rose Gifts"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- TikTok Gift Configuration -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-gift" class="w-5 h-5 text-pink-500" />
              <h3 class="text-lg font-semibold">
                TikTok Gift
              </h3>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField name="matchAllGifts">
              <UCheckbox
                v-model="state.matchAllGifts"
                label="Match all gifts"
                help="Trigger on any gift received, regardless of type"
              />
            </UFormField>

            <UFormField
              label="Select Gifts"
              name="giftIds"
              :help="state.matchAllGifts ? 'Disabled when matching all gifts' : 'Choose which TikTok gifts will trigger this automation (up to 10)'"
              :required="!state.matchAllGifts"
            >
              <USelectMenu
                v-model="state.giftIds"
                :items="giftOptions"
                value-key="value"
                placeholder="Select gifts..."
                multiple
                :disabled="state.matchAllGifts"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Minimum Quantity (Optional)"
                name="minQuantity"
                help="Minimum number of gifts to trigger"
              >
                <UInput
                  v-model.number="state.minQuantity"
                  type="number"
                  :min="0"
                  placeholder="0"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Maximum Quantity (Optional)"
                name="maxQuantity"
                help="Maximum number of gifts to trigger"
              >
                <UInput
                  v-model.number="state.maxQuantity"
                  type="number"
                  :min="1"
                  placeholder="10"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UAlert
              v-if="state.matchAllGifts"
              color="success"
              variant="soft"
              title="All Gifts Mode"
              description="This trigger will fire for ANY gift received during the stream."
              icon="i-lucide-check-circle"
            />
            <UAlert
              v-else-if="state.giftIds && state.giftIds.length > 0"
              color="info"
              variant="soft"
              title="Multiple Gifts Selected"
              :description="`This trigger will fire when any of the ${state.giftIds.length} selected gifts are received.`"
              icon="i-lucide-info"
            />
            <UAlert
              v-if="!state.minQuantity && !state.maxQuantity"
              color="info"
              variant="soft"
              title="Quantity Range"
              description="Leaving both fields empty will trigger for any quantity."
              icon="i-lucide-info"
            />
          </div>
        </UCard>

        <!-- Automation Selection -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-zap" class="w-5 h-5 text-purple-500" />
              <h3 class="text-lg font-semibold">
                Select Automation
              </h3>
            </div>
          </template>

          <UFormField
            label="Automation to Trigger"
            name="automationId"
            help="Choose which automation will be executed when this gift is received"
            required
          >
            <!-- Loading State -->
            <div v-if="isLoadingAutomations" class="py-4">
              <USkeleton class="h-10 w-full" />
            </div>

            <!-- No Automations State -->
            <div v-else-if="!availableAutomations.length" class="text-center py-8">
              <UIcon name="i-lucide-zap-off" class="w-12 h-12 mx-auto mb-4 text-muted" />
              <h3 class="text-lg font-semibold mb-2">
                No Automations Found
              </h3>
              <p class="text-muted mb-4">
                Create an automation first before setting up triggers.
              </p>
              <UButton
                variant="outline"
                @click="router.push('/automations')"
              >
                <UIcon name="i-lucide-plus" class="w-4 h-4 mr-2" />
                Create Automation
              </UButton>
            </div>

            <!-- Automation Selection -->
            <USelect
              v-else-if="automationOptions.length > 0"
              v-model="state.automationId"
              :items="automationOptions"
              placeholder="Select an automation..."
              value-key="value"
              description-key="description"
              class="w-full"
            />
          </UFormField>
        </UCard>

        <!-- Submit Button -->
        <div class="flex gap-3">
          <UButton
            type="submit"
            size="lg"
            class="flex-1"
            :disabled="!availableAutomations.length"
          >
            {{ mode === "create" ? "Create Trigger" : "Update Trigger" }}
          </UButton>
          <UButton
            variant="outline"
            size="lg"
            @click="router.push('/triggers/tiktok-gift')"
          >
            Cancel
          </UButton>
        </div>
      </UForm>
    </div>

    <!-- Preview Section -->
    <div class="lg:col-span-1">
      <UCard class="sticky top-8">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-eye" class="w-5 h-5 text-purple-500" />
            <h3 class="text-lg font-semibold">
              Preview
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Status -->
          <div>
            <label class="text-sm font-medium text-muted">Status</label>
            <div class="mt-1">
              <UBadge
                :label="state.enabled ? 'Enabled' : 'Disabled'"
                :color="state.enabled ? 'success' : 'neutral'"
                variant="soft"
              />
            </div>
          </div>

          <!-- Trigger Name -->
          <div>
            <label class="text-sm font-medium text-muted">Name</label>
            <p class="mt-1 font-medium">
              {{ state.name || 'Unnamed Trigger' }}
            </p>
          </div>

          <!-- Gift Info -->
          <div>
            <label class="text-sm font-medium text-muted">TikTok Gifts</label>
            <div v-if="state.matchAllGifts" class="mt-1">
              <UBadge
                label="All Gifts"
                color="success"
                variant="soft"
              />
            </div>
            <div v-else-if="state.giftIds && state.giftIds.length > 0" class="mt-1 space-y-1">
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="name in selectedGiftNames"
                  :key="name"
                  :label="name"
                  color="primary"
                  variant="soft"
                />
              </div>
              <p class="text-muted text-sm">
                {{ state.giftIds.length }} gift{{ state.giftIds.length !== 1 ? 's' : '' }} selected
              </p>
            </div>
            <p v-else class="mt-1 text-muted">
              No gifts selected
            </p>
          </div>

          <!-- Quantity Range -->
          <div>
            <label class="text-sm font-medium text-muted">Quantity Range</label>
            <p class="mt-1">
              {{ quantityRangePreview }}
            </p>
          </div>

          <!-- Linked Automation -->
          <div>
            <label class="text-sm font-medium text-muted">Triggers Automation</label>
            <p class="mt-1">
              {{ selectedAutomationName }}
            </p>
          </div>

          <!-- Trigger Flow -->
          <div class="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p class="text-sm font-medium mb-2">
              Trigger Flow:
            </p>
            <div class="flex flex-col gap-2 text-sm">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-gift" class="w-4 h-4 text-pink-500" />
                <span v-if="state.matchAllGifts" class="font-medium">Any gift received</span>
                <span v-else-if="state.giftIds && state.giftIds.length > 0">
                  {{ selectedGiftNames.join(' OR ') }} received
                </span>
                <span v-else class="text-muted">No gift selected</span>
              </div>
              <div class="flex items-center gap-2 pl-2">
                <UIcon name="i-lucide-arrow-down" class="w-4 h-4 text-muted" />
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-filter" class="w-4 h-4 text-blue-500" />
                <span>Quantity: {{ quantityRangePreview }}</span>
              </div>
              <div class="flex items-center gap-2 pl-2">
                <UIcon name="i-lucide-arrow-down" class="w-4 h-4 text-muted" />
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-zap" class="w-4 h-4 text-purple-500" />
                <span class="font-medium">{{ selectedAutomationName }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
