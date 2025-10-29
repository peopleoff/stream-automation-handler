# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cattyshack Automation Platform** is a monorepo containing a TikTok Live stream automation system that controls Philips Hue lights based on live stream events (gifts, chat, etc.). The project uses npm workspaces to share code between the frontend dashboard and backend event service.

### Technology Stack

- **Monorepo**: npm workspaces
- **Frontend**: Nuxt 4 with Vue 3, TypeScript, Nuxt UI
- **Backend**: Node.js with TypeScript, TikTok Live Connector
- **Shared**: Drizzle ORM (SQLite), Philips Hue API, Zod validation
- **Process Manager**: PM2 for production deployment

## Monorepo Structure

```
cattyshack-monorepo/
├── apps/
│   ├── web/                    # Nuxt frontend dashboard (port 3000)
│   │   ├── app/                # Vue components and pages
│   │   ├── server/             # Nuxt API routes
│   │   └── CLAUDE.md           # Frontend-specific documentation
│   │
│   └── event-service/          # TikTok event listener (Node.js)
│       ├── src/
│       │   ├── index.ts        # Main entry point
│       │   ├── config.ts       # Configuration loader
│       │   └── services/       # TikTok stream & automation executor
│       └── dist/               # Compiled JavaScript
│
├── packages/
│   └── shared/                 # Shared package (@cattyshack/shared)
│       └── lib/
│           ├── db/             # Database schemas & queries (Drizzle ORM)
│           ├── services/       # Hue service implementations
│           ├── schemas/        # Zod validation schemas
│           ├── types/          # TypeScript type definitions
│           └── utils/          # Logger, retry, error handling
│
├── data/                       # SQLite database (shared by both apps)
├── logs/                       # Application logs
├── ecosystem.config.js         # PM2 process configuration
└── .env                        # Environment variables (not committed)
```

## Development Commands

### Initial Setup

```bash
# Install all dependencies (root + all workspaces)
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your configuration
```

### Running Applications

```bash
# Run frontend only
npm run dev -w web

# Run backend only
npm run dev -w event-service

# Run both (in separate terminals)
npm run dev --workspaces
```

### Building

```bash
# Build everything
npm run build

# Build specific workspace
npm run build -w web
npm run build -w event-service
```

### Database Operations

**IMPORTANT: All database commands run through the shared package**

```bash
# Generate migrations after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio for database management
npm run db:studio
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Fix linting issues across all workspaces
npm run lint:fix
```

### Cleanup

```bash
# Remove all node_modules, .nuxt, and dist directories
npm run clean
```

### Production with PM2

```bash
# Build both applications first
npm run build

# Start both services with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor services
pm2 monit

# Restart services
pm2 restart cattyshack-web
pm2 restart cattyshack-events

# Stop all services
pm2 stop all
```

## Architecture Principles

### Shared Package Pattern

The `@cattyshack/shared` package is the single source of truth for:

- **Database schemas** (`lib/db/schema/`): Table definitions with Drizzle ORM
- **Database queries** (`lib/db/queries/`): Reusable query functions
- **Hue services** (`lib/services/hue/`): REST API client + advanced effect queue
- **Validation schemas** (`lib/schemas/`): Zod schemas for forms and APIs
- **Types** (`lib/types/`): Shared TypeScript type definitions
- **Utilities** (`lib/utils/`): Logger, retry logic, error handling

### Import Pattern

Both apps import from the shared package using the `@cattyshack/shared` namespace:

```typescript
// Database operations
import { getHueConfig, updateHueConfig } from "@cattyshack/shared/db/queries/config";

// Hue service (REST API for frontend)
import { discoverHueBridge, testHueConnection } from "@cattyshack/shared/services/hue";

// Hue client (advanced queue for backend)
import { createHueClient } from "@cattyshack/shared/services/hue";

// Validation schemas
import { hueConfigSchema } from "@cattyshack/shared/schemas/hue";

// Types
import type { HueConfig } from "@cattyshack/shared/types/hue";

// Utilities
import { createAppLogger } from "@cattyshack/shared/utils/logger";
```

### Database Architecture

- **Location**: `./data/local.db` (from monorepo root)
- **ORM**: Drizzle ORM with SQLite
- **Migrations**: Managed from `packages/shared` using Drizzle Kit
- **Shared Access**: Both frontend and backend access the same database
- **Schema Organization**: Separate files per domain in `packages/shared/lib/db/schema/`

**Tables**:
- `config`: Hue bridge configuration (IP, username, password)
- `hue_automations`: Automation rules linking events to light effects
- (Additional tables can be added in `schema/` directory)

### Code Sharing Strategy

