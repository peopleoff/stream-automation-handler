<script setup lang="ts">
import type { TikTokGiftTrigger } from "@cattyshack/shared/db/schema";

useHead({
  title: "Triggers - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Manage your automation triggers for TikTok Live stream events",
    },
  ],
});

const router = useRouter();

// Fetch TikTok gift triggers for count
const { data: giftTriggersResponse, status: giftTriggersStatus } = await useAsyncData(
  "tiktok-gift-triggers-count",
  () => $fetch<{ message: string; data: TikTokGiftTrigger[]; count: number }>("/api/triggers/tiktok-gift"),
);

const giftTriggersCount = computed(() => giftTriggersResponse.value?.count ?? 0);
const activeGiftTriggersCount = computed(() =>
  giftTriggersResponse.value?.data?.filter(t => t.enabled).length ?? 0,
);
const isLoadingGiftTriggers = computed(() => giftTriggersStatus.value === "pending");

// Trigger types configuration
const triggerTypes = computed(() => [
  {
    id: "tiktok-gift",
    name: "TikTok Gift Triggers",
    description: "Trigger automations when viewers send specific gifts during your live stream",
    icon: "i-lucide-gift",
    color: "primary" as const,
    status: "active" as const,
    path: "/triggers/tiktok-gift",
    count: giftTriggersCount.value,
    activeCount: activeGiftTriggersCount.value,
  },
]);

// Navigate to trigger management
function navigateToTrigger(trigger: typeof triggerTypes.value[0]) {
  if (trigger.path) {
    router.push(trigger.path);
  }
}

// Get status badge color
function getStatusColor(status: "active" | "coming-soon") {
  return status === "active" ? "success" : "neutral";
}

// Get status badge label
function getStatusLabel(status: "active" | "coming-soon") {
  return status === "active" ? "Active" : "Coming Soon";
}
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              Automation Triggers
            </h1>
            <p class="mt-2 text-lg text-muted">
              Configure triggers to activate your automations based on live stream events
            </p>
          </div>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard variant="outline">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-primary/10">
              <UIcon name="i-lucide-zap" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted">
                Total Triggers
              </p>
              <p class="text-2xl font-bold">
                {{ giftTriggersCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard variant="outline">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-success/10">
              <UIcon name="i-lucide-check-circle" class="w-6 h-6 text-success" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted">
                Active Triggers
              </p>
              <p class="text-2xl font-bold">
                {{ activeGiftTriggersCount }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard variant="outline">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-info/10">
              <UIcon name="i-lucide-layers" class="w-6 h-6 text-info" />
            </div>
            <div>
              <p class="text-sm font-medium text-muted">
                Trigger Types
              </p>
              <p class="text-2xl font-bold">
                5
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Trigger Types Grid -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            Available Trigger Types
          </h2>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingGiftTriggers" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-48 w-full"
          />
        </div>

        <!-- Trigger Type Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="trigger in triggerTypes"
            :key="trigger.id"
            class="hover:shadow-lg transition-shadow cursor-pointer"
            @click="navigateToTrigger(trigger)"
          >
            <div class="space-y-4">
              <!-- Header with Icon and Status -->
              <div class="flex items-start justify-between">
                <div
                  class="p-3 rounded-lg"
                  :class="{
                    'bg-primary/10': trigger.color === 'primary',
                  }"
                >
                  <UIcon
                    :name="trigger.icon"
                    class="w-8 h-8"
                    :class="{
                      'text-primary': trigger.color === 'primary',
                    }"
                  />
                </div>
                <UBadge
                  :label="getStatusLabel(trigger.status)"
                  :color="getStatusColor(trigger.status)"
                  variant="soft"
                />
              </div>

              <!-- Content -->
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  {{ trigger.name }}
                </h3>
                <p class="text-sm text-muted">
                  {{ trigger.description }}
                </p>
              </div>

              <!-- Stats (for active triggers) -->
              <div v-if="trigger.status === 'active'" class="flex items-center gap-4 pt-2 border-t border-accented">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-list" class="w-4 h-4 text-muted" />
                  <span class="text-sm text-muted">
                    <strong class="text-default">{{ trigger.count }}</strong> total
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-check" class="w-4 h-4 text-success" />
                  <span class="text-sm text-muted">
                    <strong class="text-default">{{ trigger.activeCount }}</strong> active
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <UButton
                :color="trigger.status === 'active' ? 'primary' : 'neutral'"
                :variant="trigger.status === 'active' ? 'solid' : 'soft'"
                block
              >
                <UIcon
                  :name="trigger.status === 'active' ? 'i-lucide-settings' : 'i-lucide-clock'"
                  class="w-4 h-4 mr-2"
                />
                {{ trigger.status === 'active' ? 'Manage Triggers' : 'Coming Soon' }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Help Section -->
      <UCard variant="soft" class="mt-8">
        <div class="flex items-start gap-4">
          <div class="p-2 rounded-lg bg-info/10">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-info" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">
              How Triggers Work
            </h3>
            <p class="text-sm text-muted mb-4">
              Triggers monitor your TikTok Live stream for specific events and automatically execute your configured automations.
              Each trigger type watches for different stream interactions:
            </p>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 mt-0.5 text-success" />
                <span><strong>Gifts:</strong> Activate automations when viewers send specific gifts or gift amounts</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 mt-0.5 text-success" />
                <span><strong>Chat:</strong> Respond to specific keywords or phrases in chat messages</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 mt-0.5 text-success" />
                <span><strong>Follows:</strong> Celebrate new followers with special effects</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 mt-0.5 text-success" />
                <span><strong>Likes & Shares:</strong> React to viewer engagement in real-time</span>
              </li>
            </ul>
          </div>
        </div>
      </UCard>
    </UContainer>
  </UMain>
</template>
