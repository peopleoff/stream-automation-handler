<script setup lang="ts">
type Props = {
  title: string;
  description: string;
  confirmText?: string;
  confirmColor?: "primary" | "error" | "warning" | "success" | "neutral";
  confirmIcon?: string;
  cancelText?: string;
  disabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  confirmText: "Confirm",
  confirmColor: "primary",
  confirmIcon: undefined,
  cancelText: "Cancel",
  disabled: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const isOpen = ref(false);

function openModal() {
  if (props.disabled)
    return;
  isOpen.value = true;
}

function handleConfirm() {
  emit("confirm");
  isOpen.value = false;
}

function handleCancel() {
  emit("cancel");
  isOpen.value = false;
}
</script>

<template>
  <!-- Trigger slot -->
  <div @click="openModal">
    <slot />
  </div>

  <!-- Confirmation Modal -->
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
  >
    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton
          variant="outline"
          color="neutral"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UButton>
        <UButton
          :color="confirmColor"
          @click="handleConfirm"
        >
          <UIcon
            v-if="confirmIcon"
            :name="confirmIcon"
            class="w-4 h-4 mr-2"
          />
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
