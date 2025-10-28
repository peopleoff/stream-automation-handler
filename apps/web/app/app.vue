<template>
  <UApp>
    <UHeader>
      <template #title>
        <UIcon name="i-lucide-settings" class="w-6 h-6" />
        <span class="ml-2">CattyShack Automation</span>
      </template>

      <template #center>
        <UButton
          variant="ghost"
          to="/automations/manage"
          label="Automations"
        >
          <template #leading>
            <UIcon name="i-lucide-zap" />
          </template>
        </UButton>
        <UButton
          variant="ghost"
          to="/triggers/tiktok-gift"
          label="TikTok Triggers"
        >
          <template #leading>
            <UIcon name="i-lucide-gift" />
          </template>
        </UButton>
        <UButton
          variant="ghost"
          to="/settings"
          label="Settings"
        >
          <template #leading>
            <UIcon name="i-lucide-settings" />
          </template>
        </UButton>
      </template>

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>
    <NuxtPage />
  </UApp>
</template>