**What belongs in `@cattyshack/shared`:**
- Database schemas and queries
- API client libraries (Hue, streaming services)
- Validation schemas used by both frontend forms and API validation
- Shared types and interfaces
- Utility functions (logging, retry, error handling)

**What belongs in individual apps:**
- UI components and pages (frontend only)
- Server API routes (frontend only)
- Service orchestration and business logic (backend only)
- App-specific configuration and environment handling

## Frontend (apps/web)

The Nuxt frontend provides a dashboard for configuring automations and monitoring live stream events.

**Key Features**:
- Landing page showcasing automation capabilities
- Dashboard with live statistics and recent triggers
- Settings for Hue bridge configuration
- Automation rule management (planned)

**Architecture**: File-based routing, Nuxt UI components, server API routes for database access

**Documentation**: See [apps/web/CLAUDE.md](apps/web/CLAUDE.md) for comprehensive frontend development guidelines including:
- Nuxt UI component usage
- Form validation patterns
- API request handling
- TypeScript standards
- Import aliases
- Code quality standards

## Backend (apps/event-service)

The event service monitors TikTok Live streams and executes Hue light automations based on stream events.

### Architecture

```
src/
├── index.ts                    # Main entry point
├── config.ts                   # Environment & database config loader
├── services/
│   ├── tiktok-stream.ts        # TikTok Live connection wrapper
│   └── automation-executor.ts  # Matches events to automations
└── types.ts                    # Service-specific types
```

### Service Flow

1. **Initialization**: Load configuration from database and environment
2. **TikTok Connection**: Connect to TikTok Live stream using username
3. **Event Processing**: Listen for gifts, chat, likes, shares, follows
4. **Automation Matching**: Match events to configured automation rules
5. **Hue Execution**: Execute light effects using Hue client with effect queue

### TikTok Event Types

- `gift`: Viewer sends a gift (maps to light effects by gift ID)
- `chat`: Chat message received
- `like`: Viewer likes the stream
- `share`: Viewer shares the stream
- `follow`: New follower

### Hue Service Architecture

The shared package provides two Hue service interfaces:

**1. Simple REST API** (`lib/services/hue/api.ts`):
- Used by frontend for discovery and testing
- Direct HTTP calls to Hue bridge
- Functions: `discoverHueBridge()`, `testHueConnection()`, `getLight()`, `setLightState()`

**2. Advanced Client** (`lib/services/hue/client.ts`):
- Used by backend for complex automations
- Effect queue with priority management
- Duration tracking and automatic reversion
- Functions: `createHueClient()`, `queueEffect()`, `setLights()`, `flashLights()`

### Event Service Development

```bash
# Development with hot reload
npm run dev -w event-service

# Watch mode (auto-restart on changes)
npm run watch -w event-service

# Build TypeScript to JavaScript
npm run build -w event-service

# Run production build
npm run start -w event-service
```

### Environment Configuration

**Required Variables**:
- `DB_FILE_NAME`: Database location (default: `file:./data/local.db`)
- `HUE_BRIDGE_IP`: Philips Hue bridge IP address
- `HUE_USERNAME`: Hue API username
- `TIKTOK_UNIQUE_ID`: TikTok username to monitor
- `NODE_ENV`: Environment (development, production)

**Optional Variables**:
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LOG_FILE`: Log file location
- `EULERSTREAM_API_KEY`: Alternative TikTok connection method
- `RECONNECT_ATTEMPTS`: TikTok reconnection attempts
- `RECONNECT_DELAY_MS`: Delay between reconnection attempts

### Adding New Automation Types

1. **Define event type** in `@cattyshack/shared/types/streaming.ts`
2. **Add database schema** in `@cattyshack/shared/db/schema/` (if needed)
3. **Update TikTok service** to emit new event type
4. **Implement automation logic** in automation executor
5. **Test with Hue lights** using the advanced client

## Shared Package (@cattyshack/shared)

### Package Exports

The shared package uses subpath exports for clean imports:

```typescript
// Main exports (all)
import { ... } from "@cattyshack/shared";

// Database
import { db } from "@cattyshack/shared/db";
import { config } from "@cattyshack/shared/db/schema";
import { getHueConfig } from "@cattyshack/shared/db/queries/config";

// Services
import { discoverHueBridge } from "@cattyshack/shared/services/hue";
import { createHueClient } from "@cattyshack/shared/services/hue";

// Schemas
import { hueConfigSchema } from "@cattyshack/shared/schemas";

// Types
import type { HueConfig } from "@cattyshack/shared/types/hue";

