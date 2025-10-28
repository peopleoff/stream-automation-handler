<script setup lang="ts">
import { computed } from "vue";

type Props = {
  modelValue: number | undefined;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  minLabel?: string;
  midLabel?: string;
  maxLabel?: string;
};

const props = withDefaults(defineProps<Props>(), {
  suffix: "",
  minLabel: undefined,
  midLabel: undefined,
  maxLabel: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: number | undefined];
}>();

// Computed property for bidirectional sync with auto-clamping
const value = computed({
  get: () => props.modelValue ?? props.min,
  set: (newValue: number) => {
    // Auto-clamp to valid range
    const clamped = Math.max(props.min, Math.min(props.max, newValue));
    emit("update:modelValue", clamped);
  },
});

// Handle input changes with auto-clamping
function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const numValue = Number.parseFloat(input.value);

  if (!Number.isNaN(numValue)) {
    value.value = numValue;
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Text Input -->
    <UInput
      :model-value="value"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      @change="handleInputChange"
    >
      <template v-if="suffix" #trailing>
        <span class="text-sm text-gray-500">{{ suffix }}</span>
      </template>
    </UInput>

    <!-- Slider -->
    <div class="space-y-4">
      <USlider
        v-model="value"
        :min="min"
        :max="max"
        :step="step"
        color="primary"
        tooltip
      />

      <!-- Range Labels -->
      <div v-if="minLabel || midLabel || maxLabel" class="flex justify-between text-sm text-muted">
        <span>{{ minLabel }}</span>
        <span v-if="midLabel">{{ midLabel }}</span>
        <span>{{ maxLabel }}</span>
      </div>
    </div>
  </div>
</template>
