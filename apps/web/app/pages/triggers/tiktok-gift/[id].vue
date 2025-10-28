<script setup lang="ts">
import type { TikTokGiftTrigger } from "@cattyshack/shared/db/schema";

import TriggersTikTokGiftForm from "~/components/triggers/tiktok-gift-form.vue";

const route = useRoute();
const router = useRouter();

const triggerId = route.params.id as string;

useHead({
  title: "Edit TikTok Gift Trigger - CattyShack Automation",
});

// Fetch trigger data
const { data: triggerResponse, status: triggerStatus } = await useAsyncData(
  "trigger",
  () => $fetch<{ message: string; data: TikTokGiftTrigger }>(`/api/triggers/tiktok-gift/${triggerId}`),
);

const isLoadingTrigger = computed(() => triggerStatus.value === "pending");
const triggerData = computed(() => {
  const data = triggerResponse.value?.data;
  if (!data)
    return undefined;

  // Parse giftIds from JSON string to array
  let giftIds: string[] = [];
  try {
    giftIds = JSON.parse(data.giftIds);
  }
  catch (error) {
    console.error("Failed to parse giftIds:", error);
  }

  return {
    ...data,
    giftIds,
  };
});
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <UButton
            variant="ghost"
            size="sm"
            @click="router.push('/triggers/tiktok-gift')"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-2" />
            Back to Triggers
          </UButton>
        </div>
        <h1 class="text-3xl font-bold tracking-tight">
          Edit TikTok Gift Trigger
        </h1>
        <p class="mt-2 text-lg text-muted">
          Update trigger configuration
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingTrigger" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <USkeleton class="h-32 w-full" />
          <USkeleton class="h-64 w-full" />
          <USkeleton class="h-48 w-full" />
        </div>
        <div class="lg:col-span-1">
          <USkeleton class="h-64 w-full" />
        </div>
      </div>

      <!-- Edit Form -->
      <TriggersTikTokGiftForm
        v-else-if="triggerData"
        mode="edit"
        :trigger-id="triggerId"
        :initial-data="triggerData"
      />
    </UContainer>
  </UMain>
</template>
