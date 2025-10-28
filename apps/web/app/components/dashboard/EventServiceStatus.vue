<script setup lang="ts">
import type { ServiceStatus } from "@cattyshack/shared/db/schema";

type ServiceStatusState = {
  serviceName: string;
  status: "connected" | "disconnected" | "error" | "starting";
  lastHeartbeat: number | null;
  connectionDetails: Record<string, any> | null;
  isStale: boolean;
  message: string;
};

// Local reactive state for status updates (initialized from SSE only)
const currentStatus = ref<ServiceStatusState | null>(null);

// Subscribe to real-time SSE updates
const { isConnected: sseConnected } = useEventStream({
  onStatusUpdate: (status: ServiceStatus) => {
    // Update current status from SSE (initialize if needed)
    const now = Date.now();
    const staleThreshold = 90000; // 90 seconds
    const isStale = status.lastHeartbeat
      ? now - status.lastHeartbeat > staleThreshold
      : true;

    currentStatus.value = {
      serviceName: status.serviceName,
      status: status.status,
      lastHeartbeat: status.lastHeartbeat,
      connectionDetails: status.connectionDetails
        ? JSON.parse(status.connectionDetails)
        : null,
      isStale,
      message: isStale
        ? "Service heartbeat is stale (may be offline)"
        : "Connected and receiving updates",
    };
  },
  onConnected: () => {
    console.log("SSE connected - receiving real-time status updates");
  },
  onError: (error) => {
    console.error("SSE error:", error);
  },
});

const isLoading = computed(() => !currentStatus.value?.status && sseConnected.value);

// Computed properties
const serviceStatus = computed(() => currentStatus.value);

const statusColor = computed(() => {
  if (!serviceStatus.value)
    return "gray";

  switch (serviceStatus.value.status) {
    case "connected":
      return "green";
    case "disconnected":
      return "gray";
    case "error":
      return "red";
    case "starting":
      return "yellow";
    default:
      return "gray";
  }
});

const statusIcon = computed(() => {
  if (!serviceStatus.value)
    return "i-lucide-circle";

  switch (serviceStatus.value.status) {
    case "connected":
      return "i-lucide-check-circle";
    case "disconnected":
      return "i-lucide-circle";
    case "error":
      return "i-lucide-alert-circle";
    case "starting":
      return "i-lucide-loader-circle";
    default:
      return "i-lucide-circle";
  }
});

const statusText = computed(() => {
  if (!serviceStatus.value)
    return "Unknown";

  switch (serviceStatus.value.status) {
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
    case "starting":
      return "Starting";
    default:
      return "Unknown";
  }
});

const lastHeartbeatText = computed(() => {
  if (!serviceStatus.value?.lastHeartbeat)
    return "Never";

  const now = Date.now();
  const diff = now - serviceStatus.value.lastHeartbeat;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60)
    return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
});
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-lucide-radio" class="w-5 h-5 text-teal-500" />
          <h3 class="text-lg font-semibold">
            Event Service
          </h3>
        </div>

        <div v-if="isLoading" class="space-y-2">
          <USkeleton class="h-6 w-32" />
          <USkeleton class="h-4 w-40" />
        </div>

        <div v-else-if="serviceStatus" class="space-y-2">
          <!-- Status Badge -->
          <div class="flex items-center gap-2">
            <UIcon :name="statusIcon" :class="`w-5 h-5 text-${statusColor}-500`" />
            <span class="text-lg font-semibold" :class="`text-${statusColor}-600 dark:text-${statusColor}-400`">
              {{ statusText }}
            </span>
          </div>

          <!-- Last Heartbeat -->
          <p class="text-sm text-muted">
            Last update: {{ lastHeartbeatText }}
          </p>

          <!-- Connection Details -->
          <div v-if="serviceStatus.isStale" class="mt-2">
            <p class="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ Service may be offline
            </p>
          </div>
        </div>

        <div v-else class="space-y-2">
          <p class="text-sm text-muted">
            Unable to fetch service status
          </p>
        </div>
      </div>

      <!-- SSE Connection Status & Reconnect Button -->
      <div class="flex items-center gap-2">
        <UIcon
          v-if="sseConnected"
          name="i-lucide-wifi"
          class="w-4 h-4 text-green-500"
          title="Live updates enabled"
        />
        <UIcon
          v-else
          name="i-lucide-wifi-off"
          class="w-4 h-4 text-gray-400"
          title="Live updates disconnected"
        />
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          :loading="isLoading"
          :disabled="sseConnected"
        >
          <UIcon name="i-lucide-refresh-cw" class="w-4 h-4" />
        </UButton>
      </div>
    </div>
  </UCard>
</template>
