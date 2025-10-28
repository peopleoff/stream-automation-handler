/**
 * Composable for consuming Server-Sent Events (SSE)
 * Provides real-time updates from the server without polling
 */

import type { AutomationRun, ServiceStatus } from "@cattyshack/shared/db/schema";

export type EventStreamMessage = {
  type: "connected" | "status-update" | "automation-run" | "heartbeat" | "error";
  data?: any;
  message?: string;
  timestamp: number;
};

export type EventStreamCallbacks = {
  onStatusUpdate?: (status: ServiceStatus) => void;
  onAutomationRun?: (run: AutomationRun) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
  onDisconnected?: () => void;
};

/**
 * Connect to SSE endpoint and handle events
 */
export function useEventStream(callbacks: EventStreamCallbacks) {
  const isConnected = ref(false);
  const error = ref<Error | null>(null);
  const lastEventTime = ref<number>(0);

  let eventSource: EventSource | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelayMs = 3000;

  /**
   * Connect to the SSE endpoint
   */
  function connect() {
    if (eventSource) {
      return; // Already connected
    }

    try {
      // Create EventSource connection
      eventSource = new EventSource("/api/events/stream");

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const message: EventStreamMessage = JSON.parse(event.data);
          lastEventTime.value = message.timestamp;

          // Route message to appropriate callback
          switch (message.type) {
            case "connected":
              isConnected.value = true;
              reconnectAttempts = 0;
              callbacks.onConnected?.();
              break;

            case "status-update":
              if (message.data && callbacks.onStatusUpdate) {
                callbacks.onStatusUpdate(message.data as ServiceStatus);
              }
              break;

            case "automation-run":
              if (message.data && callbacks.onAutomationRun) {
                callbacks.onAutomationRun(message.data as AutomationRun);
              }
              break;

            case "heartbeat":
              // Keep connection alive, no action needed
              break;

            case "error":
              if (message.data && callbacks.onError) {
                callbacks.onError(new Error(message.data.message || "Unknown error"));
              }
              break;
          }
        }
        catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      };

      // Handle connection errors
      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        isConnected.value = false;

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = reconnectDelayMs * reconnectAttempts;
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);

          reconnectTimeout = setTimeout(() => {
            connect();
          }, delay);
        }
        else {
          error.value = new Error("Max reconnection attempts reached");
          callbacks.onError?.(error.value);
        }

        callbacks.onDisconnected?.();
      };
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(error.value);
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    isConnected.value = false;
  }

  // Auto-connect when component mounts
  onMounted(() => {
    connect();
  });

  // Auto-disconnect when component unmounts
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected: readonly(isConnected),
    error: readonly(error),
    lastEventTime: readonly(lastEventTime),
    connect,
    disconnect,
  };
}
