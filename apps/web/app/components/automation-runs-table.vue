<script setup lang="ts">
import type { AutomationRun } from "@cattyshack/shared/db/schema";

import { h, resolveComponent } from "vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");
const UCard = resolveComponent("UCard");
const router = useRouter();

// Fetch initial automation runs
const { data: runsResponse, status } = await useAsyncData(
  "automation-runs",
  () => $fetch<{ message: string; data: AutomationRun[]; count: number }>("/api/automation/runs"),
);

const lastRefreshTime = ref<Date>(new Date());
const localRuns = ref<AutomationRun[]>(runsResponse.value?.data ?? []);

const runs = computed(() => localRuns.value);

// Subscribe to real-time SSE updates
const { isConnected: sseConnected } = useEventStream({
  onAutomationRun: (run: AutomationRun) => {
    // Add new run to the beginning of the list
    localRuns.value = [run, ...localRuns.value].slice(0, 15); // Keep only 15 most recent
    lastRefreshTime.value = new Date();
  },
  onConnected: () => {
    console.log("SSE connected - receiving real-time automation runs");
  },
  onError: (error) => {
    console.error("SSE error:", error);
  },
});

// Table columns configuration
const columns = [
  {
    accessorKey: "automationName",
    header: "Automation",
    cell: ({ row }: any) => {
      const run = row.original;
      const name = run.automationName || "Unknown";

      if (run.automationId) {
        return h(UButton, {
          variant: "link",
          size: "sm",
          class: "font-medium p-0 h-auto cursor-pointer",
          onClick: () => router.push(`/automations/${run.automationId}`),
        }, () => name);
      }

      return h("span", { class: "font-medium text-muted" }, name);
    },
  },
  {
    accessorKey: "giftName",
    header: "Event & Amount",
    cell: ({ row }: any) => {
      const run = row.original;
      const eventType = run.eventType;
      const giftName = run.giftName || eventType;
      const quantity = run.repeatCount && run.repeatCount > 1 ? ` x${run.repeatCount}` : "";

      const content = [
        h(UIcon, {
          name: getEventIcon(eventType),
          class: `w-4 h-4 ${getEventIconColor(eventType)}`,
        }),
        h("span", {}, giftName + quantity),
      ];

      if (run.triggerId) {
        return h(UButton, {
          variant: "link",
          size: "sm",
          class: "p-0 h-auto gap-2 cursor-pointer",
          onClick: () => router.push(`/triggers/tiktok-gift/${run.triggerId}`),
        }, () => content);
      }

      return h("div", { class: "flex items-center gap-2" }, content);
    },
  },
  {
    accessorKey: "senderUsername",
    header: "User",
  },
  {
    accessorKey: "successfulLightsCount",
    header: "Lights",
    cell: ({ row }: any) => {
      const run = row.original;
      const text = `${run.successfulLightsCount}/${run.selectedLightsCount}`;
      return h("span", { class: run.failedLightsCount > 0 ? "text-warning" : "" }, text);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.original.status;
      return h(UBadge, {
        color: getStatusColor(status),
        size: "sm",
      }, () => [
        h(UIcon, { name: getStatusIcon(status), class: "w-3 h-3 mr-1" }),
        status === "partial_failure" ? "partial" : status,
      ]);
    },
  },
];

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "success";
    case "partial_failure":
      return "warning";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "success":
      return "i-lucide-check-circle";
    case "partial_failure":
      return "i-lucide-alert-circle";
    case "failed":
      return "i-lucide-x-circle";
    default:
      return "i-lucide-circle";
  }
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case "gift":
      return "i-lucide-gift";
    case "comment":
      return "i-lucide-message-circle";
    case "like":
      return "i-lucide-heart";
    case "follow":
      return "i-lucide-user-plus";
    case "share":
      return "i-lucide-share-2";
    default:
      return "i-lucide-activity";
  }
}

function getEventIconColor(eventType: string): string {
  switch (eventType) {
    case "gift":
      return "text-pink-500";
    case "comment":
      return "text-blue-500";
    case "like":
      return "text-red-500";
    case "follow":
      return "text-green-500";
    case "share":
      return "text-purple-500";
    default:
      return "";
  }
}
</script>

<template>
  <div>
    <div class="mb-4">
      <UTooltip text="Listening for live updates">
        <UChip :color="sseConnected ? 'primary' : 'neutral'" size="md">
          <h2 class="text-2xl font-bold tracking-tight">
            Recent Automation Runs
          </h2>
        </UChip>
      </UTooltip>
    </div>

    <UCard>
      <UTable
        :data="runs"
        :columns="columns"
        :loading="status === 'pending'"
      />
    </UCard>
  </div>
</template>
