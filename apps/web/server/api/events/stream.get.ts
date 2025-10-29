/**
 * GET /api/events/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time updates
 * Streams database changes to frontend without polling
 */

import type { AutomationRun, ServiceStatus } from "@cattyshack/shared";

import { createDbWatcher } from "@cattyshack/shared";

export default defineEventHandler(async (event) => {
  // Set up SSE headers
  setHeader(event, "content-type", "text/event-stream");
  setHeader(event, "cache-control", "no-cache");
  setHeader(event, "connection", "keep-alive");
  setResponseStatus(event, 200);

  // Create event stream
  const eventStream = createEventStream(event);

  // Create database watcher
  const watcher = createDbWatcher(2000); // Poll every 2 seconds

  // Subscribe to status updates
  watcher.on("status-update", (status: ServiceStatus) => {
    eventStream.push(JSON.stringify({
      type: "status-update",
      data: status,
      timestamp: Date.now(),
    }));
  });

  // Subscribe to automation runs
  watcher.on("automation-run", (run: AutomationRun) => {
    eventStream.push(JSON.stringify({
      type: "automation-run",
      data: run,
      timestamp: Date.now(),
    }));
  });

  // Subscribe to errors
  watcher.on("error", (error: Error) => {
    eventStream.push(JSON.stringify({
      type: "error",
      data: { message: error.message },
      timestamp: Date.now(),
    }));
  });

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    eventStream.push(JSON.stringify({
      type: "heartbeat",
      timestamp: Date.now(),
    }));
  }, 30000);

  // Start watching for changes
  watcher.start();

  // Send initial connection message
  eventStream.push(JSON.stringify({
    type: "connected",
    message: "SSE connection established",
    timestamp: Date.now(),
  }));

  // Clean up on connection close
  eventStream.onClosed(async () => {
    watcher.stop();
    clearInterval(heartbeatInterval);
    await eventStream.close();
  });

  return eventStream.send();
});
