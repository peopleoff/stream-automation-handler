# Server-Sent Events (SSE) Implementation

## Overview

This document describes the implementation of real-time event streaming between the event-service and frontend, replacing HTTP polling with Server-Sent Events (SSE).

## Architecture

```
event-service (Node.js) → writes to SQLite DB
                              ↓
Nuxt SSE endpoint (/api/events/stream) → watches DB → streams changes
                              ↓
Frontend (EventSource) → receives live updates
```

## Files Created

### 1. Database Watcher Utility
**Location**: `packages/shared/lib/utils/db-watcher.ts`

- Monitors `service_status` and `automation_runs` tables for changes
- Polls database every 2 seconds
- Emits events when changes are detected
- Shared utility usable by any app in the monorepo

### 2. SSE Endpoint
**Location**: `apps/web/server/api/events/stream.get.ts`

- Creates SSE connection using Nuxt's `createEventStream`
- Uses DbWatcher to monitor database changes
- Streams events to connected clients
- Sends heartbeat every 30 seconds to keep connection alive
- Handles cleanup on connection close

### 3. Event Stream Composable
**Location**: `apps/web/app/composables/useEventStream.ts`

- Vue composable for consuming SSE in frontend components
- Handles EventSource connection lifecycle
- Auto-reconnects on connection failure (max 5 attempts)
- Routes events to appropriate callbacks

### 4. Updated Components

**EventServiceStatus** (`apps/web/app/components/dashboard/EventServiceStatus.vue`):
- Removed polling interval
- Now receives real-time status updates via SSE
- Shows SSE connection status (wifi icon)

**AutomationRunsTable** (`apps/web/app/components/automation-runs-table.vue`):
- Removed polling interval
- Automatically adds new automation runs to the table in real-time
- Updates "Last run at" timestamp when new runs arrive

## Event Types

The SSE endpoint streams the following event types:

### 1. `connected`
Sent when SSE connection is established.
```json
{
  "type": "connected",
  "message": "SSE connection established",
  "timestamp": 1234567890
}
```

### 2. `status-update`
Sent when event-service status changes.
```json
{
  "type": "status-update",
  "data": {
    "serviceName": "tiktok-stream",
    "status": "connected",
    "lastHeartbeat": 1234567890,
    "connectionDetails": "{...}",
    "updatedAt": 1234567890
  },
  "timestamp": 1234567890
}
```

### 3. `automation-run`
Sent when a new automation is triggered.
```json
{
  "type": "automation-run",
  "data": {
    "id": 123,
    "automationName": "Rainbow Effect",
    "eventType": "gift",
    "giftName": "Rose",
    "status": "success",
    ...
  },
  "timestamp": 1234567890
}
```

### 4. `heartbeat`
Sent every 30 seconds to keep connection alive.
```json
{
  "type": "heartbeat",
  "timestamp": 1234567890
}
```

### 5. `error`
Sent when an error occurs in the database watcher.
```json
{
  "type": "error",
  "data": {
    "message": "Error message"
  },
  "timestamp": 1234567890
}
```

## Testing

### 1. Start the Applications

**Terminal 1 - Event Service:**
```bash
cd apps/event-service
npm run dev
```

**Terminal 2 - Web Frontend:**
```bash
cd apps/web
npm run dev
```

### 2. Open Dashboard

Navigate to `http://localhost:3000` and observe:

- **Event Service Status card** should show a green wifi icon (SSE connected)
- **Recent Automation Runs table** should be visible

### 3. Test Real-Time Updates

#### Option A: Trigger TikTok Events
If you have a TikTok Live stream configured:
1. Go live on TikTok
2. Wait for gifts or interactions
3. Watch automation runs appear instantly in the dashboard (no refresh needed)

#### Option B: Manual Database Insert (for testing)
```bash
# Open Drizzle Studio
npm run db:studio

# Navigate to automation_runs table
# Click "Add Row" and create a test entry
# Watch it appear instantly in the dashboard
```

### 4. Test Connection Resilience

1. Stop the web server (Ctrl+C in Terminal 2)
2. Restart the web server (`npm run dev`)
3. Refresh the dashboard - SSE should automatically reconnect
4. Green wifi icon should reappear after a few seconds

### 5. Verify No Polling

Open browser DevTools (F12) → Network tab:
- **Before**: You'd see repeated GET requests every 60 seconds to `/api/status/event-service` and `/api/automation/runs`
- **After**: Only one initial GET request, then a persistent SSE connection to `/api/events/stream`

## Benefits

✅ **Lower latency** - Updates appear instantly (vs 60s polling interval)
✅ **Lower server load** - No repeated HTTP requests every 60 seconds
✅ **Lower network traffic** - Single persistent connection vs multiple requests
✅ **Simpler code** - No setInterval/clearInterval management
✅ **Better UX** - Real-time feel, no stale data
✅ **Auto-reconnection** - Handles connection failures gracefully

## Configuration

### Polling Interval (Database Watcher)
Default: 2 seconds

To change, modify in `apps/web/server/api/events/stream.get.ts`:
```typescript
const watcher = createDbWatcher(2000); // Change to desired milliseconds
```

### Heartbeat Interval
Default: 30 seconds

To change, modify in `apps/web/server/api/events/stream.get.ts`:
```typescript
const heartbeatInterval = setInterval(() => {
  // ...
}, 30000); // Change to desired milliseconds
```

### Reconnection Settings
Default: 5 attempts, 3s base delay

To change, modify in `apps/web/app/composables/useEventStream.ts`:
```typescript
const maxReconnectAttempts = 5;
const reconnectDelayMs = 3000;
```

## Troubleshooting

### SSE Not Connecting

1. Check browser console for errors
2. Verify `/api/events/stream` endpoint is accessible
3. Check server logs for errors
4. Ensure database is accessible and migrations are applied

### Updates Not Appearing

1. Verify event-service is running and writing to database
2. Check database watcher is detecting changes (server console logs)
3. Verify SSE connection is established (green wifi icon)
4. Check browser console for event parsing errors

### High Server Load

If polling interval is too aggressive:
1. Increase `createDbWatcher` interval (e.g., 5000ms)
2. Add database indexes if queries are slow
3. Consider using database triggers for true push notifications

## Future Enhancements

- **True push notifications**: Use SQLite triggers or PostgreSQL NOTIFY/LISTEN
- **Message filtering**: Allow clients to subscribe to specific event types
- **Compression**: Use gzip compression for event messages
- **Authentication**: Add JWT or session validation to SSE endpoint
- **Metrics**: Track SSE connection count, message rates, reconnection frequency
