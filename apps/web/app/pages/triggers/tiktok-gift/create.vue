<script setup lang="ts">
import TriggersTikTokGiftForm from "~/components/triggers/tiktok-gift-form.vue";

const router = useRouter();

useHead({
  title: "Create TikTok Gift Trigger - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Create a new TikTok gift trigger",
    },
  ],
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
          Create TikTok Gift Trigger
        </h1>
        <p class="mt-2 text-lg text-muted">
          Configure which TikTok gift will trigger an automation
        </p>
      </div>

      <TriggersTikTokGiftForm mode="create" />
    </UContainer>
  </UMain>
</template>
