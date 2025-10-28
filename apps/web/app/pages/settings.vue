<script setup lang="ts">
useHead({
  title: "Settings - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Configure your shop automation settings",
    },
  ],
});
const { data: config } = await useAsyncData(
  "config",
  () => $fetch("/api/config"),
);

const hueConfig = computed(() => {
  return {
    hue_ip: config.value?.hue_ip || undefined,
    hue_username: config.value?.hue_username || undefined,
    hue_password: config.value?.hue_password || undefined,
  };
});

const tiktokConfig = computed(() => {
  return {
    tiktok_handle: config.value?.tiktok_handle || undefined,
    automations_enabled: config.value?.automations_enabled === 1,
  };
});
</script>

<template>
  <UMain>
    <UContainer class="py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p class="mt-2 text-lg text-muted">
          Configure your automation settings and integrations
        </p>
      </div>

      <div class="space-y-6">
        <!-- Hue Bridge Settings Card -->
        <SettingsHueSettings :hue-config="hueConfig" />

        <!-- TikTok Integration Settings Card -->
        <SettingsTiktokSettings :tiktok-config="tiktokConfig" />

        <!-- Additional Settings Cards (Future Features) -->
        <UCard variant="outline">
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-volume-2" class="w-6 h-6 text-blue-500" />
              <div>
                <h3 class="text-lg font-semibold">
                  Audio Settings
                </h3>
                <p class="text-sm text-muted">
                  Configure sound effects and audio triggers
                </p>
              </div>
            </div>
          </template>

          <div class="text-center py-8">
            <UIcon name="i-lucide-construction" class="w-12 h-12 mx-auto mb-4 text-muted" />
            <p class="text-muted">
              Audio settings coming soon
            </p>
          </div>
        </UCard>
      </div>
    </UContainer>
  </UMain>
</template>