// Utils
import { createAppLogger } from "@cattyshack/shared/utils/logger";
```

### Adding Shared Code

1. **Add code to appropriate directory** in `packages/shared/lib/`
2. **Export from index.ts** if it should be part of main exports
3. **Update package.json exports** if creating new subpath
4. **Use in apps** with `@cattyshack/shared/*` imports

### Database Schema Changes

**CRITICAL: Follow this exact workflow for schema changes:**

1. **Modify schema** in `packages/shared/lib/db/schema/`
2. **Generate migration**: `npm run db:generate`
3. **Review migration** in `packages/shared/lib/db/migrations/`
4. **Apply migration**: `npm run db:migrate`
5. **Verify changes**: `npm run db:studio`

**Never**:
- Make direct database changes outside of migrations
- Skip migration generation
- Manually edit migration files (unless fixing issues)

## TypeScript Standards

### Strict Type Safety

- **Never use `any`** - defeats TypeScript's purpose
- **Use `unknown` for uncertain types** - especially in error handling
- **Always type-check `unknown` values** before using them
- **Use proper type guards** for runtime validation

### Error Handling

```typescript
// ✅ Services throw errors
export async function fetchData(): Promise<Data> {
  const result = await $fetch<ApiResponse>("/api/endpoint");
  if (!result.success) {
    throw new Error("Operation failed");
  }
  return result.data;
}

// ✅ Catch with unknown type
try {
  await fetchData();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(message);
}

// ❌ Never return custom error objects
export async function badFetch(): Promise<{ success: boolean; error?: string }> {
  // Don't do this!
}
```

## Code Quality Standards

### Linting Workflow

**After ANY code changes:**
1. `npm run lint:fix` - Auto-fix issues
2. `npm run lint` - Verify compliance

**Never**:
- Ignore ESLint rules
- Disable rules to make code work
- Skip linting verification

### Import Organization

- **Use `@cattyshack/shared/*`** for shared package imports
- **Use `~/` or `@/`** for app-level imports (Nuxt)
- **Use `./` for relative imports** within same directory
- **Never use `@@/`** - monorepo uses package imports instead

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Required
- **Line length**: Max 120 characters
- **Naming**: camelCase for variables/functions, PascalCase for types/components

## Git Workflow

### Branch Strategy

- **Feature branches**: Create for all new work (`git checkout -b feature/name`)
- **Never work on main**: Always create a branch first
- **Descriptive names**: Use clear, descriptive branch names

### Commit Messages

- Use descriptive commit messages
- Focus on "why" not just "what"
- Reference issues when applicable
- Avoid generic messages like "fix", "update", "changes"

### Pre-commit Checklist

1. Run linting: `npm run lint:fix && npm run lint`
2. Build check: `npm run build` (ensure no build errors)
3. Test changes: Run affected apps/services
4. Review diff: `git diff` before staging

## Deployment

### PM2 Configuration

The `ecosystem.config.js` defines two processes:

**cattyshack-web**:
- Runs on port 3000
- Serves Nuxt production build
- 500MB memory limit
- Logs to `logs/web-*.log`

**cattyshack-events**:
- Monitors TikTok live stream
- Executes Hue automations
- 500MB memory limit
- Auto-restart on failure (max 10 restarts)
- 5s restart delay
- Logs to `logs/events-*.log`

### Deployment Steps

1. **Build applications**: `npm run build`
2. **Configure environment**: Ensure `.env` has production values
3. **Start services**: `pm2 start ecosystem.config.js`
4. **Verify logs**: `pm2 logs` to ensure successful startup
5. **Monitor**: `pm2 monit` for resource usage

### Environment Variables

Copy `.env.example` to `.env` and configure:

- **Database**: `DB_FILE_NAME` (shared database location)
- **Hue**: `HUE_BRIDGE_IP`, `HUE_USERNAME`
- **TikTok**: `TIKTOK_UNIQUE_ID`, `EULERSTREAM_API_KEY` (optional)
- **Logging**: `LOG_LEVEL`, `LOG_FILE`
- **Service**: `NODE_ENV`, reconnection settings

## Log Management

### Current Logging Configuration

The project creates multiple log files during operation:

**PM2 Logs** (from `ecosystem.config.js`):
- `logs/web-error.log` - Frontend errors
- `logs/web-out.log` - Frontend output
- `logs/events-error.log` - Event service errors
- `logs/events-out.log` - Event service output

**Winston Logs** (from `packages/shared/lib/utils/logger.ts`):
- `logs/event-service.log` - Custom application logs
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Log Rotation Policy

**Automatic log rotation is configured** to prevent unbounded log file growth:

- **Rotation Trigger**: When log files reach 50MB
- **Retention**: 7 rotations (approximately 7 days)
- **Compression**: Old logs compressed with gzip (`.gz` extension)
- **Method**: System-level logrotate (runs via cron)

### Installation

**One-time setup** (requires sudo):

```bash
# Install logrotate if not already installed
# macOS: brew install logrotate
# Ubuntu/Debian: sudo apt-get install logrotate
# CentOS/RHEL: sudo yum install logrotate

# Install Cattyshack logrotate configuration
sudo bash scripts/setup-logrotate.sh
```

The installation script will:
1. Update paths in the configuration to match your installation directory
2. Copy configuration to `/etc/logrotate.d/cattyshack`
3. Test the configuration for errors
4. Display setup summary and next steps

### Manual Log Rotation

To manually rotate logs (for testing or maintenance):

```bash
# Force immediate rotation
bash scripts/rotate-logs-now.sh
```

This is useful for:
- Testing rotation configuration
- Cleaning up large log files immediately
- Maintenance before backups or deployments

### Verifying Log Rotation

Check if rotation is working properly:

```bash
# List log files (rotated logs have .1, .2, etc. extensions)
ls -lh logs/

# Expected output includes:
# - *.log (current active logs)
# - *.log.1 (most recent rotation)
# - *.log.2.gz, *.log.3.gz, etc. (older compressed rotations)
```

### Customizing Rotation Policy

To modify rotation settings, edit `config/logrotate.conf`:

**Change rotation size**:
```
size 50M  # Change to 100M for 100MB, 10M for 10MB, etc.
```

**Change retention count**:
```
rotate 7  # Change to 14 for 14 rotations, 30 for 30 rotations, etc.
```

**After making changes**, reinstall the configuration:
```bash
sudo bash scripts/setup-logrotate.sh
```

### Log Monitoring

**View recent logs**:
```bash
# PM2 logs (last 100 lines from all processes)
pm2 logs --lines 100

# Specific service logs
pm2 logs cattyshack-web --lines 50
pm2 logs cattyshack-events --lines 50

# View specific log file
tail -f logs/event-service.log
```

**Search logs for errors**:
```bash
# Search all current logs for errors
grep -i error logs/*.log

# Search specific time range (if timestamps present)
grep "2025-10-28" logs/event-service.log | grep ERROR
```

### Log Cleanup

If you need to manually clear logs:

```bash
# Remove all log files (WARNING: deletes all logs)
rm -f logs/*.log logs/*.log.* logs/*.gz

# Remove only rotated logs (keep current logs)
rm -f logs/*.log.* logs/*.gz

# PM2 will recreate log files automatically on next write
```

### Troubleshooting Log Rotation

**Rotation not occurring**:
- Check if logrotate is installed: `logrotate --version`
- Verify configuration exists: `ls -l /etc/logrotate.d/cattyshack`
- Test configuration: `sudo logrotate -d /etc/logrotate.d/cattyshack`
- Check system cron is running (logrotate typically runs daily via cron)

**Permission errors**:
- Ensure log directory has correct permissions: `chmod 755 logs/`
- Ensure user/group in config matches your system
- Edit `config/logrotate.conf` and update `create 0644 user group` line

**Logs still growing too large**:
- Reduce rotation size in `config/logrotate.conf` (e.g., `size 10M`)
- Increase rotation frequency by forcing daily rotation
- Check if all log files are included in the configuration

## Troubleshooting

### Import Errors

**Symptom**: Module not found for `@cattyshack/shared`
**Fix**:
- Ensure `npm install` has been run at root
- Verify workspace is listed in root `package.json` workspaces array
- Check import path matches package.json exports

### Database Errors

**Symptom**: Database file not found or locked
**Fix**:
- Ensure `data/` directory exists
- Check `DB_FILE_NAME` path in `.env`
- Verify only one process is accessing database
- Run migrations: `npm run db:migrate`

### Build Errors

**Symptom**: Build fails with TypeScript errors
**Fix**:
- Run `npm install` at root to sync dependencies
- Check shared package has all required dependencies
- Verify TypeScript paths are configured correctly

### TikTok Connection Errors

**Symptom**: Event service can't connect to TikTok
**Fix**:
- Verify `TIKTOK_UNIQUE_ID` is correct (exact username)
- Ensure user is live streaming
- Check network connectivity
- Review logs in `logs/events-error.log`

### Hue Bridge Errors

**Symptom**: Can't control lights
**Fix**:
- Verify `HUE_BRIDGE_IP` is correct and bridge is accessible
- Ensure `HUE_USERNAME` is valid (create new user if needed)
- Test connection using frontend discovery/test features
- Check bridge is on same network

## Additional Resources

- **Frontend Development**: See [apps/web/CLAUDE.md](apps/web/CLAUDE.md) for detailed Nuxt/Vue guidelines
- **Nuxt Documentation**: https://nuxt.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs
- **Philips Hue API**: https://developers.meethue.com/
- **TikTok Live Connector**: https://github.com/zerodytrash/TikTok-Live-Connector
