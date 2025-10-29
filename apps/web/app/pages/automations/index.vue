<script setup lang="ts">
import type { AutomationAction, AutomationCreate, LightSelection } from "@cattyshack/shared/schemas";
import type { FormSubmitEvent } from "@nuxt/ui";

import { automationCreateSchema } from "@cattyshack/shared/schemas";

useHead({
  title: "Automations - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Create and manage your light automations",
    },
  ],
});

// Fetch lights from API
const { data: lightsResponse, status: lightsStatus, refresh: refreshLights } = await useAsyncData(
  "lights",
  () => $fetch<{ message: string; data: LightSelection[]; count: number }>("/api/lights"),
);

const availableLights = computed(() => lightsResponse.value?.data ?? []);
const isLoadingLights = computed(() => lightsStatus.value === "pending");

// Form state
const state = reactive<Partial<AutomationCreate>>({
  name: undefined,
  description: undefined,
  selectedLights: [],
  action: {
    type: "setBrightness",
    brightness: 75,
  } as AutomationAction,
  enabled: true,
});

const toast = useToast();

// Handle form submission
async function onSubmit(event: FormSubmitEvent<AutomationCreate>) {
  try {
    // Save automation to database
    await $fetch("/api/automation/hue", {
      method: "POST",
      body: event.data,
    });

    toast.add({
      title: "Success",
      description: `Automation "${event.data.name}" created successfully!`,
      color: "success",
    });

    // Reset form
    Object.assign(state, {
      name: undefined,
      description: undefined,
      selectedLights: [],
      action: {
        type: "setBrightness",
        brightness: 75,
      } as AutomationAction,
      enabled: true,
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create automation";
    toast.add({
      title: "Error",
      description: message,
      color: "error",
    });
  }
}

// Handle light selection
function toggleLightSelection(lightId: string) {
  if (!state.selectedLights) {
    state.selectedLights = [];
  }

  const index = state.selectedLights.indexOf(lightId);
  if (index === -1) {
    state.selectedLights.push(lightId);
  }
  else {
    state.selectedLights.splice(index, 1);
  }
}

// Check if light is selected
function isLightSelected(lightId: string): boolean {
  return state.selectedLights?.includes(lightId) ?? false;
}

// Get selected light names for display
const selectedLightNames = computed(() => {
  if (!state.selectedLights?.length)
    return [];
  return availableLights.value
    .filter(light => state.selectedLights!.includes(light.id))
    .map(light => light.name);
});

// Light type icon mapping
function getLightIcon(type: string): string {
  switch (type) {
    case "color": return "i-lucide-palette";
    case "dimmable": return "i-lucide-sun";
    case "white": return "i-lucide-lightbulb";
    default: return "i-lucide-lightbulb";
  }
}

// Light type color mapping
function getLightColor(type: string): "error" | "success" | "primary" | "secondary" | "info" | "warning" | "neutral" | undefined {
  switch (type) {
    case "color": return "primary";
    case "dimmable": return "warning";
    case "white": return "neutral";
    default: return "neutral";
  }
}

// Action type helper functions
function updateActionType(newType: string) {
  if (!state.action || state.action.type !== newType) {
    switch (newType) {
      case "setBrightness":
        state.action = { type: "setBrightness", brightness: 75 };
        break;
      case "incrementBrightness":
        state.action = {
          type: "incrementBrightness",
          increment: 10,
          decayConfig: {
            enabled: false,
            decayAmount: 5,
            decayInterval: 10000,
            addTimePerEvent: 10000,
            maxAccumulatedTime: 300000,
          },
        };
        break;
      case "setColor":
        state.action = { type: "setColor", color: "#FF0000" };
        break;
      case "randomColors":
        state.action = { type: "randomColors" };
        break;
    }
  }
}

// Action type options
const actionTypeOptions = [
  { label: "Set Brightness", value: "setBrightness", description: "Set lights to a specific brightness level", icon: "i-lucide-sun" },
  { label: "Adjust Brightness", value: "incrementBrightness", description: "Increase or decrease current brightness", icon: "i-lucide-plus" },
  { label: "Set Color", value: "setColor", description: "Change lights to a specific color", icon: "i-lucide-palette" },
  { label: "Random Colors", value: "randomColors", description: "Cycle through random colors", icon: "i-lucide-shuffle" },
];

// Get current action type
const currentActionType = computed(() => state.action?.type || "setBrightness");

// Check if selected lights support color
const hasColorLights = computed(() => {
  if (!state.selectedLights?.length)
    return false;
  return availableLights.value
    .filter(light => state.selectedLights!.includes(light.id))
    .some(light => light.type === "color");
});

// Get action description for preview
const actionDescription = computed(() => {
  if (!state.action)
    return "No action configured";

  switch (state.action.type) {
    case "setBrightness":
      return `Set brightness to ${state.action.brightness}%`;
    case "incrementBrightness": {
      let desc = state.action.increment > 0
        ? `Increase brightness by ${state.action.increment}%`
        : `Decrease brightness by ${Math.abs(state.action.increment)}%`;

      if (state.action.decayConfig?.enabled) {
        desc += ` with time-based decay (-${state.action.decayConfig.decayAmount}% every ${state.action.decayConfig.decayInterval / 1000}s)`;
      }

      return desc;
    }
    case "setColor":
      return `Set color to ${state.action.color}${state.action.brightness ? ` at ${state.action.brightness}% brightness` : ""}`;
    case "randomColors":
      return `Random colors${state.action.brightness ? ` at ${state.action.brightness}% brightness` : ""}${state.action.duration ? ` for ${state.action.duration}s` : ""}`;
    default:
      return "Unknown action";
  }
});
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight">
          Create Automation
        </h1>
        <p class="mt-2 text-lg text-muted">
          Set up automated lighting control for your stream
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form Section -->
        <div class="lg:col-span-2">
          <UForm
            :schema="automationCreateSchema"
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
                  <UCheckbox v-model="state.enabled" label="Enable this automation" />
                </UFormField>

                <UFormField
                  label="Automation Name"
                  name="name"
                  required
                >
                  <UInput
                    v-model="state.name"
                    placeholder="e.g., Donation Alert Lights"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Description"
                  name="description"
                  help="Optional description of what this automation does"
                >
                  <UTextarea
                    v-model="state.description"
                    placeholder="Briefly describe when and how this automation triggers..."
                    :rows="3"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Light Selection -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-yellow-500" />
                  <h3 class="text-lg font-semibold">
                    Select Lights
                  </h3>
                </div>
              </template>

              <UFormField
                name="selectedLights"
                label="Choose which lights to control"
                required
              >
                <!-- Loading State -->
                <div v-if="isLoadingLights" class="space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <USkeleton
                      v-for="i in 4"
                      :key="i"
                      class="h-20 w-full"
                    />
                  </div>
                </div>

                <!-- No Lights State -->
                <div v-else-if="!availableLights.length" class="text-center py-8">
                  <UIcon name="i-lucide-lightbulb-off" class="w-12 h-12 mx-auto mb-4 text-muted" />
                  <h3 class="text-lg font-semibold mb-2">
                    No Lights Found
                  </h3>
                  <p class="text-muted mb-4">
                    No lights were found on your Hue bridge. Please check your bridge connection.
                  </p>
                  <UButton variant="outline" @click="refreshLights()">
                    <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
                    Refresh
                  </UButton>
                </div>

                <!-- Lights Grid -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="light in availableLights"
                    :key="light.id"
                    class="relative"
                  >
                    <UCard
                      class="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      :class="[
                        isLightSelected(light.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:border-primary/50',
                      ]"
                      @click="toggleLightSelection(light.id)"
                    >
                      <div class="flex items-center gap-3">
                        <UIcon
                          :name="getLightIcon(light.type)"
                          class="w-5 h-5"
                          :class="[
                            light.on ? 'text-yellow-500' : 'text-gray-400',
                          ]"
                        />
                        <div class="flex-1">
                          <p class="font-medium">
                            {{ light.name }}
                          </p>
                          <div class="flex items-center gap-2 text-sm text-muted">
                            <UBadge
                              :label="light.type"
                              :color="getLightColor(light.type)"
                              variant="soft"
                              size="xs"
                            />
                            <UBadge
                              :label="light.on ? 'On' : 'Off'"
                              :color="light.on ? 'success' : 'neutral'"
                              variant="soft"
                              size="xs"
                            />
                            <UBadge
                              :label="`${light.brightness}%`"
                              color="info"
                              variant="soft"
                              size="xs"
                            />
                          </div>
                        </div>
                        <UCheckbox
                          :model-value="isLightSelected(light.id)"
                          @click.stop
                          @change="toggleLightSelection(light.id)"
                        />
                      </div>
                    </UCard>
                  </div>
                </div>
              </UFormField>
            </UCard>

            <!-- Action Configuration -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-zap" class="w-5 h-5 text-purple-500" />
                  <h3 class="text-lg font-semibold">
                    Action Configuration
                  </h3>
                </div>
              </template>

              <div class="space-y-6">
                <!-- Action Type Selection -->
                <UFormField
                  label="Action Type"
                  name="action.type"
                  required
                >
                  <URadioGroup
                    :model-value="currentActionType"
                    :items="actionTypeOptions"
                    value-key="value"
                    label-key="label"
                    class="space-y-3"
                    @update:model-value="updateActionType"
                  >
                    <template #label="{ item }">
                      <div class="flex items-start gap-3">
                        <UIcon :name="item.icon" class="w-5 h-5 mt-0.5 text-primary" />
                        <div>
                          <p class="font-medium">
                            {{ item.label }}
                          </p>
                        </div>
                      </div>
                    </template>
                  </URadioGroup>
                </UFormField>

                <!-- Action-specific Configuration -->
                <div class="space-y-4">
                  <!-- Set Brightness -->
                  <div v-if="state.action?.type === 'setBrightness'">
                    <UFormField
                      label="Brightness Level"
                      name="action.brightness"
                      :help="`Set brightness to ${state.action.brightness}%`"
                      required
                    >
                      <SliderWithInput
                        v-model="state.action.brightness"
                        :min="1"
                        :max="100"
                        :step="1"
                        suffix="%"
                        min-label="1% (Dim)"
                        mid-label="50% (Medium)"
                        max-label="100% (Bright)"
                      />
                    </UFormField>
                  </div>

                  <!-- Increment Brightness -->
                  <div v-else-if="state.action?.type === 'incrementBrightness'" class="space-y-6">
                    <UFormField
                      label="Brightness Adjustment"
                      name="action.increment"
                      :help="state.action.increment > 0 ? `Increase brightness by ${state.action.increment}%` : `Decrease brightness by ${Math.abs(state.action.increment)}%`"
                      required
                    >
                      <SliderWithInput
                        v-model="state.action.increment"
                        :min="-100"
                        :max="100"
                        :step="5"
                        suffix="%"
                        min-label="-100% (Decrease)"
                        mid-label="0% (No Change)"
                        max-label="+100% (Increase)"
                      />
                    </UFormField>

                    <!-- Time-Based Decay Configuration -->
                    <div class="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <div class="flex items-center justify-between mb-4">
                        <div>
                          <h4 class="font-semibold">
                            Time-Based Decay
                          </h4>
                          <p class="text-sm text-muted">
                            Gradually decrease brightness without donations
                          </p>
                        </div>
                        <UCheckbox
                          v-model="state.action.decayConfig!.enabled"
                          label="Enable"
                        />
                      </div>

                      <div v-if="state.action.decayConfig?.enabled" class="space-y-4">
                        <!-- Decay Amount -->
                        <UFormField
                          label="Decay Amount"
                          name="action.decayConfig.decayAmount"
                          :help="`Decrease by ${state.action.decayConfig.decayAmount}% each interval`"
                        >
                          <SliderWithInput
                            v-model="state.action.decayConfig.decayAmount"
                            :min="1"
                            :max="100"
                            :step="1"
                            suffix="%"
                            min-label="1% (Slow)"
                            mid-label="5% (Medium)"
                            max-label="100% (Fast)"
                          />
                        </UFormField>

                        <!-- Decay Interval -->
                        <UFormField
                          label="Decay Interval"
                          name="action.decayConfig.decayInterval"
                          :help="`Decrease every ${state.action.decayConfig.decayInterval / 1000} seconds`"
                        >
                          <UInput
                            :model-value="state.action.decayConfig.decayInterval / 1000"
                            type="number"
                            :min="1"
                            :max="60"
                            :step="1"
                            @update:model-value="state.action.decayConfig.decayInterval = $event * 1000"
                          >
                            <template #trailing>
                              <span class="text-gray-400 text-sm">seconds</span>
                            </template>
                          </UInput>
                        </UFormField>

                        <!-- Time Added Per Event -->
                        <UFormField
                          label="Time Added Per Donation"
                          name="action.decayConfig.addTimePerEvent"
                          :help="`Add ${state.action.decayConfig.addTimePerEvent / 1000}s per donation`"
                        >
                          <UInput
                            :model-value="state.action.decayConfig.addTimePerEvent / 1000"
                            type="number"
                            :min="1"
                            :max="60"
                            :step="1"
                            @update:model-value="state.action.decayConfig.addTimePerEvent = $event * 1000"
                          >
                            <template #trailing>
                              <span class="text-gray-400 text-sm">seconds</span>
                            </template>
                          </UInput>
                        </UFormField>

                        <!-- Max Accumulated Time (Optional) -->
                        <UFormField
                          label="Maximum Accumulated Time"
                          name="action.decayConfig.maxAccumulatedTime"
                          help="Cap how much time can accumulate"
                        >
                          <UInput
                            :model-value="(state.action.decayConfig!.maxAccumulatedTime || 300000) / 1000"
                            type="number"
                            :min="10"
                            :max="600"
                            :step="10"
                            @update:model-value="state.action.decayConfig!.maxAccumulatedTime = $event * 1000"
                          >
                            <template #trailing>
                              <span class="text-gray-400 text-sm">seconds</span>
                            </template>
                          </UInput>
                        </UFormField>

                        <!-- Visual Explanation -->
                        <UAlert
                          color="info"
                          variant="soft"
                          icon="i-lucide-info"
                        >
                          <template #title>
                            How It Works
                          </template>
                          <template #description>
                            <ul class="text-sm space-y-1 mt-2">
                              <li>• Each donation increases brightness by {{ state.action.increment }}%</li>
                              <li>• Each donation adds {{ state.action.decayConfig.addTimePerEvent / 1000 }}s to decay timer</li>
                              <li>• Every {{ state.action.decayConfig.decayInterval / 1000 }}s without donations, brightness decreases by {{ state.action.decayConfig.decayAmount }}%</li>
                              <li>• Game ends when brightness reaches 0% (lights stay responsive)</li>
                            </ul>
                          </template>
                        </UAlert>
                      </div>
                    </div>
                  </div>

                  <!-- Set Color -->
                  <div v-else-if="state.action?.type === 'setColor'" class="space-y-4">
                    <UFormField
                      label="Color"
                      name="action.color"
                      required
                    >
                      <div class="flex items-center gap-4">
                        <UPopover>
                          <UButton
                            :label="state.action.color"
                            color="neutral"
                            variant="outline"
                            class="w-full justify-start"
                          >
                            <template #leading>
                              <span
                                :style="{ backgroundColor: state.action.color }"
                                class="size-4 rounded-full border border-gray-300"
                              />
                            </template>
                          </UButton>
                          <template #content>
                            <UColorPicker v-model="state.action.color" class="p-2" />
                          </template>
                        </UPopover>
                      </div>
                    </UFormField>

                    <UAlert
                      color="info"
                      variant="soft"
                      icon="i-lucide-info"
                      description="Current brightness will be preserved when changing colors"
                    />
                  </div>

                  <!-- Random Colors -->
                  <div v-else-if="state.action?.type === 'randomColors'" class="space-y-4">
                    <UAlert
                      color="info"
                      variant="soft"
                      icon="i-lucide-info"
                      description="Lights will cycle through random colors while preserving current brightness"
                    />
                  </div>
                </div>

                <!-- Color Light Requirement Warning -->
                <UAlert
                  v-if="(currentActionType === 'setColor' || currentActionType === 'randomColors') && !hasColorLights"
                  color="warning"
                  variant="soft"
                  title="Color actions require color-capable lights"
                  description="Please select at least one color light to use color-based actions."
                  icon="i-lucide-palette"
                />
              </div>
            </UCard>

            <!-- Submit Button -->
            <div class="flex gap-3">
              <UButton
                type="submit"
                size="lg"
                class="flex-1"
              >
                Create Automation
              </UButton>
              <UButton
                variant="outline"
                size="lg"
                @click="$router.push('/')"
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
              <!-- Automation Name -->
              <div>
                <label class="text-sm font-medium text-muted">Name</label>
                <p class="mt-1 font-medium">
                  {{ state.name || 'Unnamed Automation' }}
                </p>
              </div>

              <!-- Selected Lights -->
              <div>
                <label class="text-sm font-medium text-muted">Selected Lights</label>
                <div class="mt-1 space-x-2">
                  <UBadge
                    v-for="lightName in selectedLightNames"
                    :key="lightName"
                    :label="lightName"
                    color="primary"
                    variant="soft"
                    size="sm"
                  />
                  <p v-if="!selectedLightNames.length" class="text-sm text-muted italic">
                    No lights selected
                  </p>
                </div>
              </div>

              <!-- Action Description -->
              <div>
                <label class="text-sm font-medium text-muted">Action</label>
                <p class="mt-1 text-sm">
                  {{ actionDescription }}
                </p>
              </div>

              <!-- Description -->
              <div v-if="state.description">
                <label class="text-sm font-medium text-muted">Description</label>
                <p class="mt-1 text-sm">
                  {{ state.description }}
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>
