<script setup lang="ts">
import type { TiktokConfig } from "@cattyshack/shared/schemas/index";
import type { FormSubmitEvent } from "@nuxt/ui";

import { tiktokConfigSchema } from "@cattyshack/shared/schemas/index";

type Props = {
  tiktokConfig: Partial<TiktokConfig>;
};

const props = defineProps<Props>();

// Create a local reactive copy of the props that can be mutated by the form
const state = reactive<Partial<TiktokConfig>>({
  tiktok_handle: undefined,
  automations_enabled: true,
});

// Watch for prop changes and update local state
watch(() => props.tiktokConfig, (newConfig) => {
  state.tiktok_handle = newConfig.tiktok_handle;
  state.automations_enabled = newConfig.automations_enabled ?? true;
}, { immediate: true });

// Strip @ symbol from input as user types
watch(() => state.tiktok_handle, (newValue) => {
  if (newValue?.startsWith("@")) {
    state.tiktok_handle = newValue.slice(1);
  }
});

const toast = useToast();

// Save TikTok settings
async function saveTiktokSettings(event: FormSubmitEvent<TiktokConfig>) {
  try {
    await $fetch("/api/config/tiktok", {
      method: "POST",
      body: event.data,
    });

    // Refresh the config data to update the UI
    await refreshNuxtData("config");

    toast.add({
      title: "Settings Saved",
      description: "TikTok settings have been updated successfully",
      color: "success",
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save TikTok handle. Please try again.";
    toast.add({
      title: "Error",
      description: message,
      color: "error",
    });
  }
}
</script>

<template>
  <UCard variant="outline">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-video" class="w-6 h-6 text-purple-500" />
        <div>
          <h3 class="text-lg font-semibold">
            TikTok Integration
          </h3>
          <p class="text-sm text-muted">
            Connect your TikTok account for live stream automation
          </p>
        </div>
      </div>
    </template>

    <UForm
      :schema="tiktokConfigSchema"
      :state="state"
      class="space-y-4"
      @submit="saveTiktokSettings"
    >
      <UFormField
        label="Enable Automations"
        name="automations_enabled"
        help="Toggle to enable/disable all TikTok automation triggers. Changes will be picked up by the service within 5 minutes."
      >
        <div class="flex items-center gap-3">
          <USwitch v-model="state.automations_enabled" />
          <span class="text-sm font-medium" :class="state.automations_enabled ? 'text-success' : 'text-muted'">
            <UIcon
              :name="state.automations_enabled ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="w-4 h-4 inline mr-1"
            />
            {{ state.automations_enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </UFormField>

      <UFormField
        label="TikTok Handle"
        name="tiktok_handle"
        help="Your TikTok username without the @ symbol"
      >
        <UInput
          v-model="state.tiktok_handle"
          placeholder="username"
          icon="i-lucide-at-sign"
        />
      </UFormField>

      <div class="flex pt-4">
        <UButton type="submit" color="primary">
          <UIcon name="i-lucide-save" class="w-4 h-4 mr-2" />
          Save Settings
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
