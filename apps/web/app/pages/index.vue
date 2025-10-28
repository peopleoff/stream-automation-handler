<script setup lang="ts">
import type { HueAutomation, TikTokGiftTrigger } from "@cattyshack/shared/db/schema";

useHead({
  title: "Dashboard - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Manage your automations and live stream integrations",
    },
  ],
});

// Fetch automations from API
const { data: automationsResponse, status: automationsStatus } = await useAsyncData(
  "dashboard-automations",
  () => $fetch<{ message: string; data: HueAutomation[]; count: number }>("/api/automation/hue"),
);

// Fetch triggers from API
const { data: triggersResponse, status: triggersStatus } = await useAsyncData(
  "dashboard-triggers",
  () => $fetch<{ message: string; data: TikTokGiftTrigger[]; count: number }>("/api/triggers/tiktok-gift"),
);

const automations = computed(() => automationsResponse.value?.data ?? []);
const triggers = computed(() => triggersResponse.value?.data ?? []);
const isLoadingAutomations = computed(() => automationsStatus.value === "pending");
const isLoadingTriggers = computed(() => triggersStatus.value === "pending");

// Stats calculations
const enabledAutomations = computed(() => automations.value.filter(a => a.enabled).length);
const enabledTriggers = computed(() => triggers.value.filter(t => t.enabled).length);

const router = useRouter();

// Reference to automation runs table component
const automationRunsTable = ref();
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p class="mt-2 text-lg text-muted">
              Manage your automations and stream integrations
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Event Service Status -->
        <DashboardEventServiceStatus />

        <!-- Automations Stats -->
        <UCard>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-zap" class="w-5 h-5 text-purple-500" />
                <h3 class="text-lg font-semibold">
                  Automations
                </h3>
              </div>
              <div v-if="isLoadingAutomations" class="space-y-2">
                <USkeleton class="h-8 w-20" />
                <USkeleton class="h-4 w-32" />
              </div>
              <div v-else>
                <p class="text-3xl font-bold">
                  {{ automations.length }}
                </p>
                <p class="text-sm text-muted mt-1">
                  {{ enabledAutomations }} enabled
                </p>
              </div>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              @click="router.push('/automations/manage')"
            >
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </UButton>
          </div>
        </UCard>

        <!-- Triggers Stats -->
        <UCard>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-gift" class="w-5 h-5 text-pink-500" />
                <h3 class="text-lg font-semibold">
                  Triggers
                </h3>
              </div>
              <div v-if="isLoadingTriggers" class="space-y-2">
                <USkeleton class="h-8 w-20" />
                <USkeleton class="h-4 w-32" />
              </div>
              <div v-else>
                <p class="text-3xl font-bold">
                  {{ triggers.length }}
                </p>
                <p class="text-sm text-muted mt-1">
                  {{ enabledTriggers }} enabled
                </p>
              </div>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              @click="router.push('/triggers/tiktok-gift')"
            >
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </UButton>
          </div>
        </UCard>

        <!-- Settings Card -->
        <UCard>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-lucide-settings" class="w-5 h-5 text-blue-500" />
                <h3 class="text-lg font-semibold">
                  Settings
                </h3>
              </div>
              <p class="text-sm text-muted mt-1">
                Configure Hue bridge and TikTok settings
              </p>
            </div>
            <UButton
              color="neutral"
              variant="soft"
              size="sm"
              @click="router.push('/settings')"
            >
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Recent Automation Runs -->
      <div class="mt-8">
        <AutomationRunsTable ref="automationRunsTable" />
      </div>
    </UContainer>
  </UMain>
</template>
