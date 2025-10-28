<script setup lang="ts">
import type { HueConfig } from "@cattyshack/shared/schemas/index";
import type { FormSubmitEvent } from "@nuxt/ui";

import { hueConfigSchema } from "@cattyshack/shared/schemas/index";

type Props = {
  hueConfig: Partial<HueConfig>;
};

const props = defineProps<Props>();

// API Response Types
type HueSetupResponse = {
  success: boolean;
  message?: string;
  config?: {
    hue_ip: string;
    hue_username: string;
  };
  error?: string;
  requiresButtonPress?: boolean;
  ip?: string;
};

type HueTestResponse = {
  success: boolean;
  message?: string;
  config?: {
    hue_ip: string;
  };
  error?: string;
};

// Create a local reactive copy of the props that can be mutated by the form
const state = reactive<Partial<HueConfig>>({
  hue_ip: undefined,
  hue_username: undefined,
  hue_password: undefined,
});

// Watch for prop changes and update local state
watch(() => props.hueConfig, (newConfig) => {
  state.hue_ip = newConfig.hue_ip;
  state.hue_username = newConfig.hue_username;
  state.hue_password = newConfig.hue_password;
}, { immediate: true });

const toast = useToast();
// Auto-setup Hue bridge (discovery + user creation)
const isSettingUpBridge = ref(false);
const setupButtonText = ref("Auto-Setup Bridge");

// Save Hue settings
async function saveHueSettings(event: FormSubmitEvent<HueConfig>) {
  try {
    await $fetch("/api/config/hue", {
      method: "POST",
      body: event.data,
    });

    // Refresh the config data to update the UI
    await refreshNuxtData("config");

    toast.add({
      title: "Settings Saved",
      description: "Hue bridge settings have been updated successfully",
      color: "success",
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save Hue settings. Please try again.";
    toast.add({
      title: "Error",
      description: message,
      color: "error",
    });
  }
}

async function autoSetupHueBridge() {
  isSettingUpBridge.value = true;
  setupButtonText.value = "Setting up...";

  try {
    await $fetch<HueSetupResponse>("/api/config/hue/setup", {
      method: "POST",
    });

    // Refresh the config data to update the UI with new credentials
    await refreshNuxtData("config");

    toast.add({
      title: "Bridge Setup Complete!",
      description: "Hue bridge has been discovered and configured automatically.",
      color: "success",
    });
  }
  catch (error: unknown) {
    // Check if it's a button press error (400 status with requiresButtonPress data)
    const isButtonPressError = error && typeof error === "object" && "statusCode" in error
      && error.statusCode === 400 && "data" in error
      && error.data && typeof error.data === "object" && "requiresButtonPress" in error.data;

    if (isButtonPressError) {
      toast.add({
        title: "Press Bridge Button",
        description: error instanceof Error ? error.message : "Please press the button on your Hue bridge and try again.",
        color: "warning",
      });
      setupButtonText.value = "Press bridge button & try again";
    }
    else {
      toast.add({
        title: "Bridge Setup Failed",
        description: error instanceof Error ? error.message : "Unable to reach the setup service. Please try again.",
        color: "error",
      });
      setupButtonText.value = "Auto-Setup Bridge";
    }
  }
  finally {
    isSettingUpBridge.value = false;
    setTimeout(() => {
      setupButtonText.value = "Auto-Setup Bridge";
    }, 5000);
  }
}

// Test Hue connection
async function testHueConnection() {
  try {
    const result = await $fetch<HueTestResponse>("/api/config/hue/test", {
      method: "POST",
    });
    toast.add({
      title: "Connection Successful",
      description: `Hue bridge connected to ${result.config?.hue_ip}`,
      color: "success",
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to test Hue bridge connection.";
    toast.add({
      title: "Connection Error",
      description: message,
      color: "error",
    });
  }
}

// Clear Hue settings
async function clearHueSettings() {
  try {
    await $fetch("/api/config/hue/clear", {
      method: "POST",
    });

    // Clear the local form state
    state.hue_ip = undefined;
    state.hue_username = undefined;
    state.hue_password = undefined;

    // Refresh the config data
    await refreshNuxtData("config");

    toast.add({
      title: "Settings Cleared",
      description: "Hue bridge configuration has been removed",
      color: "success",
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to clear settings";
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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-lightbulb" class="w-6 h-6 text-yellow-500" />
          <div>
            <h3 class="text-lg font-semibold">
              Philips Hue Bridge
            </h3>
            <p class="text-sm text-muted">
              Configure your Hue bridge connection for smart lighting automation
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Auto-setup section -->
    <div class="p-4 mb-4 rounded-lg bg-elevated/50 border border-accented">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-zap" class="w-5 h-5 text-primary mt-0.5" />
        <div class="flex-1">
          <h4 class="font-medium text-sm">
            Automatic Setup
          </h4>
          <p class="text-xs text-muted mt-1">
            Let us discover your Hue bridge and set up credentials automatically.
            You'll need to press the button on your bridge when prompted.
          </p>
          <UButton
            :loading="isSettingUpBridge"
            color="primary"
            variant="soft"
            size="sm"
            class="mt-3"
            @click="autoSetupHueBridge"
          >
            <UIcon name="i-lucide-search" class="w-4 h-4 mr-2" />
            {{ setupButtonText }}
          </UButton>
        </div>
      </div>
    </div>

    <UForm
      :schema="hueConfigSchema"
      :state="state"
      class="space-y-4"
      @submit="saveHueSettings"
    >
      <UFormField
        label="Bridge IP Address"
        name="hue_ip"
        help="The IP address of your Hue bridge on your local network"
      >
        <UInput
          v-model="state.hue_ip"
          placeholder="192.168.1.100"
          icon="i-lucide-wifi"
        />
      </UFormField>

      <UFormField
        label="Username"
        name="hue_username"
        help="The username created when you first paired with the bridge"
      >
        <UInput
          v-model="state.hue_username"
          placeholder="hue-bridge-username"
          icon="i-lucide-user"
        />
      </UFormField>

      <UFormField
        label="Password"
        name="hue_password"
        help="The password for your Hue bridge (if applicable)"
      >
        <UInput
          v-model="state.hue_password"
          type="password"
          placeholder="Optional"
          icon="i-lucide-lock"
        />
      </UFormField>

      <div class="flex flex-col gap-4 pt-4">
        <!-- Manual controls -->
        <div class="flex gap-3">
          <UButton type="submit" color="primary">
            <UIcon name="i-lucide-save" class="w-4 h-4 mr-2" />
            Save Settings
          </UButton>

          <UButton
            color="neutral"
            variant="outline"
            @click="testHueConnection"
          >
            <UIcon name="i-lucide-wifi" class="w-4 h-4 mr-2" />
            Test Connection
          </UButton>

          <UButton
            color="neutral"
            variant="ghost"
            @click="clearHueSettings"
          >
            <UIcon name="i-lucide-trash-2" class="w-4 h-4 mr-2" />
            Clear Settings
          </UButton>
        </div>
      </div>
    </UForm>
  </UCard>
</template>
